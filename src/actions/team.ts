"use server";

import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import { users, participants, participantAssignments } from "@/db/schema";
import { requireUser } from "@/lib/session";
import { isOrgAdmin } from "@/lib/rbac";
import { logAudit } from "@/lib/audit";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSiteUrl } from "@/lib/site";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

const VALID_ROLES = ["org_admin", "practitioner", "implementer", "caregiver", "learner"] as const;
type Role = (typeof VALID_ROLES)[number];

// Roles that need a specific participant to be useful (their capability is
// case-by-case, see lib/rbac.ts) as opposed to org_admin/practitioner, which
// already have full org-wide access without a participantAssignments row.
const CASE_ROLES = new Set(["implementer", "caregiver", "learner"]);

export type InviteFormState = { error: string | null };

// Used with useActionState (see InviteForm.tsx) rather than a plain form
// action, so expected failures (bad input, an email that's already active)
// show up inline on the form instead of crashing to Next.js's generic
// "A server error occurred" page — that page is what an *uncaught* throw
// from a Server Action produces, which is what this function used to do
// for every validation failure. Only a genuinely unexpected error should
// still throw and hit that fallback.
export async function inviteTeamMember(_prevState: InviteFormState, formData: FormData): Promise<InviteFormState> {
  const user = await requireUser();
  if (!isOrgAdmin(user.role)) return { error: "Only an organization admin can invite new accounts." };

  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const role = String(formData.get("role") || "") as Role;
  const participantMode = String(formData.get("participantMode") || "none"); // "new" | "existing" | "none"
  const existingParticipantId = String(formData.get("existingParticipantId") || "").trim();
  const newParticipantName = String(formData.get("newParticipantName") || "").trim() || name;
  const newParticipantCode = String(formData.get("newParticipantCode") || "").trim();
  const workspaceType = String(formData.get("workspaceType") || "clinical");
  const selfDirected = formData.get("selfDirected") === "on";

  if (!name || !email) return { error: "Name and email are required." };
  if (!VALID_ROLES.includes(role)) return { error: "Invalid role." };

  const admin = createAdminClient();

  // An email already existing in `users` doesn't tell us whether that
  // invite was ever actually completed — a link can go to spam, expire,
  // or (as happened once already) fail client-side. Supabase's Auth API
  // has no reliable "did they ever sign in" signal for this either:
  // verifying an invite link itself stamps last_sign_in_at server-side,
  // even if the browser never got as far as setting a password — so that
  // can't distinguish "stuck mid-invite" from "fully active" either.
  // Rather than guess, treat resubmitting an existing email as an
  // intentional resend. inviteUserByEmail can't be called a second time
  // for the same address — Supabase errors "already registered" even for
  // an unconfirmed account (a known gap: see supabase/auth#2180) — so
  // resending uses resetPasswordForEmail instead. That works whether the
  // person never finished setting a password (lets them set one for the
  // first time) or is already fully active (an ordinary password reset),
  // and lands on the exact same /accept-invite flow either way.
  const [existingByEmail] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  // Only treat it as a resend if there's a Supabase Auth account to resend
  // to — an app-level row with no authUserId (shouldn't normally happen)
  // falls through to the ordinary create-new path below to self-heal.
  const resendingForUserId = existingByEmail?.authUserId ? existingByEmail.id : null;

  // Resolve or create the participant this invite should be linked to, for
  // roles whose capability is case-by-case rather than org-wide.
  let participantId: string | null = null;
  if (CASE_ROLES.has(role) && participantMode === "existing" && existingParticipantId) {
    const [existingParticipant] = await db
      .select()
      .from(participants)
      .where(and(eq(participants.id, existingParticipantId), eq(participants.orgId, user.orgId)))
      .limit(1);
    if (!existingParticipant) return { error: "Selected participant not found in this organization." };
    participantId = existingParticipant.id;
  } else if (CASE_ROLES.has(role) && participantMode === "new") {
    if (!newParticipantCode) return { error: "Participant ID is required to create a new participant." };
    const [created] = await db
      .insert(participants)
      .values({ orgId: user.orgId, displayName: newParticipantName, participantCode: newParticipantCode, workspaceType })
      .returning();
    participantId = created.id;
  }

  // Create (reusing the existing row if there is one, even without an
  // authUserId yet) or insert fresh — email is unique, so an existing row
  // must be updated rather than inserted into again.
  let targetUserId: string;
  if (existingByEmail) {
    await db.update(users).set({ name, role }).where(eq(users.id, existingByEmail.id));
    targetUserId = existingByEmail.id;
  } else {
    const [newUser] = await db.insert(users).values({ orgId: user.orgId, name, email, role }).returning();
    targetUserId = newUser.id;
  }

  if (resendingForUserId) {
    const { error: resendError } = await admin.auth.resetPasswordForEmail(email, {
      redirectTo: `${getSiteUrl()}/accept-invite`,
    });
    if (resendError) return { error: `Couldn't resend: ${resendError.message}` };
    // authUserId is already set from the original invite — nothing to update.
  } else {
    // First time this email has ever been through this flow — send the
    // real invite (creates the Supabase Auth account and emails the link).
    const { data: invited, error: inviteError } = await admin.auth.admin.inviteUserByEmail(email, {
      redirectTo: `${getSiteUrl()}/accept-invite`,
      data: { name },
    });

    if (inviteError) {
      if (!existingByEmail) {
        // Roll back the app-level row so a failed first invite doesn't
        // leave a dangling, unusable account (and frees the email for retry).
        await db.delete(users).where(eq(users.id, targetUserId));
      }
      return { error: `Couldn't send invite: ${inviteError.message}` };
    }

    await db.update(users).set({ authUserId: invited.user.id }).where(eq(users.id, targetUserId));
  }

  if (participantId) {
    const roleOnCaseValues = role === "learner" ? (selfDirected ? ["learner", "practitioner"] : ["learner"]) : [role];
    for (const roleOnCase of roleOnCaseValues) {
      const [already] = await db
        .select()
        .from(participantAssignments)
        .where(
          and(
            eq(participantAssignments.participantId, participantId),
            eq(participantAssignments.userId, targetUserId),
            eq(participantAssignments.roleOnCase, roleOnCase)
          )
        )
        .limit(1);
      if (!already) {
        await db.insert(participantAssignments).values({ participantId, userId: targetUserId, roleOnCase });
      }
    }
  }

  await logAudit({
    orgId: user.orgId,
    userId: user.id,
    action: resendingForUserId ? "team_member_invite_resent" : "team_member_invited",
    entityType: "user",
    entityId: targetUserId,
    metadata: { email, role, participantId },
  });

  revalidatePath("/organization");
  redirect("/organization");
}

// Grants or revokes self-directed status on an EXISTING learner who's
// already linked to their own participant record — i.e. adds/removes the
// "practitioner" participantAssignments row alongside their existing
// "learner" row, the same dual-capability pattern inviteTeamMember's
// selfDirected checkbox grants at invite time. This is what closes the gap
// flagged in the architecture doc: capability was previously only settable
// at invite/signup time, with no way to change it after the fact.
export async function setSelfDirected(formData: FormData) {
  const admin = await requireUser();
  if (!isOrgAdmin(admin.role)) redirect("/people");

  const targetUserId = String(formData.get("userId") || "");
  const participantId = String(formData.get("participantId") || "");
  const enable = formData.get("enable") === "true";

  const [targetUser] = await db.select().from(users).where(eq(users.id, targetUserId)).limit(1);
  if (!targetUser || targetUser.orgId !== admin.orgId) redirect("/people");
  // Self-directed only makes sense for someone whose global role is
  // "learner" — mirrors the same restriction the invite form's checkbox
  // has (it only renders when role === "learner").
  if (targetUser.role !== "learner") redirect(`/people/${participantId}`);

  const [participant] = await db.select().from(participants).where(eq(participants.id, participantId)).limit(1);
  if (!participant || participant.orgId !== admin.orgId) redirect("/people");

  // Only grant/revoke on a participant this user is actually the learner
  // for — self-directed means "manages their own case," so there must be
  // an existing "learner" row on this exact participant to build on.
  const [learnerRow] = await db
    .select()
    .from(participantAssignments)
    .where(
      and(
        eq(participantAssignments.userId, targetUserId),
        eq(participantAssignments.participantId, participantId),
        eq(participantAssignments.roleOnCase, "learner")
      )
    )
    .limit(1);
  if (!learnerRow) redirect(`/people/${participantId}`);

  const [practitionerRow] = await db
    .select()
    .from(participantAssignments)
    .where(
      and(
        eq(participantAssignments.userId, targetUserId),
        eq(participantAssignments.participantId, participantId),
        eq(participantAssignments.roleOnCase, "practitioner")
      )
    )
    .limit(1);

  if (enable && !practitionerRow) {
    await db.insert(participantAssignments).values({ participantId, userId: targetUserId, roleOnCase: "practitioner" });
    await logAudit({
      orgId: admin.orgId,
      userId: admin.id,
      action: "self_directed_granted",
      entityType: "participant_assignment",
      entityId: participantId,
      metadata: { targetUserId },
    });
  } else if (!enable && practitionerRow) {
    await db.delete(participantAssignments).where(eq(participantAssignments.id, practitionerRow.id));
    await logAudit({
      orgId: admin.orgId,
      userId: admin.id,
      action: "self_directed_revoked",
      entityType: "participant_assignment",
      entityId: participantId,
      metadata: { targetUserId },
    });
  }
  // No-op if the state already matches what was requested — keeps this
  // action idempotent for a double-click or a stale form resubmit.

  revalidatePath(`/people/${participantId}`);
}

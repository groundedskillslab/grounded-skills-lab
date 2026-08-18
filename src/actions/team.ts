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

  const [existingByEmail] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  let resendingForUserId: string | null = null;

  if (existingByEmail) {
    // An email already being in `users` doesn't necessarily mean the
    // invite was ever completed — a link can go to spam, expire, or (as
    // happened once already) fail client-side. If they've never actually
    // signed in, treat this submission as "resend the invite" instead of
    // blocking outright.
    let everSignedIn = true; // fail safe: assume active unless proven otherwise
    if (existingByEmail.authUserId) {
      const { data: authUserData } = await admin.auth.admin.getUserById(existingByEmail.authUserId);
      everSignedIn = !!authUserData?.user?.last_sign_in_at;
    }
    if (everSignedIn) {
      return { error: `${email} already has an account.` };
    }
    resendingForUserId = existingByEmail.id;
  }

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

  // Create (or reuse, on resend) the app-level profile row.
  let targetUserId: string;
  if (resendingForUserId) {
    await db.update(users).set({ name, role }).where(eq(users.id, resendingForUserId));
    targetUserId = resendingForUserId;
  } else {
    const [newUser] = await db.insert(users).values({ orgId: user.orgId, name, email, role }).returning();
    targetUserId = newUser.id;
  }

  // Invite via Supabase Auth — sends the client an email with a link to set
  // their own password. redirectTo lands them on /accept-invite (public
  // path, see middleware.ts) which finishes the password setup. Calling
  // this again for an existing-but-unconfirmed email resends a fresh
  // link and invalidates the old one.
  const { data: invited, error: inviteError } = await admin.auth.admin.inviteUserByEmail(email, {
    redirectTo: `${getSiteUrl()}/accept-invite`,
    data: { name },
  });

  if (inviteError) {
    if (!resendingForUserId) {
      // Roll back the app-level row so a failed first invite doesn't leave
      // a dangling, unusable account (and free up the unique email for retry).
      await db.delete(users).where(eq(users.id, targetUserId));
    }
    return { error: `Couldn't send invite: ${inviteError.message}` };
  }

  await db.update(users).set({ authUserId: invited.user.id }).where(eq(users.id, targetUserId));

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

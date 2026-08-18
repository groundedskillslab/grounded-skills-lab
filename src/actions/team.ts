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

export async function inviteTeamMember(formData: FormData) {
  const user = await requireUser();
  if (!isOrgAdmin(user.role)) throw new Error("Only an organization admin can invite new accounts.");

  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const role = String(formData.get("role") || "") as Role;
  const participantMode = String(formData.get("participantMode") || "none"); // "new" | "existing" | "none"
  const existingParticipantId = String(formData.get("existingParticipantId") || "").trim();
  const newParticipantName = String(formData.get("newParticipantName") || "").trim() || name;
  const newParticipantCode = String(formData.get("newParticipantCode") || "").trim();
  const workspaceType = String(formData.get("workspaceType") || "clinical");
  const selfDirected = formData.get("selfDirected") === "on";

  if (!name || !email) throw new Error("Name and email are required.");
  if (!VALID_ROLES.includes(role)) throw new Error("Invalid role.");

  const [existingByEmail] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (existingByEmail) throw new Error(`${email} already has an account.`);

  // Resolve or create the participant this invite should be linked to, for
  // roles whose capability is case-by-case rather than org-wide.
  let participantId: string | null = null;
  if (CASE_ROLES.has(role) && participantMode === "existing" && existingParticipantId) {
    const [existingParticipant] = await db
      .select()
      .from(participants)
      .where(and(eq(participants.id, existingParticipantId), eq(participants.orgId, user.orgId)))
      .limit(1);
    if (!existingParticipant) throw new Error("Selected participant not found in this organization.");
    participantId = existingParticipant.id;
  } else if (CASE_ROLES.has(role) && participantMode === "new") {
    if (!newParticipantCode) throw new Error("Participant ID is required to create a new participant.");
    const [created] = await db
      .insert(participants)
      .values({ orgId: user.orgId, displayName: newParticipantName, participantCode: newParticipantCode, workspaceType })
      .returning();
    participantId = created.id;
  }

  // Create the app-level profile row first (no authUserId yet).
  const [newUser] = await db
    .insert(users)
    .values({ orgId: user.orgId, name, email, role })
    .returning();

  // Invite via Supabase Auth — sends the client an email with a link to set
  // their own password. redirectTo lands them on /accept-invite (public
  // path, see middleware.ts) which finishes the password setup.
  const admin = createAdminClient();
  const { data: invited, error: inviteError } = await admin.auth.admin.inviteUserByEmail(email, {
    redirectTo: `${getSiteUrl()}/accept-invite`,
    data: { name },
  });

  if (inviteError) {
    // Roll back the app-level row so a failed invite doesn't leave a
    // dangling, unusable account (and free up the unique email for retry).
    await db.delete(users).where(eq(users.id, newUser.id));
    throw new Error(`Couldn't send invite: ${inviteError.message}`);
  }

  await db.update(users).set({ authUserId: invited.user.id }).where(eq(users.id, newUser.id));

  if (participantId) {
    if (role === "learner") {
      await db.insert(participantAssignments).values({ participantId, userId: newUser.id, roleOnCase: "learner" });
      if (selfDirected) {
        await db.insert(participantAssignments).values({ participantId, userId: newUser.id, roleOnCase: "practitioner" });
      }
    } else {
      // caregiver | implementer — roleOnCase matches their global role.
      await db.insert(participantAssignments).values({ participantId, userId: newUser.id, roleOnCase: role });
    }
  }

  await logAudit({
    orgId: user.orgId,
    userId: user.id,
    action: "team_member_invited",
    entityType: "user",
    entityId: newUser.id,
    metadata: { email, role, participantId },
  });

  revalidatePath("/organization");
  redirect("/organization");
}

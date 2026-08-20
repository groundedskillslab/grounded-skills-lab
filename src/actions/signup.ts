"use server";

import { eq } from "drizzle-orm";
import { db } from "@/db";
import { organizations, users, participants, participantAssignments } from "@/db/schema";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAudit } from "@/lib/audit";
import type { WorkspaceType } from "@/lib/labels";
import { redirect } from "next/navigation";

export type SignupFormState = { error: string | null };

const WORKSPACE_PREFIXES: Record<WorkspaceType, string> = {
  clinical: "CL",
  performance: "PF",
  education: "ED",
  general: "GN",
};

function generateParticipantCode(workspaceType: WorkspaceType): string {
  const prefix = WORKSPACE_PREFIXES[workspaceType] ?? "GN";
  const suffix = Math.floor(1000 + Math.random() * 9000); // 4 digits
  return `${prefix}-${suffix}`;
}

// Public, unauthenticated self-signup for someone working on their own
// skills independently — "I'm here to work on my own skills," no coach,
// no invite required. Deliberately narrow in what it grants (guardrail
// set explicitly by Greg when this was scoped 2026-08-20): the account's
// *global* role is always "learner" — never "practitioner" or
// "org_admin" — and the only capability it creates is scoped to this
// person's own, brand-new participant record: a "learner" row plus a
// "practitioner" row on themselves only. That's the same self-directed
// pattern org_admins can already grant via Invite Someone's
// "self-directed" toggle (see signUpSelfDirected's sibling,
// inviteTeamMember, in src/actions/team.ts) — merged learner +
// practitioner-for-self, nothing broader. This never grants org-wide
// practitioner access, and it never grants any capability on anyone
// else's participant — managing another person's programs still requires
// an actual practitioner relationship, granted the normal way (an
// org_admin invites them with that specific capability).
//
// Each self-signup gets its OWN new organization — they are never added
// to an existing one — so nobody already using the app gets visibility
// into a stranger's independent account, and vice versa. This is the
// "I'm here to work on my own skills" path; "I'm working with a
// coach/practitioner/organization" is the existing invite flow
// (src/actions/team.ts) — that one is never self-service, it always
// starts with an org_admin.
export async function signUpIndependent(_prevState: SignupFormState, formData: FormData): Promise<SignupFormState> {
  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");
  const confirmPassword = String(formData.get("confirmPassword") || "");
  const workspaceType = String(formData.get("workspaceType") || "general") as WorkspaceType;

  if (!name || !email) return { error: "Name and email are required." };
  if (password.length < 8) return { error: "Password must be at least 8 characters." };
  if (password !== confirmPassword) return { error: "Passwords don't match." };

  const [existingByEmail] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (existingByEmail) {
    return { error: "An account with this email already exists. Try signing in instead." };
  }

  const admin = createAdminClient();

  // Build the app-level rows first — a brand-new org, the user, their own
  // participant, and the self-directed capability rows — then create the
  // real Supabase Auth account last, rolling back everything above if that
  // fails. Same ordering and cleanup rationale as inviteTeamMember: never
  // leave a dangling, unusable app-level row behind on a partial failure.
  const [org] = await db.insert(organizations).values({ name: `${name}'s Workspace` }).returning();

  const [newUser] = await db
    .insert(users)
    .values({ orgId: org.id, name, email, role: "learner" })
    .returning();

  const [participant] = await db
    .insert(participants)
    .values({
      orgId: org.id,
      displayName: name,
      participantCode: generateParticipantCode(workspaceType),
      workspaceType,
    })
    .returning();

  for (const roleOnCase of ["learner", "practitioner"] as const) {
    await db.insert(participantAssignments).values({ participantId: participant.id, userId: newUser.id, roleOnCase });
  }

  // email_confirm: true — this person just chose their own password right
  // here in the form, so there's no separate "click a link to set a
  // password" step the way the admin-invite flow needs. It also means
  // public self-signup never draws on Supabase's shared email-sending
  // quota (see the 2-emails/hour note in the architecture doc) — an
  // important difference from the invite flow, since this path can be
  // hit by anyone, not just people an org_admin has already vetted.
  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name },
  });

  if (createError || !created?.user) {
    await db.delete(participantAssignments).where(eq(participantAssignments.participantId, participant.id));
    await db.delete(participants).where(eq(participants.id, participant.id));
    await db.delete(users).where(eq(users.id, newUser.id));
    await db.delete(organizations).where(eq(organizations.id, org.id));
    return { error: `Couldn't create your account: ${createError?.message ?? "unknown error"}` };
  }

  await db.update(users).set({ authUserId: created.user.id }).where(eq(users.id, newUser.id));

  await logAudit({
    orgId: org.id,
    userId: newUser.id,
    action: "self_signup",
    entityType: "user",
    entityId: newUser.id,
    metadata: { email, workspaceType },
  });

  redirect("/login?justSignedUp=1");
}

import { db } from "@/db";
import { participantAssignments } from "@/db/schema";
import { and, eq, inArray } from "drizzle-orm";
import { Role } from "./roles";

export { ROLE_LABELS } from "./roles";
export type { Role } from "./roles";

type SessionUser = { id: string; role: string };

/**
 * Org-wide roles: full visibility and management capability across every
 * participant in the org, without needing a per-participant assignment row.
 * This is intentionally small — org_admin and a global "practitioner" (e.g. a
 * BCBA employed by the org). Everyone else's capability is case-by-case,
 * driven by participantAssignments below.
 */
export function isFullAccessRole(role: string) {
  return role === "org_admin" || role === "practitioner";
}

export function isOrgAdmin(role: string) {
  return role === "org_admin";
}

/**
 * Case-level capability model.
 *
 * A user's global `role` (org_admin | practitioner | implementer | caregiver |
 * learner) is their account identity and default view — it is deliberately
 * NOT, by itself, the permission gate for what they can do with a specific
 * participant. That gate is `participantAssignments.roleOnCase`, which
 * records one capability a user holds *for that participant*.
 *
 * A single user can hold more than one capability row for the same
 * participant. The clearest example is self-directed practice: someone
 * training themselves (no separate coach/practitioner) holds BOTH a
 * "learner" row and a "practitioner" row for their own participant record.
 * Their global role can stay "learner" — they don't become an org-wide
 * practitioner just because they manage their own case, and if they later
 * start coaching someone else, that person gets its own "practitioner"
 * assignment row without touching this user's account type.
 *
 * So the question every check below asks is never "what role is this user?"
 * — it's "does this user hold the needed capability for THIS participant?"
 */
async function hasCaseCapability(userId: string, participantId: string, capability: string) {
  const [row] = await db
    .select()
    .from(participantAssignments)
    .where(
      and(
        eq(participantAssignments.userId, userId),
        eq(participantAssignments.participantId, participantId),
        eq(participantAssignments.roleOnCase, capability)
      )
    )
    .limit(1);
  return !!row;
}

async function caseCapabilities(userId: string, participantId: string): Promise<string[]> {
  const rows = await db
    .select({ roleOnCase: participantAssignments.roleOnCase })
    .from(participantAssignments)
    .where(and(eq(participantAssignments.userId, userId), eq(participantAssignments.participantId, participantId)));
  return rows.map((r) => r.roleOnCase);
}

/** Can this user design/edit programs, targets, and prompt hierarchies for this participant? */
export async function canManagePrograms(user: SessionUser, participantId: string) {
  if (isFullAccessRole(user.role)) return true;
  return hasCaseCapability(user.id, participantId, "practitioner");
}

/** Can this user run sessions / record trial data for this participant? */
export async function canRunSessions(user: SessionUser, participantId: string) {
  if (isFullAccessRole(user.role)) return true;
  const caps = await caseCapabilities(user.id, participantId);
  return caps.includes("practitioner") || caps.includes("implementer");
}

/** Can this user score an implementation-fidelity observation for this participant? */
export async function canScoreFidelity(user: SessionUser, participantId: string) {
  return canManagePrograms(user, participantId);
}

/** Can this user confirm mastery for this participant? */
export async function canConfirmMastery(user: SessionUser, participantId: string) {
  return canManagePrograms(user, participantId);
}

/**
 * True if this user holds "practitioner" or "implementer" on at least one
 * participant, anywhere in the org — used to decide whether to surface
 * session-running entry points before a specific participant is chosen.
 */
export async function hasRunSessionsCapabilityAnywhere(userId: string) {
  const rows = await db
    .select({ id: participantAssignments.id })
    .from(participantAssignments)
    .where(and(eq(participantAssignments.userId, userId), inArray(participantAssignments.roleOnCase, ["practitioner", "implementer"])))
    .limit(1);
  return rows.length > 0;
}

/**
 * Returns the list of participant IDs a non-full-access user (implementer,
 * caregiver, learner, or a self-directed practitioner) is permitted to see.
 * Full-access roles see the whole org (handled separately by org scoping).
 */
export async function accessibleParticipantIds(userId: string): Promise<string[]> {
  const rows = await db
    .select({ participantId: participantAssignments.participantId })
    .from(participantAssignments)
    .where(eq(participantAssignments.userId, userId));
  return [...new Set(rows.map((r) => r.participantId))];
}

/**
 * True if this user IS the learner on this participant's case — as opposed
 * to a coach/practitioner managing someone else's. Used to adapt copy (e.g.
 * "how you'll teach it" vs "how you'll practice it") for self-directed users
 * building their own program, since the self-directed pattern always grants
 * a "learner" roleOnCase row on the person's own participant record.
 */
export async function isSelfLearner(userId: string, participantId: string) {
  return hasCaseCapability(userId, participantId, "learner");
}

export async function userCanAccessParticipant(userId: string, role: string, participantId: string) {
  if (isFullAccessRole(role)) return true;
  const [row] = await db
    .select()
    .from(participantAssignments)
    .where(and(eq(participantAssignments.userId, userId), eq(participantAssignments.participantId, participantId)))
    .limit(1);
  return !!row;
}

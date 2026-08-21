"use server";

import { requireUser } from "@/lib/session";
import { db } from "@/db";
import {
  participants,
  participantAssignments,
  domains,
  goals,
  programs,
  programSteps,
  targets,
  masteryRules,
  generalizationDimensions,
  generalizationProbes,
  maintenancePlans,
  maintenanceChecks,
  sessions,
  trialData,
  fidelityProtocols,
  fidelityItems,
  fidelityObservations,
  assignments,
  practiceLogs,
  selfMonitoringEntries,
  programChanges,
  aiDrafts,
} from "@/db/schema";
import { isFullAccessRole, isOrgAdmin } from "@/lib/rbac";
import { logAudit } from "@/lib/audit";
import { eq, inArray } from "drizzle-orm";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export async function createParticipant(formData: FormData) {
  const user = await requireUser();
  if (!isFullAccessRole(user.role)) throw new Error("Not authorized to create participants.");

  const displayName = String(formData.get("displayName") || "").trim();
  const participantCode = String(formData.get("participantCode") || "").trim();
  const workspaceType = String(formData.get("workspaceType") || "clinical");
  const domainName = String(formData.get("domainName") || "").trim();

  if (!displayName || !participantCode) throw new Error("Name and ID are required.");

  const [participant] = await db
    .insert(participants)
    .values({ orgId: user.orgId, displayName, participantCode, workspaceType, primaryPractitionerId: user.id })
    .returning();

  await db.insert(participantAssignments).values({ participantId: participant.id, userId: user.id, roleOnCase: "practitioner" });

  if (domainName) {
    await db.insert(domains).values({ participantId: participant.id, name: domainName });
  }

  await logAudit({ orgId: user.orgId, userId: user.id, action: "participant_created", entityType: "participant", entityId: participant.id, metadata: { displayName } });

  revalidatePath("/people");
  redirect(`/people/${participant.id}`);
}

// Toggles the `archived` flag (present in the schema since the original
// build but never wired up to anything until now) — hides a participant
// from the active /people list without touching any of their data. This is
// the option to reach for whenever there's real history worth keeping;
// deleteParticipant below is for the opposite case (test/demo data with
// nothing worth preserving).
export async function archiveParticipant(formData: FormData) {
  const user = await requireUser();
  if (!isOrgAdmin(user.role)) redirect("/people");

  const participantId = String(formData.get("participantId") || "");
  const archived = formData.get("archived") === "true";

  const [participant] = await db.select().from(participants).where(eq(participants.id, participantId)).limit(1);
  if (!participant || participant.orgId !== user.orgId) redirect("/people");

  await db.update(participants).set({ archived }).where(eq(participants.id, participantId));

  await logAudit({
    orgId: user.orgId,
    userId: user.id,
    action: archived ? "participant_archived" : "participant_unarchived",
    entityType: "participant",
    entityId: participantId,
    metadata: { displayName: participant.displayName },
  });

  revalidatePath("/people");
  revalidatePath(`/people/${participantId}`);
  redirect(archived ? "/people" : `/people/${participantId}`);
}

// Permanently deletes a participant and everything scoped to them: goal
// hierarchy, sessions/trial data, fidelity observations, assignments/
// practice logs, and every other table below that has no other purpose
// than describing this one participant's case. There's no soft-delete
// here on purpose — Greg asked for this specifically for cleaning up test
// data with no real history worth preserving; if a real reason to keep an
// inactive participant's history around comes up later, that calls for a
// separate "archive" action using the `archived` column that already
// exists on `participants` (currently unused), not a variant of this one.
//
// Schema has no database-level foreign keys (see src/db/schema.ts — no
// .references() calls anywhere), so nothing here is DB-enforced; the
// dependency order below is just good hygiene, and the whole thing runs
// in one transaction so a failure partway through leaves nothing deleted
// rather than a half-deleted participant.
//
// Restricted to org_admin (not the wider isFullAccessRole used for create)
// — deleting is destructive and irreversible in a way creating isn't.
export async function deleteParticipant(formData: FormData) {
  const user = await requireUser();
  if (!isOrgAdmin(user.role)) redirect("/people");

  const participantId = String(formData.get("participantId") || "");
  const [participant] = await db.select().from(participants).where(eq(participants.id, participantId)).limit(1);
  if (!participant || participant.orgId !== user.orgId) redirect("/people");

  await db.transaction(async (tx) => {
    const programRows = await tx.select({ id: programs.id }).from(programs).where(eq(programs.participantId, participantId));
    const programIds = programRows.map((p) => p.id);

    const sessionRows = await tx.select({ id: sessions.id }).from(sessions).where(eq(sessions.participantId, participantId));
    const sessionIds = sessionRows.map((s) => s.id);

    const targetRows = programIds.length
      ? await tx.select({ id: targets.id }).from(targets).where(inArray(targets.programId, programIds))
      : [];
    const targetIds = targetRows.map((t) => t.id);

    const protocolRows = programIds.length
      ? await tx.select({ id: fidelityProtocols.id }).from(fidelityProtocols).where(inArray(fidelityProtocols.programId, programIds))
      : [];
    const protocolIds = protocolRows.map((p) => p.id);

    const planRows = programIds.length
      ? await tx.select({ id: maintenancePlans.id }).from(maintenancePlans).where(inArray(maintenancePlans.programId, programIds))
      : [];
    const planIds = planRows.map((p) => p.id);

    if (sessionIds.length) await tx.delete(trialData).where(inArray(trialData.sessionId, sessionIds));
    if (planIds.length) await tx.delete(maintenanceChecks).where(inArray(maintenanceChecks.maintenancePlanId, planIds));
    if (programIds.length) {
      await tx.delete(maintenancePlans).where(inArray(maintenancePlans.programId, programIds));
      await tx.delete(generalizationProbes).where(inArray(generalizationProbes.programId, programIds));
      await tx.delete(generalizationDimensions).where(inArray(generalizationDimensions.programId, programIds));
      await tx.delete(programChanges).where(inArray(programChanges.programId, programIds));
      await tx.delete(aiDrafts).where(inArray(aiDrafts.programId, programIds));
      await tx.delete(masteryRules).where(inArray(masteryRules.programId, programIds));
    }
    if (targetIds.length) await tx.delete(masteryRules).where(inArray(masteryRules.targetId, targetIds));
    if (protocolIds.length) await tx.delete(fidelityItems).where(inArray(fidelityItems.protocolId, protocolIds));
    await tx.delete(fidelityObservations).where(eq(fidelityObservations.participantId, participantId));
    if (programIds.length) await tx.delete(fidelityProtocols).where(inArray(fidelityProtocols.programId, programIds));

    await tx.delete(practiceLogs).where(eq(practiceLogs.participantId, participantId));
    await tx.delete(assignments).where(eq(assignments.participantId, participantId));
    await tx.delete(selfMonitoringEntries).where(eq(selfMonitoringEntries.participantId, participantId));

    if (programIds.length) {
      await tx.delete(targets).where(inArray(targets.programId, programIds));
      await tx.delete(programSteps).where(inArray(programSteps.programId, programIds));
    }
    await tx.delete(programs).where(eq(programs.participantId, participantId));
    await tx.delete(sessions).where(eq(sessions.participantId, participantId));
    await tx.delete(goals).where(eq(goals.participantId, participantId));
    await tx.delete(domains).where(eq(domains.participantId, participantId));
    await tx.delete(participantAssignments).where(eq(participantAssignments.participantId, participantId));
    await tx.delete(participants).where(eq(participants.id, participantId));
  });

  // Audit logs are immutable by design (see the RLS policy notes in the
  // architecture doc) — this entry outlives the participant it describes,
  // which is the point: it's the paper trail that someone was deleted.
  await logAudit({
    orgId: user.orgId,
    userId: user.id,
    action: "participant_deleted",
    entityType: "participant",
    entityId: participantId,
    metadata: { displayName: participant.displayName, participantCode: participant.participantCode },
  });

  revalidatePath("/people");
  redirect("/people");
}

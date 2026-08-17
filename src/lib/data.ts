import { db } from "@/db";
import {
  participants,
  participantAssignments,
  domains,
  goals,
  programs,
  programSteps,
  targets,
  promptHierarchies,
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
  users,
  templates,
  auditLogs,
} from "@/db/schema";
import { and, desc, eq, inArray } from "drizzle-orm";
import { isFullAccessRole, accessibleParticipantIds } from "@/lib/rbac";

export async function listParticipants(orgId: string, userId: string, role: string) {
  const rows = await db.select().from(participants).where(and(eq(participants.orgId, orgId), eq(participants.archived, false)));
  if (isFullAccessRole(role)) return rows;
  const allowed = new Set(await accessibleParticipantIds(userId));
  return rows.filter((r) => allowed.has(r.id));
}

export async function getParticipant(id: string) {
  const [row] = await db.select().from(participants).where(eq(participants.id, id)).limit(1);
  return row;
}

export async function getParticipantTeam(participantId: string) {
  const rows = await db
    .select({ assignment: participantAssignments, user: users })
    .from(participantAssignments)
    .innerJoin(users, eq(participantAssignments.userId, users.id))
    .where(eq(participantAssignments.participantId, participantId));
  return rows;
}

export async function getParticipantGoals(participantId: string) {
  return db.select().from(goals).where(eq(goals.participantId, participantId));
}

export async function getParticipantDomains(participantId: string) {
  return db.select().from(domains).where(eq(domains.participantId, participantId));
}

export async function getParticipantPrograms(participantId: string) {
  return db.select().from(programs).where(and(eq(programs.participantId, participantId), eq(programs.archived, false)));
}

export async function getProgram(programId: string) {
  const [row] = await db.select().from(programs).where(eq(programs.id, programId)).limit(1);
  return row;
}

export async function getProgramSteps(programId: string) {
  const rows = await db.select().from(programSteps).where(eq(programSteps.programId, programId));
  return rows.sort((a, b) => a.orderIndex - b.orderIndex);
}

export async function getProgramTargets(programId: string) {
  const rows = await db.select().from(targets).where(and(eq(targets.programId, programId), eq(targets.archived, false)));
  return rows.sort((a, b) => a.orderIndex - b.orderIndex);
}

export async function getPromptHierarchy(id: string | null) {
  if (!id) return null;
  const [row] = await db.select().from(promptHierarchies).where(eq(promptHierarchies.id, id)).limit(1);
  return row || null;
}

export async function listPromptHierarchies(orgId: string) {
  return db.select().from(promptHierarchies).where(eq(promptHierarchies.orgId, orgId));
}

export async function getMasteryRuleForTarget(targetId: string) {
  const [row] = await db.select().from(masteryRules).where(eq(masteryRules.targetId, targetId)).limit(1);
  return row || null;
}

export async function getGeneralizationDimensions(programId: string) {
  return db.select().from(generalizationDimensions).where(eq(generalizationDimensions.programId, programId));
}

export async function getGeneralizationProbes(programId: string) {
  return db.select().from(generalizationProbes).where(eq(generalizationProbes.programId, programId)).orderBy(desc(generalizationProbes.date));
}

export async function getMaintenancePlan(programId: string) {
  const [plan] = await db.select().from(maintenancePlans).where(eq(maintenancePlans.programId, programId)).limit(1);
  if (!plan) return null;
  const checks = await db.select().from(maintenanceChecks).where(eq(maintenanceChecks.maintenancePlanId, plan.id));
  return { plan, checks: checks.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime()) };
}

export async function getFidelityProtocol(programId: string) {
  const [protocol] = await db.select().from(fidelityProtocols).where(eq(fidelityProtocols.programId, programId)).limit(1);
  if (!protocol) return null;
  const items = await db.select().from(fidelityItems).where(eq(fidelityItems.protocolId, protocol.id));
  return { protocol, items: items.sort((a, b) => a.orderIndex - b.orderIndex) };
}

export async function getFidelityObservations(programId: string) {
  return db.select().from(fidelityObservations).where(eq(fidelityObservations.programId, programId)).orderBy(desc(fidelityObservations.date));
}

export async function getProgramSessions(programId: string) {
  return db.select().from(sessions).where(eq(sessions.programId, programId)).orderBy(desc(sessions.date));
}

export async function getParticipantSessions(participantId: string, limit = 50) {
  const rows = await db.select().from(sessions).where(eq(sessions.participantId, participantId)).orderBy(desc(sessions.date));
  return rows.slice(0, limit);
}

export async function getSession(sessionId: string) {
  const [row] = await db.select().from(sessions).where(eq(sessions.id, sessionId)).limit(1);
  return row;
}

export async function getTrialsForTarget(targetId: string) {
  return db.select().from(trialData).where(eq(trialData.targetId, targetId)).orderBy(trialData.timestamp);
}

export async function getTrialsForProgram(programId: string) {
  const targetRows = await getProgramTargets(programId);
  if (targetRows.length === 0) return [];
  return db.select().from(trialData).where(inArray(trialData.targetId, targetRows.map((t) => t.id))).orderBy(trialData.timestamp);
}

export async function getTrialsForSession(sessionId: string) {
  return db.select().from(trialData).where(eq(trialData.sessionId, sessionId));
}

export async function getAssignmentsForParticipant(participantId: string) {
  return db.select().from(assignments).where(eq(assignments.participantId, participantId)).orderBy(desc(assignments.createdAt));
}

export async function getAssignmentsForUser(userId: string) {
  return db.select().from(assignments).where(eq(assignments.assignedToUserId, userId)).orderBy(desc(assignments.createdAt));
}

export async function getAssignment(id: string) {
  const [row] = await db.select().from(assignments).where(eq(assignments.id, id)).limit(1);
  return row;
}

export async function getPracticeLogsForAssignment(assignmentId: string) {
  return db.select().from(practiceLogs).where(eq(practiceLogs.assignmentId, assignmentId)).orderBy(desc(practiceLogs.date));
}

export async function getPracticeLogsForProgram(programId: string) {
  return db.select().from(practiceLogs).where(eq(practiceLogs.programId, programId)).orderBy(desc(practiceLogs.date));
}

export async function listUsers(orgId: string) {
  return db.select().from(users).where(eq(users.orgId, orgId));
}

export async function getUser(id: string) {
  const [row] = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return row;
}

export async function listTemplates(orgId: string) {
  return db.select().from(templates).where(eq(templates.orgId, orgId)).orderBy(desc(templates.createdAt));
}

export async function listAuditLogs(orgId: string, limit = 100) {
  const rows = await db.select().from(auditLogs).where(eq(auditLogs.orgId, orgId)).orderBy(desc(auditLogs.timestamp));
  return rows.slice(0, limit);
}

export async function getGoal(id: string) {
  const [row] = await db.select().from(goals).where(eq(goals.id, id)).limit(1);
  return row;
}

export async function getDomain(id: string) {
  const [row] = await db.select().from(domains).where(eq(domains.id, id)).limit(1);
  return row;
}

"use server";

import { requireUser } from "@/lib/session";
import { db } from "@/db";
import {
  programs,
  programSteps,
  targets,
  promptHierarchies,
  masteryRules,
  goals,
  domains,
  generalizationDimensions,
  generalizationProbes,
  maintenancePlans,
  maintenanceChecks,
  fidelityProtocols,
  fidelityItems,
  fidelityObservations,
  programChanges,
} from "@/db/schema";
import { canManagePrograms } from "@/lib/rbac";
import { logAudit } from "@/lib/audit";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { evaluateMasteryRule, MasteryCriteria } from "@/lib/mastery";
import { getTrialsForTarget } from "@/lib/data";
import { TrialRow } from "@/lib/analytics";

// Program-management capability is scoped to a specific participant (see
// lib/rbac.ts) — every mutation here resolves the participant behind the
// program/target/step it's touching and checks the caller against that case.
async function assertCanManage(participantId: string) {
  const user = await requireUser();
  if (!(await canManagePrograms(user, participantId))) throw new Error("Not authorized to modify programs.");
  return user;
}

async function assertCanManageProgram(programId: string) {
  const [program] = await db.select().from(programs).where(eq(programs.id, programId)).limit(1);
  if (!program) throw new Error("Program not found.");
  return assertCanManage(program.participantId);
}

/* -------------------------- Program creation -------------------------- */

export async function createProgram(formData: FormData) {
  const participantId = String(formData.get("participantId"));
  const user = await assertCanManage(participantId);

  let domainId = String(formData.get("domainId") || "");
  let goalId = String(formData.get("goalId") || "");
  const newDomainName = String(formData.get("newDomainName") || "").trim();
  const newGoalTitle = String(formData.get("newGoalTitle") || "").trim();
  const broadGoal = String(formData.get("broadGoal") || "").trim();

  if (!domainId && newDomainName) {
    const [d] = await db.insert(domains).values({ participantId, name: newDomainName }).returning();
    domainId = d.id;
  }
  if (!goalId && newGoalTitle) {
    const [g] = await db
      .insert(goals)
      .values({ domainId, participantId, title: newGoalTitle, broadGoal: broadGoal || newGoalTitle })
      .returning();
    goalId = g.id;
  }

  const name = String(formData.get("name") || "").trim();
  const operationalDefinition = String(formData.get("operationalDefinition") || "").trim();
  const rationale = String(formData.get("rationale") || "").trim();
  const prerequisites = String(formData.get("prerequisites") || "").trim();
  const teachingProcedures = formData.getAll("teachingProcedures").map(String);
  const promptHierarchyId = String(formData.get("promptHierarchyId") || "") || null;
  const caregiverSummary = String(formData.get("caregiverSummary") || "").trim();
  const coachSummary = String(formData.get("coachSummary") || "").trim();

  const [program] = await db
    .insert(programs)
    .values({
      goalId, participantId, name, operationalDefinition, rationale, prerequisites,
      teachingProcedures: JSON.stringify(teachingProcedures),
      promptHierarchyId,
      caregiverSummary: caregiverSummary || null,
      coachSummary: coachSummary || null,
      journeyStage: "not_started",
      createdByUserId: user.id,
    })
    .returning();

  const stepTexts = formData.getAll("stepText").map(String).filter(Boolean);
  for (let i = 0; i < stepTexts.length; i++) {
    await db.insert(programSteps).values({ programId: program.id, orderIndex: i, text: stepTexts[i], isCritical: false });
  }

  const measurementType = String(formData.get("measurementType") || "independent_prompted_incorrect");
  const targetName = String(formData.get("targetName") || name);
  await db.insert(targets).values({
    programId: program.id, name: targetName, orderIndex: 0, measurementType, promptHierarchyId,
  });

  await logAudit({ orgId: user.orgId, userId: user.id, action: "program_created", entityType: "program", entityId: program.id, metadata: { name } });

  revalidatePath(`/people/${participantId}`);
  redirect(`/programs/${program.id}`);
}

/* -------------------------- Overview edits -------------------------- */

export async function updateProgramStage(programId: string, stage: string) {
  const user = await assertCanManageProgram(programId);
  const [program] = await db.select().from(programs).where(eq(programs.id, programId)).limit(1);
  const values: Partial<typeof programs.$inferInsert> = { journeyStage: stage };
  if (stage === "mastered" && !program.masteredAt) values.masteredAt = new Date();
  await db.update(programs).set(values).where(eq(programs.id, programId));
  await logAudit({ orgId: user.orgId, userId: user.id, action: "program_stage_changed", entityType: "program", entityId: programId, metadata: { stage } });
  revalidatePath(`/programs/${programId}`);
}

export async function updateProgramStageForm(formData: FormData) {
  "use server";
  const programId = String(formData.get("programId"));
  const stage = String(formData.get("journeyStage"));
  await updateProgramStage(programId, stage);
}

/* -------------------------- Task analysis steps -------------------------- */

export async function addProgramStep(formData: FormData) {
  const programId = String(formData.get("programId"));
  const user = await assertCanManageProgram(programId);
  const text = String(formData.get("text") || "").trim();
  if (!text) return;
  const existing = await db.select().from(programSteps).where(eq(programSteps.programId, programId));
  await db.insert(programSteps).values({ programId, orderIndex: existing.length, text, isCritical: false });
  await logAudit({ orgId: user.orgId, userId: user.id, action: "step_added", entityType: "program", entityId: programId });
  revalidatePath(`/programs/${programId}`);
}

export async function toggleStepCritical(stepId: string, programId: string, current: boolean) {
  "use server";
  await assertCanManageProgram(programId);
  await db.update(programSteps).set({ isCritical: !current }).where(eq(programSteps.id, stepId));
  revalidatePath(`/programs/${programId}`);
}

export async function moveStep(stepId: string, programId: string, direction: "up" | "down") {
  "use server";
  await assertCanManageProgram(programId);
  const steps = (await db.select().from(programSteps).where(eq(programSteps.programId, programId))).sort((a, b) => a.orderIndex - b.orderIndex);
  const idx = steps.findIndex((s) => s.id === stepId);
  const swapWith = direction === "up" ? idx - 1 : idx + 1;
  if (idx < 0 || swapWith < 0 || swapWith >= steps.length) return;
  const a = steps[idx];
  const b = steps[swapWith];
  await db.update(programSteps).set({ orderIndex: b.orderIndex }).where(eq(programSteps.id, a.id));
  await db.update(programSteps).set({ orderIndex: a.orderIndex }).where(eq(programSteps.id, b.id));
  revalidatePath(`/programs/${programId}`);
}

export async function deleteStep(stepId: string, programId: string) {
  "use server";
  await assertCanManageProgram(programId);
  await db.delete(programSteps).where(eq(programSteps.id, stepId));
  revalidatePath(`/programs/${programId}`);
}

/* -------------------------- Targets & mastery -------------------------- */

export async function addTarget(formData: FormData) {
  const programId = String(formData.get("programId"));
  const user = await assertCanManageProgram(programId);
  const name = String(formData.get("name") || "").trim();
  const measurementType = String(formData.get("measurementType") || "independent_prompted_incorrect");
  const unitLabel = String(formData.get("unitLabel") || "") || null;
  if (!name) return;
  const existing = await db.select().from(targets).where(eq(targets.programId, programId));
  await db.insert(targets).values({ programId, name, orderIndex: existing.length, measurementType, unitLabel });
  await logAudit({ orgId: user.orgId, userId: user.id, action: "target_added", entityType: "program", entityId: programId });
  revalidatePath(`/programs/${programId}`);
}

export async function setMasteryRule(formData: FormData) {
  const targetId = String(formData.get("targetId"));
  const programId = String(formData.get("programId"));
  const user = await assertCanManageProgram(programId);
  const description = String(formData.get("description") || "");
  const criteria = String(formData.get("criteria") || "{}");

  const existing = await db.select().from(masteryRules).where(eq(masteryRules.targetId, targetId)).limit(1);
  if (existing[0]) {
    await db.update(masteryRules).set({ description, criteria }).where(eq(masteryRules.id, existing[0].id));
  } else {
    await db.insert(masteryRules).values({ targetId, programId, description, criteria });
  }
  revalidatePath(`/programs/${programId}`);
}

export async function confirmMastery(formData: FormData) {
  const targetId = String(formData.get("targetId"));
  const programId = String(formData.get("programId"));
  const user = await assertCanManageProgram(programId);

  const [rule] = await db.select().from(masteryRules).where(eq(masteryRules.targetId, targetId)).limit(1);
  if (rule) {
    await db.update(masteryRules).set({ confirmedByUserId: user.id, confirmedAt: new Date() }).where(eq(masteryRules.id, rule.id));
  }
  await db.update(programs).set({ journeyStage: "mastered", masteredAt: new Date() }).where(eq(programs.id, programId));
  await logAudit({ orgId: user.orgId, userId: user.id, action: "mastery_confirmed", entityType: "program", entityId: programId, metadata: { targetId } });
  revalidatePath(`/programs/${programId}`);
}

export async function checkMasteryStatus(targetId: string) {
  const [rule] = await db.select().from(masteryRules).where(eq(masteryRules.targetId, targetId)).limit(1);
  if (!rule) return null;
  const trials = (await getTrialsForTarget(targetId)) as unknown as TrialRow[];
  const criteria = JSON.parse(rule.criteria) as MasteryCriteria;
  const trialsLike = trials.map((t) => ({
    sessionId: t.sessionId,
    sessionDate: t.timestamp,
    conductedByUserId: t.recordedByUserId,
    contextTags: [] as string[],
    result: t.result as any,
    stepResults: t.stepResults ? JSON.parse(String(t.stepResults)) : null,
  }));
  const result = evaluateMasteryRule(criteria, trialsLike);
  return { rule, result };
}

/* -------------------------- Generalization -------------------------- */

export async function addGeneralizationDimension(formData: FormData) {
  const programId = String(formData.get("programId"));
  const user = await assertCanManageProgram(programId);
  const dimensionType = String(formData.get("dimensionType"));
  const label = String(formData.get("label") || "").trim();
  if (!label) return;
  await db.insert(generalizationDimensions).values({ programId, dimensionType, label });
  revalidatePath(`/programs/${programId}`);
}

export async function addGeneralizationProbe(formData: FormData) {
  const programId = String(formData.get("programId"));
  const user = await assertCanManageProgram(programId);
  const dimensionId = String(formData.get("dimensionId"));
  const targetId = String(formData.get("targetId") || "") || null;
  const result = String(formData.get("result"));
  const context = String(formData.get("context") || "");
  const notes = String(formData.get("notes") || "");
  await db.insert(generalizationProbes).values({ programId, dimensionId, targetId, result, context, notes, date: new Date(), recordedByUserId: user.id });
  revalidatePath(`/programs/${programId}`);
}

/* -------------------------- Maintenance -------------------------- */

export async function createMaintenancePlan(formData: FormData) {
  const programId = String(formData.get("programId"));
  const user = await assertCanManageProgram(programId);
  const schedule = formData.getAll("schedule").map(String);
  const [plan] = await db.insert(maintenancePlans).values({ programId, schedule: JSON.stringify(schedule) }).returning();

  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;
  const offsets: Record<string, number> = { "1_week": 7 * dayMs, "2_week": 14 * dayMs, "1_month": 30 * dayMs, "3_month": 90 * dayMs };
  const labelMap: Record<string, string> = { "1_week": "1 week", "2_week": "2 weeks", "1_month": "1 month", "3_month": "3 months" };
  for (const s of schedule) {
    await db.insert(maintenanceChecks).values({
      maintenancePlanId: plan.id, label: labelMap[s] || s, dueDate: new Date(now + (offsets[s] || dayMs)),
    });
  }
  await db.update(programs).set({ journeyStage: "maintenance" }).where(eq(programs.id, programId));
  revalidatePath(`/programs/${programId}`);
}

export async function completeMaintenanceCheck(formData: FormData) {
  const checkId = String(formData.get("checkId"));
  const programId = String(formData.get("programId"));
  const user = await assertCanManageProgram(programId);
  const result = String(formData.get("result"));
  const performanceValue = Number(formData.get("performanceValue") || 0);
  const notes = String(formData.get("notes") || "");
  await db.update(maintenanceChecks).set({ result, performanceValue, notes, completedDate: new Date(), recordedByUserId: user.id }).where(eq(maintenanceChecks.id, checkId));
  if (result === "declined") {
    await db.update(programs).set({ journeyStage: "improving" }).where(eq(programs.id, programId));
  }
  revalidatePath(`/programs/${programId}`);
}

/* -------------------------- Fidelity protocol setup -------------------------- */

export async function createFidelityProtocol(formData: FormData) {
  const programId = String(formData.get("programId"));
  const user = await assertCanManageProgram(programId);
  const name = String(formData.get("name") || "Implementation Fidelity Checklist");
  const items = formData.getAll("item").map(String).filter(Boolean);
  const [protocol] = await db.insert(fidelityProtocols).values({ programId, name }).returning();
  for (let i = 0; i < items.length; i++) {
    await db.insert(fidelityItems).values({ protocolId: protocol.id, orderIndex: i, text: items[i] });
  }
  revalidatePath(`/programs/${programId}`);
}

export async function recordFidelityObservation(formData: FormData) {
  const protocolId = String(formData.get("protocolId"));
  const programId = String(formData.get("programId"));
  const participantId = String(formData.get("participantId"));
  const user = await assertCanManage(participantId);
  const observedUserId = String(formData.get("observedUserId") || "") || null;
  const notes = String(formData.get("notes") || "");

  const items = await db.select().from(fidelityItems).where(eq(fidelityItems.protocolId, protocolId));
  const scores: Record<string, string> = {};
  let correct = 0;
  let scored = 0;
  for (const item of items) {
    const val = String(formData.get(`item_${item.id}`) || "na");
    scores[item.id] = val;
    if (val !== "na") {
      scored++;
      if (val === "correct") correct++;
    }
  }
  const fidelityPercent = scored > 0 ? (correct / scored) * 100 : 0;

  await db.insert(fidelityObservations).values({
    protocolId, participantId, programId, observedUserId, observerUserId: user.id,
    date: new Date(), scores: JSON.stringify(scores), fidelityPercent, notes,
  });
  await logAudit({ orgId: user.orgId, userId: user.id, action: "fidelity_observed", entityType: "program", entityId: programId, metadata: { fidelityPercent } });
  revalidatePath(`/programs/${programId}`);
  redirect(`/programs/${programId}`);
}

/* -------------------------- Program change / decision log -------------------------- */

export async function addProgramChange(formData: FormData) {
  const programId = String(formData.get("programId"));
  const user = await assertCanManageProgram(programId);
  const changeType = String(formData.get("changeType"));
  const description = String(formData.get("description") || "");
  const rationale = String(formData.get("rationale") || "");
  const expectedOutcome = String(formData.get("expectedOutcome") || "");
  const dataToReview = String(formData.get("dataToReview") || "");
  await db.insert(programChanges).values({
    programId, date: new Date(), changeType, description, rationale, expectedOutcome, dataToReview, recordedByUserId: user.id,
  });
  await logAudit({ orgId: user.orgId, userId: user.id, action: "program_changed", entityType: "program", entityId: programId, metadata: { changeType } });
  revalidatePath(`/programs/${programId}`);
}

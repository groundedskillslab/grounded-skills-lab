"use server";

import { requireUser } from "@/lib/session";
import { db } from "@/db";
import { practiceLogs, assignments, users, programs, participants } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { logAudit } from "@/lib/audit";
import { isFullAccessRole, canManagePrograms, userCanAccessParticipant } from "@/lib/rbac";

export async function logPractice(formData: FormData) {
  const user = await requireUser();
  const assignmentId = String(formData.get("assignmentId"));
  const participantId = String(formData.get("participantId"));
  const programId = String(formData.get("programId"));
  const targetId = String(formData.get("targetId") || "") || null;
  const result = String(formData.get("result"));
  const sessionCode = String(formData.get("sessionCode") || "").trim() || null;
  const whatWorkedNote = String(formData.get("whatWorkedNote") || "");
  const barrierNote = String(formData.get("barrierNote") || "");
  const notes = String(formData.get("notes") || "");
  const confidenceRating = formData.get("confidenceRating") ? Number(formData.get("confidenceRating")) : null;
  const effortRating = formData.get("effortRating") ? Number(formData.get("effortRating")) : null;
  const contextTagsRaw = String(formData.get("contextTags") || "");
  const contextTags = contextTagsRaw ? contextTagsRaw.split(",").map((t) => t.trim()).filter(Boolean) : [];

  if (!result) return;

  // Server Actions are reachable directly, not just via the page that
  // renders their form — so the page's own access check (see
  // /practice/log/[assignmentId]) doesn't protect this. Re-derive the
  // assignment/participant from the database (never trust the client-
  // submitted participantId on its own) and confirm this user actually has
  // standing to log against it before writing anything.
  const [participant] = await db.select().from(participants).where(eq(participants.id, participantId)).limit(1);
  if (!participant || participant.orgId !== user.orgId) redirect("/practice");

  let allowed: boolean;
  if (assignmentId) {
    const [assignment] = await db.select().from(assignments).where(eq(assignments.id, assignmentId)).limit(1);
    if (!assignment || assignment.participantId !== participantId) redirect("/practice");
    allowed = assignment.assignedToUserId === user.id || isFullAccessRole(user.role) || (await canManagePrograms(user, participantId));
  } else {
    // No assignment context (an ad-hoc log) — fall back to general
    // participant access rather than assignedToUserId, which only applies
    // when there's an actual assignment to check it against.
    allowed = await userCanAccessParticipant(user.id, user.role, participantId);
  }
  if (!allowed) redirect("/practice");

  await db.insert(practiceLogs).values({
    assignmentId: assignmentId || null,
    participantId, programId, targetId, date: new Date(), loggedByUserId: user.id, result,
    whatWorkedNote: whatWorkedNote || null,
    barrierNote: barrierNote || null, notes: notes || null,
    confidenceRating, effortRating, sessionCode,
    contextTags: contextTags.length ? JSON.stringify(contextTags) : null,
  });

  if (assignmentId) {
    const newStatus = result === "successful" ? "completed" : result === "not_completed" ? "missed" : "started";
    await db.update(assignments).set({ status: newStatus }).where(eq(assignments.id, assignmentId));
  }

  await logAudit({ orgId: user.orgId, userId: user.id, action: "practice_logged", entityType: "practice_log", entityId: assignmentId, metadata: { result } });
  revalidatePath("/practice");
  redirect("/practice?logged=1");
}

export async function createAssignment(formData: FormData) {
  const user = await requireUser();
  const participantId = String(formData.get("participantId"));
  const programId = String(formData.get("programId") || "") || null;
  const title = String(formData.get("title") || "").trim();
  const instructions = String(formData.get("instructions") || "");
  const frequency = String(formData.get("frequency") || "");
  const assignedToUserId = String(formData.get("assignedToUserId") || "") || null;
  const dueDateRaw = String(formData.get("dueDate") || "");

  if (!title) return;

  // Same reasoning as logPractice above: the Assign form is only shown to
  // full-access/implementer roles in the UI, but the action itself is
  // reachable directly, so it needs its own check rather than trusting the
  // page it's normally called from.
  const [participant] = await db.select().from(participants).where(eq(participants.id, participantId)).limit(1);
  if (!participant || participant.orgId !== user.orgId) redirect("/practice");
  const allowed = isFullAccessRole(user.role) || (await canManagePrograms(user, participantId));
  if (!allowed) redirect("/practice");

  await db.insert(assignments).values({
    participantId, programId, title, instructions, frequency,
    assignedByUserId: user.id, assignedToUserId,
    dueDate: dueDateRaw ? new Date(dueDateRaw) : null,
    status: "assigned",
  });

  await logAudit({ orgId: user.orgId, userId: user.id, action: "assignment_created", entityType: "assignment", metadata: { title } });
  revalidatePath("/practice");
}

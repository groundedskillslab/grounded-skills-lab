"use server";

import { requireUser } from "@/lib/session";
import { db } from "@/db";
import { sessions, trialData } from "@/db/schema";
import { canRunSessions } from "@/lib/rbac";
import { logAudit } from "@/lib/audit";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export async function createSession(formData: FormData) {
  const user = await requireUser();
  const participantId = String(formData.get("participantId"));
  if (!(await canRunSessions(user, participantId))) throw new Error("Not authorized to run sessions.");

  const programId = String(formData.get("programId") || "") || null;
  const sessionCode = String(formData.get("sessionCode") || "").trim() || null;
  const contextTags = String(formData.get("contextTags") || "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

  const [session] = await db
    .insert(sessions)
    .values({ participantId, programId, conductedByUserId: user.id, date: new Date(), contextTags: JSON.stringify(contextTags), sessionCode })
    .returning();

  await logAudit({ orgId: user.orgId, userId: user.id, action: "session_started", entityType: "session", entityId: session.id });
  redirect(`/sessions/${session.id}`);
}

export async function recordTrial(input: {
  sessionId: string;
  targetId: string;
  result: string;
  promptLevel?: string | null;
  value?: number | null;
  stepResults?: { stepId: string; result: string; promptLevel?: string }[] | null;
  notes?: string | null;
}) {
  const user = await requireUser();
  const [session] = await db.select().from(sessions).where(eq(sessions.id, input.sessionId)).limit(1);
  if (!session) throw new Error("Session not found.");
  if (!(await canRunSessions(user, session.participantId))) throw new Error("Not authorized to record trials.");

  await db.insert(trialData).values({
    sessionId: input.sessionId,
    targetId: input.targetId,
    timestamp: new Date(),
    result: input.result,
    promptLevel: input.promptLevel || null,
    value: input.value ?? null,
    stepResults: input.stepResults ? JSON.stringify(input.stepResults) : null,
    notes: input.notes || null,
    recordedByUserId: user.id,
  });
  revalidatePath(`/sessions/${input.sessionId}`);
  return { ok: true };
}

export async function setSessionProgram(formData: FormData) {
  const user = await requireUser();
  const sessionId = String(formData.get("sessionId"));
  const programId = String(formData.get("programId"));
  await db.update(sessions).set({ programId }).where(eq(sessions.id, sessionId));
  revalidatePath(`/sessions/${sessionId}`);
}

export async function endSession(formData: FormData) {
  const user = await requireUser();
  const sessionId = String(formData.get("sessionId"));
  const notes = String(formData.get("notes") || "");
  const durationMinutes = Number(formData.get("durationMinutes") || 0) || null;
  const sessionCode = String(formData.get("sessionCode") || "").trim() || null;

  await db.update(sessions).set({ notes, durationMinutes, sessionCode }).where(eq(sessions.id, sessionId));
  await logAudit({ orgId: user.orgId, userId: user.id, action: "session_ended", entityType: "session", entityId: sessionId });
  revalidatePath(`/sessions/${sessionId}`);
  redirect(`/sessions/${sessionId}`);
}

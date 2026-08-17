import { requireUser } from "@/lib/session";
import {
  getSession, getProgram, getParticipant, getProgramTargets, getProgramSteps, getPromptHierarchy,
  getTrialsForSession, getParticipantPrograms,
} from "@/lib/data";
import { userCanAccessParticipant, canRunSessions } from "@/lib/rbac";
import { getLabels } from "@/lib/labels";
import { Card, SectionHeader, Pill, EmptyState } from "@/components/ui";
import { SessionRecorder } from "@/components/SessionRecorder";
import { setSessionProgram, endSession } from "@/actions/sessions";
import { notFound, redirect } from "next/navigation";
import { format } from "date-fns";

export const dynamic = "force-dynamic";

export default async function SessionPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await params;
  const user = await requireUser();
  const session = await getSession(sessionId);
  if (!session) notFound();

  const participant = await getParticipant(session.participantId);
  if (!participant || participant.orgId !== user.orgId) notFound();
  const allowed = await userCanAccessParticipant(user.id, user.role, participant.id);
  if (!allowed) redirect("/sessions");

  const labels = getLabels(participant.workspaceType);

  if (!session.programId) {
    const programs = await getParticipantPrograms(participant.id);
    return (
      <div className="max-w-md mx-auto">
        <SectionHeader title={`Which ${labels.program.toLowerCase()} is this ${labels.session.toLowerCase()} for?`} subtitle={participant.displayName} />
        <Card>
          <form action={setSessionProgram} className="space-y-3">
            <input type="hidden" name="sessionId" value={sessionId} />
            <select name="programId" required className="w-full rounded-lg border border-gridline px-3 py-2 text-sm">
              <option value="">— choose —</option>
              {programs.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <button className="w-full rounded-lg bg-ink text-white py-2 text-sm font-medium">Continue</button>
          </form>
        </Card>
      </div>
    );
  }

  const program = await getProgram(session.programId);
  if (!program) notFound();

  const [targets, steps, trials] = await Promise.all([
    getProgramTargets(session.programId),
    getProgramSteps(session.programId),
    getTrialsForSession(sessionId),
  ]);

  const targetInfos = await Promise.all(
    targets.map(async (t) => {
      const ph = await getPromptHierarchy(t.promptHierarchyId);
      return { id: t.id, name: t.name, measurementType: t.measurementType, unitLabel: t.unitLabel, promptLevels: ph ? (JSON.parse(ph.levels) as string[]) : null };
    })
  );

  const stepsMap: Record<string, { id: string; text: string; isCritical: boolean }[]> = {};
  for (const t of targets) {
    if (t.measurementType === "task_analysis") stepsMap[t.id] = steps.map((s) => ({ id: s.id, text: s.text, isCritical: s.isCritical }));
  }

  const initialCounts: Record<string, { independent: number; prompted: number; incorrect: number; total: number }> = {};
  for (const t of targets) {
    const tTrials = trials.filter((tr) => tr.targetId === t.id);
    initialCounts[t.id] = {
      independent: tTrials.filter((tr) => tr.result === "independent" || tr.result === "correct").length,
      prompted: tTrials.filter((tr) => tr.result === "prompted").length,
      incorrect: tTrials.filter((tr) => tr.result === "incorrect").length,
      total: tTrials.length,
    };
  }

  const canRecord = await canRunSessions(user, participant.id);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="text-sm text-ink-muted">
            {participant.displayName} · {format(new Date(session.date), "MMM d, yyyy")}
            {session.sessionCode && <> · <span className="font-mono">{session.sessionCode}</span></>}
          </div>
          <h1 className="text-2xl font-medium">{program.name}</h1>
          {session.contextTags && JSON.parse(session.contextTags).length > 0 && (
            <div className="flex gap-1.5 mt-2">
              {(JSON.parse(session.contextTags) as string[]).map((tag) => <Pill key={tag} tone="neutral">{tag}</Pill>)}
            </div>
          )}
        </div>
        <details className="relative">
          <summary className="text-sm cursor-pointer rounded-lg border border-gridline px-4 py-2 list-none font-medium">Finish {labels.session}</summary>
          <form action={endSession} className="absolute right-0 mt-2 w-72 bg-surface border border-gridline rounded-xl p-4 shadow-lg z-10 space-y-2">
            <input type="hidden" name="sessionId" value={sessionId} />
            <label className="block text-xs font-medium">Session ID (optional)</label>
            <input name="sessionCode" placeholder="e.g. GSL-024" defaultValue={session.sessionCode ?? undefined} className="w-full rounded-lg border border-gridline px-2 py-1.5 text-sm" />
            <label className="block text-xs font-medium">Duration (minutes)</label>
            <input name="durationMinutes" type="number" defaultValue={session.durationMinutes ?? undefined} className="w-full rounded-lg border border-gridline px-2 py-1.5 text-sm" />
            <label className="block text-xs font-medium">Session notes</label>
            <textarea name="notes" rows={3} defaultValue={session.notes ?? undefined} className="w-full rounded-lg border border-gridline px-2 py-1.5 text-sm" />
            <button className="w-full rounded-lg bg-ink text-white py-1.5 text-sm font-medium">Save & Close</button>
          </form>
        </details>
      </div>

      {targets.length === 0 ? (
        <Card><EmptyState title="No targets configured" body={`Add a ${labels.target.toLowerCase()} to this program before recording data.`} /></Card>
      ) : canRecord ? (
        <SessionRecorder sessionId={sessionId} targets={targetInfos} steps={stepsMap} initialCounts={initialCounts} labels={{ independent: labels.independent, prompt: labels.prompt }} />
      ) : (
        <Card><EmptyState title="View only" body="Your role can view this session but not record trials." /></Card>
      )}
    </div>
  );
}

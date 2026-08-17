import { requireUser } from "@/lib/session";
import { listParticipants, getParticipantPrograms } from "@/lib/data";
import { canRunSessions } from "@/lib/rbac";
import { getLabels } from "@/lib/labels";
import { Card, SectionHeader } from "@/components/ui";
import { createSession } from "@/actions/sessions";
import { redirect } from "next/navigation";

export default async function NewSessionPage({ searchParams }: { searchParams: Promise<{ participantId?: string; programId?: string }> }) {
  const user = await requireUser();
  const sp = await searchParams;

  // Which participant is preselected (if any) isn't known yet, so this can't
  // be gated by a single role check — filter to the participants this user
  // can actually run a session for, case by case.
  const allParticipants = await listParticipants(user.orgId, user.id, user.role);
  const runnable = await Promise.all(allParticipants.map(async (p) => ((await canRunSessions(user, p.id)) ? p : null)));
  const participants = runnable.filter((p): p is NonNullable<typeof p> => p !== null);
  if (participants.length === 0) redirect("/sessions");

  const preselected = sp.participantId;
  const programsForPreselected = preselected ? await getParticipantPrograms(preselected) : [];
  const labels = getLabels(participants.find((p) => p.id === preselected)?.workspaceType);

  return (
    <div className="max-w-lg mx-auto">
      <SectionHeader title={`Start a ${labels.session}`} subtitle="Pick who you're working with and which program this covers." />
      <Card>
        <form action={createSession} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Participant</label>
            <select name="participantId" defaultValue={preselected} required className="w-full rounded-lg border border-gridline px-3 py-2 text-sm">
              <option value="">— choose —</option>
              {participants.map((p) => (
                <option key={p.id} value={p.id}>{p.displayName}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Program (optional)</label>
            <select name="programId" defaultValue={sp.programId} className="w-full rounded-lg border border-gridline px-3 py-2 text-sm">
              <option value="">— none / multiple —</option>
              {programsForPreselected.map((prog) => (
                <option key={prog.id} value={prog.id}>{prog.name}</option>
              ))}
            </select>
            {!preselected && <p className="text-xs text-ink-muted mt-1">Choose a participant first to see their programs, or start the session and pick a target once inside.</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Context tags</label>
            <input name="contextTags" placeholder="e.g. Home, Drilling, Classroom (comma separated)" className="w-full rounded-lg border border-gridline px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Session ID (optional)</label>
            <input name="sessionCode" placeholder="e.g. GSL-024 — matches a Practice Journal entry" className="w-full rounded-lg border border-gridline px-3 py-2 text-sm" />
            <p className="text-xs text-ink-muted mt-1">If this session also has a page in a physical Practice Journal, use the same ID in both places to connect them.</p>
          </div>
          <button type="submit" className="w-full rounded-lg bg-ink text-white py-2.5 text-sm font-medium">
            Start {labels.session}
          </button>
        </form>
      </Card>
    </div>
  );
}

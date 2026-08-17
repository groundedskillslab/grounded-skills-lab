import { requireUser } from "@/lib/session";
import { listParticipants, getAssignmentsForUser, getAssignmentsForParticipant, getParticipantPrograms, listUsers, getParticipant } from "@/lib/data";
import { getLabels } from "@/lib/labels";
import { isFullAccessRole } from "@/lib/rbac";
import { Card, SectionHeader, Pill, LinkButton, EmptyState } from "@/components/ui";
import { createAssignment } from "@/actions/practice";
import { format } from "date-fns";

export const dynamic = "force-dynamic";

const STATUS_TONE: Record<string, any> = { assigned: "neutral", started: "warning", completed: "good", missed: "critical" };

export default async function PracticePage() {
  const user = await requireUser();

  if (!isFullAccessRole(user.role) && user.role !== "implementer") {
    const assignments = await getAssignmentsForUser(user.id);
    return (
      <div className="max-w-xl mx-auto space-y-6">
        <SectionHeader title="Practice" subtitle="What's assigned to you right now." />
        {assignments.length === 0 ? (
          <Card><EmptyState title="Nothing assigned yet" /></Card>
        ) : (
          <div className="space-y-3">
            {assignments.map((a) => (
              <Card key={a.id}>
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="font-medium">{a.title}</div>
                    <div className="text-sm text-ink-secondary">{a.frequency}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Pill tone={STATUS_TONE[a.status]}>{a.status}</Pill>
                    <LinkButton href={`/practice/log/${a.id}`}>Log</LinkButton>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Practitioner / org admin / implementer management view
  const participants = await listParticipants(user.orgId, user.id, user.role);
  const allAssignments = (
    await Promise.all(participants.map(async (p) => (await getAssignmentsForParticipant(p.id)).map((a) => ({ assignment: a, participant: p }))))
  ).flat();

  const orgUsers = isFullAccessRole(user.role) ? await listUsers(user.orgId) : [];

  return (
    <div className="space-y-6">
      <SectionHeader title="Practice & Assignments" subtitle="Practice happens outside the session — track whether it's happening, and how it's going." />

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <SectionHeader title="Assignments" />
            {allAssignments.length === 0 ? (
              <EmptyState title="No assignments yet" body="Assign practice from the form to the right." />
            ) : (
              <ul className="divide-y divide-gridline">
                {allAssignments.map(({ assignment, participant }) => (
                  <li key={assignment.id} className="py-3 flex items-center justify-between gap-3">
                    <div>
                      <div className="font-medium text-sm">{assignment.title}</div>
                      <div className="text-xs text-ink-muted">{participant.displayName} · {assignment.frequency}{assignment.dueDate ? ` · due ${format(new Date(assignment.dueDate), "MMM d")}` : ""}</div>
                    </div>
                    <Pill tone={STATUS_TONE[assignment.status]}>{assignment.status}</Pill>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        {isFullAccessRole(user.role) && (
          <Card>
            <SectionHeader title="Assign Practice" />
            <AssignmentForm participants={participants} orgUsers={orgUsers} />
          </Card>
        )}
      </div>
    </div>
  );
}

async function AssignmentForm({ participants, orgUsers }: { participants: any[]; orgUsers: any[] }) {
  return (
    <form action={createAssignment} className="space-y-2">
      <select name="participantId" required className="w-full rounded-lg border border-gridline px-3 py-2 text-sm">
        <option value="">Participant</option>
        {participants.map((p) => <option key={p.id} value={p.id}>{p.displayName}</option>)}
      </select>
      <ProgramSelectServer participants={participants} />
      <input name="title" required placeholder="e.g. Practice 10 reps before Thursday" className="w-full rounded-lg border border-gridline px-3 py-2 text-sm" />
      <textarea name="instructions" placeholder="Instructions" rows={2} className="w-full rounded-lg border border-gridline px-3 py-2 text-sm" />
      <input name="frequency" placeholder="Frequency (e.g. Once each evening)" className="w-full rounded-lg border border-gridline px-3 py-2 text-sm" />
      <select name="assignedToUserId" className="w-full rounded-lg border border-gridline px-3 py-2 text-sm">
        <option value="">Assign to...</option>
        {orgUsers.map((u) => <option key={u.id} value={u.id}>{u.name} ({u.role})</option>)}
      </select>
      <input name="dueDate" type="date" className="w-full rounded-lg border border-gridline px-3 py-2 text-sm" />
      <button className="w-full rounded-lg bg-ink text-white py-2 text-sm font-medium">Assign</button>
    </form>
  );
}

async function ProgramSelectServer({ participants }: { participants: any[] }) {
  const allPrograms = (
    await Promise.all(participants.map(async (p) => (await getParticipantPrograms(p.id)).map((prog) => ({ ...prog, participantName: p.displayName }))))
  ).flat();
  return (
    <select name="programId" className="w-full rounded-lg border border-gridline px-3 py-2 text-sm">
      <option value="">Program (optional)</option>
      {allPrograms.map((p) => <option key={p.id} value={p.id}>{p.participantName} — {p.name}</option>)}
    </select>
  );
}

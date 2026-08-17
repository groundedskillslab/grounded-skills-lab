import { requireUser } from "@/lib/session";
import { getAssignment, getParticipant, getProgram, getProgramTargets } from "@/lib/data";
import { getLabels } from "@/lib/labels";
import { Card } from "@/components/ui";
import { PracticeLogForm } from "@/components/PracticeLogForm";
import { notFound } from "next/navigation";

export default async function PracticeLogPage({ params }: { params: Promise<{ assignmentId: string }> }) {
  const { assignmentId } = await params;
  const user = await requireUser();
  const assignment = await getAssignment(assignmentId);
  if (!assignment) notFound();
  const participant = await getParticipant(assignment.participantId);
  if (!participant) notFound();
  const program = assignment.programId ? await getProgram(assignment.programId) : null;
  const targets = assignment.programId ? await getProgramTargets(assignment.programId) : [];
  const labels = getLabels(participant.workspaceType);

  const howTo = program?.caregiverSummary || program?.coachSummary || assignment.instructions || "Follow the instructions your practitioner shared.";
  const success = program?.operationalDefinition || "Complete the practice as described.";

  return (
    <div className="max-w-md mx-auto space-y-6">
      <div className="text-center">
        <div className="text-xs uppercase tracking-wide text-ink-muted mb-1">Today's Skill</div>
        <h1 className="text-2xl font-medium">{program?.name || assignment.title}</h1>
        <div className="text-sm text-ink-muted mt-1">{participant.displayName}</div>
      </div>

      <Card>
        <div className="text-xs uppercase tracking-wide text-ink-muted mb-1.5">How to Do It</div>
        <p className="text-sm leading-relaxed">{howTo}</p>
      </Card>

      <Card>
        <div className="text-xs uppercase tracking-wide text-ink-muted mb-1.5">What Counts as Success</div>
        <p className="text-sm leading-relaxed">{success}</p>
      </Card>

      <PracticeLogForm
        assignmentId={assignmentId}
        participantId={assignment.participantId}
        programId={assignment.programId ?? ""}
        targetId={targets[0]?.id}
      />
    </div>
  );
}

import { requireUser } from "@/lib/session";
import { getProgram, getFidelityProtocol, getParticipant, getParticipantTeam } from "@/lib/data";
import { canScoreFidelity, isSelfLearner } from "@/lib/rbac";
import { getLabels } from "@/lib/labels";
import { Card, SectionHeader } from "@/components/ui";
import { recordFidelityObservation } from "@/actions/programs";
import { notFound, redirect } from "next/navigation";

export default async function NewFidelityObservationPage({ params }: { params: Promise<{ programId: string }> }) {
  const { programId } = await params;
  const user = await requireUser();

  const program = await getProgram(programId);
  if (!program) notFound();
  if (!(await canScoreFidelity(user, program.participantId))) redirect(`/programs/${programId}`);
  const participant = await getParticipant(program.participantId);
  const fidelity = await getFidelityProtocol(programId);
  if (!fidelity) redirect(`/programs/${programId}`);
  const team = await getParticipantTeam(program.participantId);
  const implementers = team.filter((t) => t.assignment.roleOnCase === "implementer");
  const labels = getLabels(participant?.workspaceType);
  // Same presentation-only self-directed override as the Program detail and
  // Analytics pages — doesn't touch labels.fidelity itself.
  const viewingSelf = participant ? await isSelfLearner(user.id, participant.id) : false;
  const fidelityLabel = viewingSelf ? "Plan Fidelity" : labels.fidelity;

  return (
    <div className="max-w-xl mx-auto">
      <SectionHeader title={`Record ${fidelityLabel} Observation`} subtitle={fidelity.protocol.name} />
      <Card>
        <form action={recordFidelityObservation} className="space-y-5">
          <input type="hidden" name="protocolId" value={fidelity.protocol.id} />
          <input type="hidden" name="programId" value={programId} />
          <input type="hidden" name="participantId" value={program.participantId} />

          <div>
            <label className="block text-sm font-medium mb-1">Who was observed?</label>
            <select name="observedUserId" className="w-full rounded-lg border border-gridline px-3 py-2 text-sm">
              <option value="">—</option>
              {implementers.map((t) => <option key={t.user.id} value={t.user.id}>{t.user.name}</option>)}
            </select>
          </div>

          <div className="space-y-3">
            {fidelity.items.map((item, i) => (
              <div key={item.id} className="border border-gridline rounded-lg p-3">
                <div className="text-sm mb-2">{i + 1}. {item.text}</div>
                <div className="flex gap-2">
                  {["correct", "incorrect", "na"].map((v) => (
                    <label key={v} className="flex items-center gap-1.5 text-xs rounded-full border border-gridline px-3 py-1.5 cursor-pointer has-[:checked]:bg-ink has-[:checked]:text-white has-[:checked]:border-ink">
                      <input type="radio" name={`item_${item.id}`} value={v} defaultChecked={v === "correct"} className="sr-only" />
                      {v === "na" ? "N/A" : v[0].toUpperCase() + v.slice(1)}
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Notes</label>
            <textarea name="notes" rows={3} className="w-full rounded-lg border border-gridline px-3 py-2 text-sm" />
          </div>

          <button type="submit" className="w-full rounded-lg bg-ink text-white py-2 text-sm font-medium">Save Observation</button>
        </form>
      </Card>
    </div>
  );
}

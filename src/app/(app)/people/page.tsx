import { requireUser } from "@/lib/session";
import { listParticipants, getParticipantPrograms } from "@/lib/data";
import { getLabels, WORKSPACE_TYPES } from "@/lib/labels";
import { Card, Pill, LinkButton, SectionHeader, EmptyState } from "@/components/ui";
import Link from "next/link";
import { isFullAccessRole } from "@/lib/rbac";

export const dynamic = "force-dynamic";

export default async function PeoplePage() {
  const user = await requireUser();
  const participants = await listParticipants(user.orgId, user.id, user.role);

  const withPrograms = await Promise.all(
    participants.map(async (p) => ({ participant: p, programs: await getParticipantPrograms(p.id) }))
  );

  return (
    <div className="space-y-6">
      <SectionHeader
        title="People"
        subtitle="Everyone you support — clients, students, athletes, and participants — in one list."
        action={isFullAccessRole(user.role) ? <LinkButton href="/people/new">Add Participant</LinkButton> : undefined}
      />

      {withPrograms.length === 0 ? (
        <Card><EmptyState title="No participants yet" body="Once participants are added, they'll show up here." /></Card>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {withPrograms.map(({ participant, programs }) => {
            const labels = getLabels(participant.workspaceType);
            const wsMeta = WORKSPACE_TYPES.find((w) => w.value === participant.workspaceType);
            const mastered = programs.filter((p) => p.journeyStage === "mastered" || p.journeyStage === "maintenance").length;
            return (
              <Link key={participant.id} href={`/people/${participant.id}`}>
                <Card className="hover:border-brand/40 transition h-full flex flex-col">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="font-medium">{participant.displayName}</div>
                      <div className="text-xs text-ink-muted">{participant.participantCode}</div>
                    </div>
                    <Pill tone="brand">{wsMeta?.label}</Pill>
                  </div>
                  <div className="text-sm text-ink-secondary mb-3">
                    {programs.length} active {programs.length === 1 ? labels.program.toLowerCase() : (labels.program + "s").toLowerCase()}
                  </div>
                  <div className="mt-auto flex items-center gap-2 text-xs text-ink-muted">
                    {mastered > 0 && <Pill tone="good">{mastered} mastered</Pill>}
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

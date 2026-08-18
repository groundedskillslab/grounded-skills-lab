import { requireUser } from "@/lib/session";
import { listParticipants, getParticipantPrograms, getMaintenancePlan, getAssignmentsForUser, getUser, getSelfDirectedParticipant } from "@/lib/data";
import { computeProgramReview } from "@/lib/review";
import { getLabels } from "@/lib/labels";
import { Card, SectionHeader, StatTile, Pill, LinkButton, EmptyState } from "@/components/ui";
import { SelfDirectedTour } from "@/components/Tour";
import Link from "next/link";
import { isFullAccessRole } from "@/lib/rbac";

export const dynamic = "force-dynamic";

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

export default async function HomePage() {
  const user = await requireUser();

  if (!isFullAccessRole(user.role)) {
    return <SimpleHome userId={user.id} name={user.name || ""} role={user.role} />;
  }

  const participants = await listParticipants(user.orgId, user.id, user.role);

  type Row = { participant: (typeof participants)[number]; program: Awaited<ReturnType<typeof getParticipantPrograms>>[number]; review: Awaited<ReturnType<typeof computeProgramReview>> };
  const rows: Row[] = [];
  for (const p of participants) {
    const progs = await getParticipantPrograms(p.id);
    for (const prog of progs) {
      const review = await computeProgramReview(prog.id, prog.journeyStage);
      rows.push({ participant: p, program: prog, review });
    }
  }

  const needsReview = rows.filter((r) => r.review.status === "needs_review");
  const progressing = rows.filter((r) => r.review.status === "progressing");
  const masteredThisMonth = rows.filter((r) => {
    if (!r.program.masteredAt) return false;
    const d = new Date(r.program.masteredAt);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });

  let maintenanceDue = 0;
  for (const p of participants) {
    const progs = await getParticipantPrograms(p.id);
    for (const prog of progs) {
      const mp = await getMaintenancePlan(prog.id);
      if (mp) maintenanceDue += mp.checks.filter((c) => c.result === "not_yet_checked" && c.dueDate.getTime() <= Date.now()).length;
    }
  }

  const lowAdherence = rows.filter((r) => r.review.reasons.some((x) => x.includes("No home/outside practice")));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-medium">{greeting()}, {user.name?.split(" ")[0]}.</h1>
        <p className="text-ink-secondary mt-1">Here's what needs your attention today.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatTile label="Active Participants" value={participants.length} />
        <StatTile label="Active Programs" value={rows.length} />
        <StatTile label="Mastered This Month" value={masteredThisMonth.length} tone={masteredThisMonth.length > 0 ? "good" : undefined} />
        <StatTile label="Needs Review" value={needsReview.length} tone={needsReview.length > 0 ? "serious" : "good"} />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <SectionHeader title="Needs Attention" subtitle="Review signals, not automatic treatment decisions." />
            {needsReview.length === 0 && maintenanceDue === 0 && lowAdherence.length === 0 ? (
              <EmptyState title="Nothing urgent right now" body="All active programs look stable or progressing." />
            ) : (
              <ul className="divide-y divide-gridline">
                {needsReview.map((r) => (
                  <li key={r.program.id} className="py-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <Link href={`/programs/${r.program.id}`} className="font-medium hover:underline">
                          {r.program.name}
                        </Link>
                        <div className="text-sm text-ink-secondary">{r.participant.displayName}</div>
                        <ul className="mt-1 text-xs text-ink-muted list-disc list-inside space-y-0.5">
                          {r.review.reasons.slice(0, 2).map((reason, i) => (
                            <li key={i}>{reason}</li>
                          ))}
                        </ul>
                      </div>
                      <Pill tone="serious">Needs Review</Pill>
                    </div>
                  </li>
                ))}
                {maintenanceDue > 0 && (
                  <li className="py-3 flex items-center justify-between">
                    <div>
                      <div className="font-medium">Maintenance checks due</div>
                      <div className="text-sm text-ink-secondary">{maintenanceDue} maintenance probe(s) are due for review.</div>
                    </div>
                    <Pill tone="warning">Due</Pill>
                  </li>
                )}
              </ul>
            )}
          </Card>

          <Card>
            <SectionHeader title="Recent Progress" />
            {progressing.length === 0 && masteredThisMonth.length === 0 ? (
              <EmptyState title="No major changes yet" body="Progress will show here once a few sessions have been logged." />
            ) : (
              <ul className="divide-y divide-gridline">
                {masteredThisMonth.map((r) => (
                  <li key={"m-" + r.program.id} className="py-3 flex items-center justify-between">
                    <div>
                      <Link href={`/programs/${r.program.id}`} className="font-medium hover:underline">{r.program.name}</Link>
                      <div className="text-sm text-ink-secondary">{r.participant.displayName}</div>
                    </div>
                    <Pill tone="good">Reached Mastery</Pill>
                  </li>
                ))}
                {progressing.map((r) => (
                  <li key={r.program.id} className="py-3 flex items-center justify-between">
                    <div>
                      <Link href={`/programs/${r.program.id}`} className="font-medium hover:underline">{r.program.name}</Link>
                      <div className="text-sm text-ink-secondary">{r.participant.displayName}</div>
                    </div>
                    <Pill tone="good">↑ {r.review.performanceDeltaPct?.toFixed(0)}%</Pill>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <SectionHeader title="Start" />
            <div className="flex flex-col gap-2">
              <LinkButton href="/sessions/new">Start Session</LinkButton>
              <LinkButton href="/people" variant="secondary">Review a Participant</LinkButton>
              <LinkButton href="/people" variant="secondary">Build a Program</LinkButton>
              <LinkButton href="/practice" variant="secondary">Assign Practice</LinkButton>
              <LinkButton href="/analytics" variant="secondary">View Analytics</LinkButton>
            </div>
          </Card>
          <Card>
            <SectionHeader title="Your People" />
            <ul className="space-y-2">
              {participants.slice(0, 6).map((p) => {
                const labels = getLabels(p.workspaceType);
                return (
                  <li key={p.id}>
                    <Link href={`/people/${p.id}`} className="flex items-center justify-between rounded-lg hover:bg-plane px-2 py-1.5 -mx-2">
                      <span className="text-sm font-medium">{p.displayName}</span>
                      <span className="text-xs text-ink-muted">{labels.participant}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}

async function SimpleHome({ userId, name, role }: { userId: string; name: string; role: string }) {
  const isLearner = role === "learner";
  const isCaregiver = role === "caregiver";
  const assignments = await getAssignmentsForUser(userId);
  const selfDirectedParticipant = isLearner ? await getSelfDirectedParticipant(userId) : undefined;
  const labels = getLabels(selfDirectedParticipant?.workspaceType ?? "general");
  const programs = selfDirectedParticipant ? await getParticipantPrograms(selfDirectedParticipant.id) : [];

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-medium">{greeting()}, {name.split(" ")[0]}.</h1>
          <p className="text-ink-secondary mt-1">
            {isLearner ? "Here's what you're working on." : isCaregiver ? "Here's today's practice." : "Here's what's assigned to you."}
          </p>
        </div>
        {isLearner && (
          <SelfDirectedTour
            storageKey="gsl_tour_self_directed_v1"
            participantId={selfDirectedParticipant?.id}
            firstProgramId={programs[0]?.id}
            programLabel={labels.program}
            sessionLabel={labels.session}
          />
        )}
      </div>

      {isLearner && selfDirectedParticipant && (
        <Card className="bg-brand-soft border-0">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <div className="text-sm text-brand-ink font-medium">Training yourself: {selfDirectedParticipant.displayName}</div>
              <div className="text-xs text-ink-muted mt-0.5">New here? The Getting Started guide walks through the whole loop.</div>
            </div>
            <LinkButton href="/guide" variant="secondary">Getting Started guide</LinkButton>
          </div>
        </Card>
      )}

      <Card>
        <SectionHeader title="Assigned Practice" />
        {assignments.length === 0 ? (
          <EmptyState title="Nothing assigned yet" body="Your practitioner hasn't assigned any practice yet." />
        ) : (
          <ul className="divide-y divide-gridline">
            {assignments.map((a) => (
              <li key={a.id} className="py-3 flex items-center justify-between">
                <div>
                  <div className="font-medium">{a.title}</div>
                  <div className="text-sm text-ink-secondary">{a.frequency}</div>
                </div>
                <LinkButton href={`/practice/log/${a.id}`}>Log Practice</LinkButton>
              </li>
            ))}
          </ul>
        )}
      </Card>
      <div className="flex gap-2 flex-wrap">
        <LinkButton href="/practice" variant="secondary">Go to Practice Mode</LinkButton>
        {selfDirectedParticipant && (
          <LinkButton href={`/people/${selfDirectedParticipant.id}`} variant="secondary">Go to your profile</LinkButton>
        )}
      </div>
    </div>
  );
}

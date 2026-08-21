import { requireUser } from "@/lib/session";
import {
  getParticipant,
  getParticipantTeam,
  getParticipantDomains,
  getParticipantGoals,
  getParticipantPrograms,
  getParticipantSessions,
} from "@/lib/data";
import { getLabels, WORKSPACE_TYPES, JOURNEY_STAGES } from "@/lib/labels";
import { userCanAccessParticipant, canManagePrograms, canRunSessions, isOrgAdmin } from "@/lib/rbac";
import { ROLE_LABELS } from "@/lib/roles";
import { setSelfDirected } from "@/actions/team";
import { deleteParticipant, archiveParticipant } from "@/actions/participants";
import { DeleteParticipantButton } from "@/components/DeleteParticipantButton";
import { Card, SectionHeader, Pill, JourneyBar, LinkButton, EmptyState } from "@/components/ui";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { format } from "date-fns";

export const dynamic = "force-dynamic";

export default async function ParticipantProfilePage({ params }: { params: Promise<{ participantId: string }> }) {
  const { participantId } = await params;
  const user = await requireUser();
  const participant = await getParticipant(participantId);
  if (!participant || participant.orgId !== user.orgId) notFound();

  const allowed = await userCanAccessParticipant(user.id, user.role, participantId);
  if (!allowed) redirect("/people");

  const [canManage, canRun] = await Promise.all([
    canManagePrograms(user, participantId),
    canRunSessions(user, participantId),
  ]);

  const labels = getLabels(participant.workspaceType);
  const wsMeta = WORKSPACE_TYPES.find((w) => w.value === participant.workspaceType);

  const [team, domainsList, goalsList, programsList, recentSessions] = await Promise.all([
    getParticipantTeam(participantId),
    getParticipantDomains(participantId),
    getParticipantGoals(participantId),
    getParticipantPrograms(participantId),
    getParticipantSessions(participantId, 8),
  ]);

  const goalsByDomain = new Map<string, typeof goalsList>();
  for (const g of goalsList) {
    if (!goalsByDomain.has(g.domainId)) goalsByDomain.set(g.domainId, []);
    goalsByDomain.get(g.domainId)!.push(g);
  }
  const programsByGoal = new Map<string, typeof programsList>();
  for (const p of programsList) {
    if (!programsByGoal.has(p.goalId)) programsByGoal.set(p.goalId, []);
    programsByGoal.get(p.goalId)!.push(p);
  }

  const masteredCount = programsList.filter((p) => p.journeyStage === "mastered" || p.journeyStage === "maintenance").length;

  // Group raw assignment rows by user — a self-directed person has two rows
  // (one "learner", one "practitioner") for the same participant, and
  // should render as one line with both capabilities reflected rather than
  // two separate entries.
  const teamByUser = new Map<string, { user: (typeof team)[number]["user"]; roles: string[] }>();
  for (const t of team) {
    if (!teamByUser.has(t.user.id)) teamByUser.set(t.user.id, { user: t.user, roles: [] });
    teamByUser.get(t.user.id)!.roles.push(t.assignment.roleOnCase);
  }
  const teamMembers = [...teamByUser.values()];
  const canManageCapabilities = isOrgAdmin(user.role);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-medium">{participant.displayName}</h1>
            <Pill tone="brand">{wsMeta?.label}</Pill>
            {participant.archived && <Pill tone="neutral">Archived</Pill>}
          </div>
          <div className="text-sm text-ink-muted mt-1">{participant.participantCode}</div>
        </div>
        {(canManage || canRun) && (
          <div className="flex gap-2">
            {canRun && <LinkButton href={`/sessions/new?participantId=${participant.id}`} variant="secondary">Start {labels.session}</LinkButton>}
            {canManage && <LinkButton href={`/people/${participant.id}/programs/new`}>Build {labels.program}</LinkButton>}
          </div>
        )}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <SectionHeader title="How is this person developing?" subtitle={`${labels.program}s grouped by goal and domain.`} />
            {domainsList.length === 0 ? (
              <EmptyState title="No domains yet" body={`Add a domain and goal to begin building a ${labels.program.toLowerCase()}.`} />
            ) : (
              <div className="space-y-6">
                {domainsList.map((domain) => (
                  <div key={domain.id}>
                    <div className="text-xs uppercase tracking-wide text-ink-muted mb-2">{domain.name}</div>
                    <div className="space-y-4">
                      {(goalsByDomain.get(domain.id) || []).map((goal) => (
                        <div key={goal.id} className="border border-gridline rounded-xl p-4">
                          <div className="font-medium text-sm mb-3">{goal.title}</div>
                          <div className="space-y-4">
                            {(programsByGoal.get(goal.id) || []).map((program) => (
                              <Link key={program.id} href={`/programs/${program.id}`} className="block group">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-sm font-medium group-hover:text-brand-ink">{program.name}</span>
                                  <span className="text-xs text-ink-muted">
                                    {JOURNEY_STAGES.find((s) => s.value === program.journeyStage)?.label}
                                  </span>
                                </div>
                                <JourneyBar stage={program.journeyStage} compact />
                              </Link>
                            ))}
                            {(programsByGoal.get(goal.id) || []).length === 0 && (
                              <div className="text-sm text-ink-muted">No {labels.program.toLowerCase()} built for this goal yet.</div>
                            )}
                          </div>
                        </div>
                      ))}
                      {(goalsByDomain.get(domain.id) || []).length === 0 && (
                        <div className="text-sm text-ink-muted">No goals in this domain yet.</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card>
            <SectionHeader title={`Recent ${labels.sessionPlural}`} />
            {recentSessions.length === 0 ? (
              <EmptyState title="No sessions yet" />
            ) : (
              <ul className="divide-y divide-gridline">
                {recentSessions.map((s) => (
                  <li key={s.id} className="py-3 flex items-center justify-between">
                    <div>
                      <Link href={`/sessions/${s.id}`} className="font-medium text-sm hover:underline">
                        {format(new Date(s.date), "MMM d, yyyy")}
                      </Link>
                      <div className="text-xs text-ink-muted">
                        {s.contextTags ? (JSON.parse(s.contextTags) as string[]).join(" · ") : ""}
                      </div>
                    </div>
                    {s.durationMinutes && <span className="text-xs text-ink-muted">{s.durationMinutes} min</span>}
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <SectionHeader title="Snapshot" />
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between"><dt className="text-ink-secondary">Active {labels.program.toLowerCase()}s</dt><dd className="font-medium tabular">{programsList.length}</dd></div>
              <div className="flex justify-between"><dt className="text-ink-secondary">Mastered / Maintenance</dt><dd className="font-medium tabular">{masteredCount}</dd></div>
              <div className="flex justify-between"><dt className="text-ink-secondary">{labels.sessionPlural} logged</dt><dd className="font-medium tabular">{recentSessions.length}+</dd></div>
            </dl>
          </Card>
          <Card>
            <SectionHeader title="Care Team" />
            <ul className="space-y-3">
              {teamMembers.map(({ user: member, roles }) => {
                const isLearnerHere = roles.includes("learner");
                const isSelfDirected = isLearnerHere && roles.includes("practitioner");
                // The self-directed toggle only makes sense for this
                // participant's own learner — not a coach/caregiver who
                // separately happens to hold a "learner" row elsewhere.
                const canToggle = canManageCapabilities && member.role === "learner" && isLearnerHere;
                return (
                  <li key={member.id} className="flex items-center justify-between gap-2">
                    <div>
                      <div className="text-sm font-medium">{member.name}</div>
                      <div className="text-xs text-ink-muted">{member.title || ROLE_LABELS[member.role as keyof typeof ROLE_LABELS]}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      {isSelfDirected ? (
                        <Pill tone="brand">Self-directed</Pill>
                      ) : (
                        roles.map((r) => <Pill key={r} tone="neutral">{r}</Pill>)
                      )}
                      {canToggle && (
                        <form action={setSelfDirected}>
                          <input type="hidden" name="userId" value={member.id} />
                          <input type="hidden" name="participantId" value={participant.id} />
                          <input type="hidden" name="enable" value={isSelfDirected ? "false" : "true"} />
                          <button type="submit" className="text-xs text-ink-muted underline hover:text-ink">
                            {isSelfDirected ? "Remove" : "Make self-directed"}
                          </button>
                        </form>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </Card>
          {isOrgAdmin(user.role) && (
            <Card>
              <SectionHeader title="Danger Zone" />
              <p className="text-xs text-ink-muted mb-3">
                Archive hides a participant from the active list without deleting anything — use it whenever there&apos;s real
                history worth keeping. Delete permanently removes the participant and every program, session, and practice log
                tied to them, with no undo — reserve it for test/demo profiles with nothing worth preserving.
              </p>
              <div className="flex items-center gap-4">
                <form action={archiveParticipant}>
                  <input type="hidden" name="participantId" value={participant.id} />
                  <input type="hidden" name="archived" value={participant.archived ? "false" : "true"} />
                  <button type="submit" className="text-xs text-ink-muted underline hover:text-ink">
                    {participant.archived ? "Unarchive" : "Archive"}
                  </button>
                </form>
                <DeleteParticipantButton
                  participantId={participant.id}
                  participantName={participant.displayName}
                  action={deleteParticipant}
                />
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

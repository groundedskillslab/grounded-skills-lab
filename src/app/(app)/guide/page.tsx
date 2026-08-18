import { requireUser } from "@/lib/session";
import { getSelfDirectedParticipant, getParticipantPrograms } from "@/lib/data";
import { getLabels } from "@/lib/labels";
import { Card, SectionHeader, Pill, LinkButton, EmptyState } from "@/components/ui";
import Link from "next/link";

export const dynamic = "force-dynamic";

function StepBadge({ n }: { n: number }) {
  return (
    <div className="h-8 w-8 shrink-0 rounded-full bg-ink text-white flex items-center justify-center text-sm font-medium font-heading">
      {n}
    </div>
  );
}

export default async function GuidePage() {
  const user = await requireUser();
  const participant = await getSelfDirectedParticipant(user.id);
  const labels = getLabels(participant?.workspaceType ?? "general");
  const programs = participant ? await getParticipantPrograms(participant.id) : [];
  const firstProgram = programs[0];

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-2xl font-medium">Getting Started: Training Yourself</h1>
          <Pill tone="brand">Self-Directed</Pill>
        </div>
        <p className="text-ink-secondary mt-2">
          Grounded Skills Lab is built around one loop — Define → Teach → Practice → Measure → Analyze → Adjust →
          Generalize → Maintain — the same loop a practitioner runs with a client. When you're training yourself,
          you run that same loop, just wearing both hats: the person doing the work, and the person tracking it.
        </p>
        <p className="text-sm text-ink-muted mt-2 italic font-body">Practice. Measure. Improve. Repeat.</p>
      </div>

      {!participant && (
        <Card className="border-l-4 border-l-brand">
          <div className="font-medium mb-1">Self-directed access isn't set up on your account yet</div>
          <p className="text-sm text-ink-secondary">
            Training yourself requires two things on your own profile: a <span className="font-medium">learner</span>{" "}
            capability row and a <span className="font-medium">practitioner</span> capability row, on the same
            participant record. Today, setting that up is done by an org admin (there's no self-service option in the
            app yet) — ask yours to create your participant profile and grant you both. The rest of this guide still
            explains how the loop works once that's in place.
          </p>
        </Card>
      )}

      {participant && (
        <Card className="bg-brand-soft border-0">
          <div className="text-sm text-brand-ink font-medium mb-1">Your profile</div>
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <div className="font-medium">{participant.displayName}</div>
              <div className="text-xs text-ink-muted">{participant.participantCode}</div>
            </div>
            <LinkButton href={`/people/${participant.id}`}>Go to your profile</LinkButton>
          </div>
        </Card>
      )}

      <div className="space-y-5">
        <Card>
          <div className="flex gap-4">
            <StepBadge n={1} />
            <div className="flex-1">
              <SectionHeader title={`Define: build your ${labels.program.toLowerCase()}`} subtitle="Everything else in the loop hangs off this." />
              <p className="text-sm text-ink-secondary">
                From your profile, click <span className="font-medium">Build {labels.program}</span>. You'll write an
                operational definition (what exactly you're working on, in observable terms), break it into a task
                analysis if it's a multi-step skill, choose a measurement type (independent/prompted/incorrect,
                percentage, duration — whatever fits), and set the {labels.mastery.toLowerCase()} criteria that decide
                when you've got it. This is also where you set your {labels.prompt.toLowerCase()} hierarchy and
                teaching procedures — the "Teach" part of the loop lives inside program setup, not a separate screen.
              </p>
              {participant && (
                <div className="mt-3">
                  <LinkButton href={`/people/${participant.id}/programs/new`} variant="secondary">
                    Build {labels.program}
                  </LinkButton>
                </div>
              )}
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex gap-4">
            <StepBadge n={2} />
            <div className="flex-1">
              <SectionHeader title={`Practice: run a ${labels.session.toLowerCase()}`} subtitle="Two ways to log practice — know which one you're using." />
              <p className="text-sm text-ink-secondary mb-3">
                <span className="font-medium">Start {labels.session}</span> (from your profile, or Sessions in the
                nav) is structured, {labels.trial.toLowerCase()}-by-{labels.trial.toLowerCase()} data collection —
                use it when you're actively working the program and want real numbers behind your progress.{" "}
                <span className="font-medium">Practice Mode</span> is a lighter log for the reps you do between formal
                sessions — good for volume, not scored the same way. As a self-directed user you can assign yourself
                practice from the Practice page if you want a reminder trail.
              </p>
              <div className="flex gap-2 flex-wrap">
                {participant && (
                  <LinkButton href={`/sessions/new?participantId=${participant.id}`} variant="secondary">
                    Start {labels.session}
                  </LinkButton>
                )}
                <LinkButton href="/practice" variant="secondary">
                  Practice Mode
                </LinkButton>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex gap-4">
            <StepBadge n={3} />
            <div className="flex-1">
              <SectionHeader title="Measure & Analyze" subtitle="Measurement happens automatically. Analysis is where you make sense of it." />
              <p className="text-sm text-ink-secondary mb-3">
                Every {labels.trial.toLowerCase()} you log during a {labels.session.toLowerCase()} feeds straight into
                your charts — nothing extra to do there. Head to{" "}
                <span className="font-medium">Analytics</span> for a board sorted into Progressing / Stable / Needs
                Review, or open a specific {labels.program.toLowerCase()} for its full trend, prompt-level
                breakdown, and success-by-context charts, plus a plain-language "Observed Data Pattern" — a
                description of what the data shows, never a treatment recommendation.
              </p>
              <div className="flex gap-2 flex-wrap">
                <LinkButton href="/analytics" variant="secondary">Analytics Board</LinkButton>
                {firstProgram && (
                  <LinkButton href={`/analytics/${firstProgram.id}`} variant="secondary">
                    {firstProgram.name} chart
                  </LinkButton>
                )}
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex gap-4">
            <StepBadge n={4} />
            <div className="flex-1">
              <SectionHeader title="Adjust" subtitle="When the data says it's time to change something, write down why." />
              <p className="text-sm text-ink-secondary mb-3">
                Open your {labels.program.toLowerCase()} and use the{" "}
                <span className="font-medium">Professional Decision Log</span> to record what you changed and why —
                a prompt level, a mastery target, the teaching procedure itself. It's a transparent record for
                future-you, not an automated suggestion.
              </p>
              {firstProgram && (
                <LinkButton href={`/programs/${firstProgram.id}`} variant="secondary">
                  Open {firstProgram.name}
                </LinkButton>
              )}
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex gap-4">
            <StepBadge n={5} />
            <div className="flex-1">
              <SectionHeader title={`${labels.generalization} & ${labels.maintenance}`} subtitle="Two tabs on your program, for the two things that happen after it clicks." />
              <p className="text-sm text-ink-secondary">
                The <span className="font-medium">{labels.generalization}</span> tab is a matrix of where you've
                probed this skill (different settings, people, equipment) and where you haven't yet — the point is
                the skill working outside the exact conditions you first trained it in. Once you confirm{" "}
                {labels.mastery.toLowerCase()} on a target, the{" "}
                <span className="font-medium">{labels.maintenance}</span> tab schedules periodic checks so you can
                catch — and correct — any drift, instead of assuming a mastered skill stays mastered on its own.
                Both tabs live inside the {labels.program.toLowerCase()} page, next to Task Analysis.
              </p>
            </div>
          </div>
        </Card>
      </div>

      <Card className="bg-plane border-0">
        <div className="font-medium mb-1">A note on the two hats</div>
        <p className="text-sm text-ink-secondary">
          Your account's role stays <span className="font-medium">learner</span> — you're not an org-wide
          practitioner. The program-building and session-running access above is scoped to your own profile only,
          through a separate capability grant on that one participant record. If you ever start coaching someone
          else, they get their own grant; nothing here changes for you.
        </p>
      </Card>

      {!participant && programs.length === 0 && (
        <EmptyState title="Nothing to link to yet" body="Once your profile is set up, this guide will link straight to your own pages." />
      )}
    </div>
  );
}

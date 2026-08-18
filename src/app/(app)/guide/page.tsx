import { requireUser } from "@/lib/session";
import { getSelfDirectedParticipant, getParticipantPrograms, listParticipants } from "@/lib/data";
import { getLabels } from "@/lib/labels";
import { Card, SectionHeader, Pill, LinkButton, EmptyState } from "@/components/ui";
import { isFullAccessRole, isOrgAdmin } from "@/lib/rbac";

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

  if (isFullAccessRole(user.role)) {
    return <FullAccessGuide userId={user.id} orgId={user.orgId} role={user.role} isAdmin={isOrgAdmin(user.role)} />;
  }

  if (user.role === "learner") {
    const selfDirected = await getSelfDirectedParticipant(user.id);
    if (selfDirected) return <SelfDirectedGuide userId={user.id} />;
    // A learner without the practitioner capability row is a coached
    // learner, not a self-directed one — same track as a caregiver, just
    // framed as "you" instead of "the person you support".
    return <CaregiverGuide userId={user.id} orgId={user.orgId} role={user.role} subjectIsSelf />;
  }

  if (user.role === "caregiver") {
    return <CaregiverGuide userId={user.id} orgId={user.orgId} role={user.role} subjectIsSelf={false} />;
  }

  if (user.role === "implementer") {
    return <ImplementerGuide userId={user.id} orgId={user.orgId} role={user.role} />;
  }

  return <GenericGuide role={user.role} />;
}

async function SelfDirectedGuide({ userId }: { userId: string }) {
  const participant = await getSelfDirectedParticipant(userId);
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

async function FullAccessGuide({ userId, orgId, role, isAdmin }: { userId: string; orgId: string; role: string; isAdmin: boolean }) {
  const participants = await listParticipants(orgId, userId, role);
  const firstParticipant = participants[0];
  const firstParticipantPrograms = firstParticipant ? await getParticipantPrograms(firstParticipant.id) : [];
  const firstProgram = firstParticipantPrograms[0];
  const labels = getLabels(firstParticipant?.workspaceType ?? "clinical");

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-2xl font-medium">Getting Started: Running a Caseload</h1>
          <Pill tone="brand">{isAdmin ? "Org Admin" : "Practitioner"}</Pill>
        </div>
        <p className="text-ink-secondary mt-2">
          Same loop as everyone else — Define → Teach → Practice → Measure → Analyze → Adjust → Generalize →
          Maintain — run across everyone on your caseload, not just one person. This walks through where each piece
          lives.
        </p>
        <p className="text-sm text-ink-muted mt-2 italic font-body">Practice. Measure. Improve. Repeat.</p>
      </div>

      {participants.length === 0 && (
        <Card className="border-l-4 border-l-brand">
          <div className="font-medium mb-1">Nobody's on your caseload yet</div>
          <p className="text-sm text-ink-secondary">
            Add your first participant to get started — a name, an ID, and a workspace (Clinical, Performance,
            Education, or General) is all it takes. Everything below will link straight to your real data once
            there's someone to link to.
          </p>
          <div className="mt-3">
            <LinkButton href="/people/new">Add a participant</LinkButton>
          </div>
        </Card>
      )}

      <div className="space-y-5">
        <Card>
          <div className="flex gap-4">
            <StepBadge n={1} />
            <div className="flex-1">
              <SectionHeader title="People: your caseload" subtitle="Every participant you support, in one list." />
              <p className="text-sm text-ink-secondary mb-3">
                Open <span className="font-medium">People</span> to browse everyone you support, or add someone new
                from there. Each participant gets a workspace (Clinical/Performance/Education/General) that decides
                the vocabulary the rest of the app uses for them — same engine, different words.
              </p>
              <div className="flex gap-2 flex-wrap">
                <LinkButton href="/people" variant="secondary">Open People</LinkButton>
                <LinkButton href="/people/new" variant="secondary">Add a participant</LinkButton>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex gap-4">
            <StepBadge n={2} />
            <div className="flex-1">
              <SectionHeader title={`Define: build a ${labels.program.toLowerCase()}`} subtitle="From a participant's profile." />
              <p className="text-sm text-ink-secondary mb-3">
                Open a participant and click <span className="font-medium">Build {labels.program}</span>. You'll set
                an operational definition, a task analysis for multi-step skills, a {labels.prompt.toLowerCase()}{" "}
                hierarchy, a measurement type, and {labels.mastery.toLowerCase()} criteria — the full spec for what
                you're teaching and how you'll know it's working.
              </p>
              {firstParticipant && (
                <LinkButton href={`/people/${firstParticipant.id}/programs/new`} variant="secondary">
                  Build a {labels.program.toLowerCase()} for {firstParticipant.displayName}
                </LinkButton>
              )}
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex gap-4">
            <StepBadge n={3} />
            <div className="flex-1">
              <SectionHeader title={`Practice: run a ${labels.session.toLowerCase()}`} subtitle="Structured, rep-by-rep data collection." />
              <p className="text-sm text-ink-secondary mb-3">
                Pick a participant and, optionally, which {labels.program.toLowerCase()} the{" "}
                {labels.session.toLowerCase()} covers — the app fills in their {labels.prompt.toLowerCase()}{" "}
                hierarchy and targets automatically so you're just scoring as you go.
              </p>
              <LinkButton href="/sessions/new" variant="secondary">Start a {labels.session.toLowerCase()}</LinkButton>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex gap-4">
            <StepBadge n={4} />
            <div className="flex-1">
              <SectionHeader title="Analyze across your caseload" subtitle="One board, sorted by what needs attention." />
              <p className="text-sm text-ink-secondary mb-3">
                The <span className="font-medium">Analytics</span> board sorts every active{" "}
                {labels.program.toLowerCase()} into Progressing, Stable, or Needs Review, with average{" "}
                {labels.fidelity.toLowerCase()} across recent observations — a fast read on where to focus next. Open
                a specific {labels.program.toLowerCase()} for its full trend and a plain-language "Observed Data
                Pattern," never a treatment recommendation.
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
            <StepBadge n={5} />
            <div className="flex-1">
              <SectionHeader
                title={`Adjust, ${labels.fidelity}, ${labels.generalization}, ${labels.maintenance}`}
                subtitle="All four live on the program page, next to Task Analysis."
              />
              <p className="text-sm text-ink-secondary mb-3">
                A <span className="font-medium">Decision Log</span> tracks what changed and why. A{" "}
                {labels.fidelity} checklist scores how closely a session followed the plan. A{" "}
                {labels.generalization} matrix tracks where the skill has transferred. A{" "}
                {labels.maintenance} schedule kicks in once mastery is confirmed, so gains don't quietly slip.
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
            <StepBadge n={6} />
            <div className="flex-1">
              <SectionHeader title="Assign practice to your team" subtitle="Caregivers, coaches, and implementers work from here." />
              <p className="text-sm text-ink-secondary mb-3">
                Use <span className="font-medium">Practice</span> to assign homework-style practice to a caregiver,
                {" "}{labels.implementer.toLowerCase()}, or the participant themselves, and see what's been logged
                without needing a formal session.
              </p>
              <LinkButton href="/practice" variant="secondary">Open Practice</LinkButton>
            </div>
          </div>
        </Card>

        {isAdmin && (
          <Card>
            <div className="flex gap-4">
              <StepBadge n={7} />
              <div className="flex-1">
                <SectionHeader title="Organization: team & audit log" subtitle="Org-admin only." />
                <p className="text-sm text-ink-secondary mb-3">
                  Review accounts and roles, and a running audit trail of program changes, mastery confirmations, and
                  permission changes across the org.
                </p>
                <LinkButton href="/organization" variant="secondary">Open Organization</LinkButton>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

async function ImplementerGuide({ userId, orgId, role }: { userId: string; orgId: string; role: string }) {
  const participants = await listParticipants(orgId, userId, role);
  const firstParticipant = participants[0];
  const firstParticipantPrograms = firstParticipant ? await getParticipantPrograms(firstParticipant.id) : [];
  const firstProgram = firstParticipantPrograms[0];
  const labels = getLabels(firstParticipant?.workspaceType ?? "clinical");

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-2xl font-medium">Getting Started: Running Sessions</h1>
          <Pill tone="brand">{labels.implementer}</Pill>
        </div>
        <p className="text-ink-secondary mt-2">
          Building a {labels.program.toLowerCase()} is your {labels.practitioner.toLowerCase()}'s call. Your part of
          the loop is Practice — running {labels.sessionPlural.toLowerCase()} and logging progress for whoever
          you're assigned to.
        </p>
        <p className="text-sm text-ink-muted mt-2 italic font-body">Practice. Measure. Improve. Repeat.</p>
      </div>

      {participants.length === 0 && (
        <Card className="border-l-4 border-l-brand">
          <div className="font-medium mb-1">Nobody's assigned to you yet</div>
          <p className="text-sm text-ink-secondary">
            Check with your {labels.practitioner.toLowerCase()} or org admin — once you're added to a participant's
            team, this guide will link straight to their pages.
          </p>
        </Card>
      )}

      <div className="space-y-5">
        <Card>
          <div className="flex gap-4">
            <StepBadge n={1} />
            <div className="flex-1">
              <SectionHeader title="People: who you're assigned to" subtitle="Open a profile before you work with them." />
              <p className="text-sm text-ink-secondary mb-3">
                Every participant you're assigned to shows up here. Open one to see their {labels.program.toLowerCase()},{" "}
                {labels.prompt.toLowerCase()} hierarchy, and recent {labels.sessionPlural.toLowerCase()} before you
                start.
              </p>
              {participants.length > 0 && <LinkButton href="/people" variant="secondary">Open People</LinkButton>}
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex gap-4">
            <StepBadge n={2} />
            <div className="flex-1">
              <SectionHeader title={`Practice: run a ${labels.session.toLowerCase()}`} subtitle="Structured, rep-by-rep data collection." />
              <p className="text-sm text-ink-secondary mb-3">
                Pick who you're working with — their {labels.prompt.toLowerCase()} hierarchy and targets load in
                automatically, so you're just scoring as you go.
              </p>
              <LinkButton
                href={firstParticipant ? `/sessions/new?participantId=${firstParticipant.id}` : "/sessions/new"}
                variant="secondary"
              >
                Start a {labels.session.toLowerCase()}
              </LinkButton>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex gap-4">
            <StepBadge n={3} />
            <div className="flex-1">
              <SectionHeader title="Practice Mode — the lighter log" subtitle="For homework-style practice and anything assigned to you." />
              <p className="text-sm text-ink-secondary mb-3">
                See what's been assigned to you specifically, and log practice that happens outside a formal{" "}
                {labels.session.toLowerCase()}.
              </p>
              <LinkButton href="/practice" variant="secondary">Open Practice</LinkButton>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex gap-4">
            <StepBadge n={4} />
            <div className="flex-1">
              <SectionHeader title="Check progress before you go in" subtitle="Read-only, but useful." />
              <p className="text-sm text-ink-secondary mb-3">
                See how things are trending for the people you support — a fast way to walk in prepared without
                asking first.
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
      </div>

      <Card className="bg-plane border-0">
        <div className="font-medium mb-1">What's not yours to do</div>
        <p className="text-sm text-ink-secondary">
          Building or editing a {labels.program.toLowerCase()} — the operational definition, task analysis,{" "}
          {labels.mastery.toLowerCase()} criteria — is scoped to whoever holds {labels.practitioner.toLowerCase()}{" "}
          capability on that case. If something about the plan itself needs to change, that's a conversation with
          them, not something to edit directly.
        </p>
      </Card>
    </div>
  );
}

async function CaregiverGuide({
  userId,
  orgId,
  role,
  subjectIsSelf,
}: {
  userId: string;
  orgId: string;
  role: string;
  subjectIsSelf: boolean;
}) {
  const participants = await listParticipants(orgId, userId, role);
  const firstParticipant = participants[0];
  const labels = getLabels(firstParticipant?.workspaceType ?? "general");
  const whoseProgress = subjectIsSelf ? "your progress" : "their progress";

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-2xl font-medium">
            {subjectIsSelf ? "Getting Started: Tracking Your Practice" : "Getting Started: Supporting Practice"}
          </h1>
          <Pill tone="brand">{labels.caregiver}</Pill>
        </div>
        <p className="text-ink-secondary mt-2">
          This app runs a full Define → Teach → Practice → Measure → Analyze → Adjust → Generalize → Maintain loop,
          but {subjectIsSelf ? "your" : "your"} part of it is simple: log practice as it happens, and check in on{" "}
          {whoseProgress} whenever you want.
        </p>
        <p className="text-sm text-ink-muted mt-2 italic font-body">Practice. Measure. Improve. Repeat.</p>
      </div>

      {participants.length === 0 && (
        <Card className="border-l-4 border-l-brand">
          <div className="font-medium mb-1">Nothing linked to your account yet</div>
          <p className="text-sm text-ink-secondary">
            Once {subjectIsSelf ? "you're" : "you're"} connected to a participant, this guide will link straight to
            {subjectIsSelf ? " your" : " their"} pages.
          </p>
        </Card>
      )}

      <div className="space-y-5">
        <Card>
          <div className="flex gap-4">
            <StepBadge n={1} />
            <div className="flex-1">
              <SectionHeader title="Assigned practice" subtitle="Log practice as it happens — no formal session needed." />
              <p className="text-sm text-ink-secondary mb-3">
                Home shows what's been assigned to log. It's a quick way to keep a record of{" "}
                {subjectIsSelf ? "your own practice" : "the practice you support"} without a formal{" "}
                {labels.session.toLowerCase()}.
              </p>
              <LinkButton href="/practice" variant="secondary">Open Practice</LinkButton>
            </div>
          </div>
        </Card>

        {firstParticipant && (
          <Card>
            <div className="flex gap-4">
              <StepBadge n={2} />
              <div className="flex-1">
                <SectionHeader
                  title={subjectIsSelf ? "Your profile" : "Their profile"}
                  subtitle={`See ${subjectIsSelf ? "your" : "their"} ${labels.program.toLowerCase()}s, recent ${labels.sessionPlural.toLowerCase()}, and where things stand.`}
                />
                <p className="text-sm text-ink-secondary mb-3">Read-only, but everything's there.</p>
                <LinkButton href={`/people/${firstParticipant.id}`} variant="secondary">
                  {subjectIsSelf ? "See your profile" : "See their profile"}
                </LinkButton>
              </div>
            </div>
          </Card>
        )}

        <Card>
          <div className="flex gap-4">
            <StepBadge n={3} />
            <div className="flex-1">
              <SectionHeader title="Analytics" subtitle={`A trend view of ${whoseProgress} — Progressing, Stable, or Needs Review.`} />
              <p className="text-sm text-ink-secondary mb-3">A quick way to see how things are going without having to ask.</p>
              <LinkButton href="/analytics" variant="secondary">Open Analytics</LinkButton>
            </div>
          </div>
        </Card>
      </div>

      <Card className="bg-plane border-0">
        <div className="font-medium mb-1">Building the plan itself</div>
        <p className="text-sm text-ink-secondary">
          {labels.program}s, formal {labels.sessionPlural.toLowerCase()}, and any changes to{" "}
          {subjectIsSelf ? "your" : "the"} plan are handled by {subjectIsSelf ? "your" : "their"}{" "}
          {labels.practitioner.toLowerCase()} — reach out to them with questions about the plan itself.
          {subjectIsSelf &&
            " If you'd rather run your own practice end-to-end, ask about self-directed access — it's a separate capability an org admin can grant on your profile."}
        </p>
      </Card>
    </div>
  );
}

function GenericGuide({ role }: { role: string }) {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-medium">Getting Started</h1>
        <p className="text-ink-secondary mt-2">
          A guide tailored to your role isn't ready yet — here's what's available to you today.
        </p>
      </div>
      <Card>
        <SectionHeader title="What you can do here" />
        <p className="text-sm text-ink-secondary mb-3">
          {role === "caregiver"
            ? "Home and Practice show what's been assigned to you and let you log practice as it happens. Ask your practitioner for a walkthrough of a specific program if you want more detail on what you're supporting."
            : "Sessions and Practice let you log data for the participants you're assigned to. Ask your practitioner if you're unsure what you have access to for a specific person."}
        </p>
        <div className="flex gap-2 flex-wrap">
          <LinkButton href="/practice" variant="secondary">Practice</LinkButton>
          <LinkButton href="/sessions" variant="secondary">Sessions</LinkButton>
        </div>
      </Card>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type TourStep = {
  title: string;
  body: string;
  href?: string;
  hrefLabel?: string;
};

/**
 * Generic step-by-step modal carousel. Auto-shows once per browser
 * (localStorage, best-effort) when autoShowOnce is true and the storageKey
 * hasn't been seen yet, and is always manually reopenable via the trigger
 * link it renders. Each onboarding track (self-directed learner, full-access
 * practitioner/org admin, ...) supplies its own `steps` + `storageKey` — the
 * carousel/trigger UI itself is shared so every track looks and behaves the
 * same way.
 */
export function GuidedTour({
  steps,
  storageKey,
  autoShowOnce = true,
  triggerLabel = "Take the tour",
}: {
  steps: TourStep[];
  storageKey: string;
  autoShowOnce?: boolean;
  triggerLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    if (!autoShowOnce) return;
    try {
      const seen = window.localStorage.getItem(storageKey);
      if (!seen) setOpen(true);
    } catch {
      // localStorage unavailable (e.g. private browsing) — just skip auto-show.
    }
  }, [autoShowOnce, storageKey]);

  function close() {
    setOpen(false);
    setStepIndex(0);
    try {
      window.localStorage.setItem(storageKey, "1");
    } catch {
      // best-effort only
    }
  }

  function openTour() {
    setStepIndex(0);
    setOpen(true);
  }

  if (steps.length === 0) return null;

  const step = steps[stepIndex];
  const isLast = stepIndex === steps.length - 1;
  const isFirst = stepIndex === 0;

  return (
    <>
      <button type="button" onClick={openTour} className="text-xs text-brand-ink hover:underline font-medium">
        {triggerLabel}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40" role="dialog" aria-modal="true">
          <div className="bg-surface rounded-2xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center gap-1.5 mb-4">
              {steps.map((_, i) => (
                <div key={i} className={`h-1.5 flex-1 rounded-full transition ${i <= stepIndex ? "bg-brand" : "bg-gridline"}`} />
              ))}
            </div>

            <h2 className="text-lg font-medium mb-2">{step.title}</h2>
            <p className="text-sm text-ink-secondary mb-4">{step.body}</p>

            {step.href && step.hrefLabel && (
              <Link
                href={step.href}
                onClick={close}
                className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium bg-brand-soft text-brand-ink hover:opacity-90 mb-4"
              >
                {step.hrefLabel} →
              </Link>
            )}

            <div className="flex items-center justify-between pt-2 border-t border-gridline">
              <button type="button" onClick={close} className="text-xs text-ink-muted hover:text-ink">
                Skip tour
              </button>
              <div className="flex items-center gap-2">
                {!isFirst && (
                  <button
                    type="button"
                    onClick={() => setStepIndex((i) => Math.max(0, i - 1))}
                    className="rounded-lg border border-gridline px-3 py-1.5 text-xs font-medium hover:bg-plane"
                  >
                    Back
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => (isLast ? close() : setStepIndex((i) => Math.min(steps.length - 1, i + 1)))}
                  className="rounded-lg bg-ink text-white px-3 py-1.5 text-xs font-medium hover:opacity-90"
                >
                  {isLast ? "Done" : "Next"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function buildSelfDirectedSteps(opts: {
  participantId?: string;
  firstProgramId?: string;
  programLabel: string;
  sessionLabel: string;
}): TourStep[] {
  const { participantId, firstProgramId, programLabel, sessionLabel } = opts;
  const steps: TourStep[] = [
    {
      title: "Welcome — you're training yourself here",
      body: "This app runs one loop for everyone: Define → Teach → Practice → Measure → Analyze → Adjust → Generalize → Maintain. As a self-directed user, you run that loop on yourself. Nine quick stops — skip anytime.",
    },
  ];

  if (participantId) {
    steps.push({
      title: "Your profile",
      body: "This is your home base — your own programs, sessions, and progress live here. Everything below starts from this page.",
      href: `/people/${participantId}`,
      hrefLabel: "Go to your profile",
    });
    steps.push({
      title: `Define: build a ${programLabel.toLowerCase()}`,
      body: `Write what you're working on, break it into steps if needed, and set the criteria that tell you when you've got it. Your prompt hierarchy and teaching approach live here too.`,
      href: `/people/${participantId}/programs/new`,
      hrefLabel: `Build a ${programLabel}`,
    });
    steps.push({
      title: `Practice: run a ${sessionLabel.toLowerCase()}`,
      body: `Structured, rep-by-rep data collection. Use this when you want real numbers behind your progress, not just a memory of how it went.`,
      href: `/sessions/new?participantId=${participantId}`,
      hrefLabel: `Start a ${sessionLabel}`,
    });
  } else {
    steps.push({
      title: "Your profile isn't set up yet",
      body: "Self-directed access needs an org admin to create your participant profile and grant you both a learner and a practitioner capability row. Once that's done, this tour will link straight to your own pages.",
    });
  }

  steps.push({
    title: "Practice Mode — the lighter log",
    body: "For reps between formal sessions. Less structured, good for keeping a volume trail — you can even assign practice to yourself as a reminder.",
    href: "/practice",
    hrefLabel: "Open Practice Mode",
  });

  steps.push({
    title: "Analyze your data",
    body: "The Analytics board sorts every program into Progressing, Stable, or Needs Review. Open a specific program for trend lines and a plain-language read of what the data shows — never an automatic recommendation.",
    href: firstProgramId ? `/analytics/${firstProgramId}` : "/analytics",
    hrefLabel: "Open Analytics",
  });

  steps.push({
    title: "Adjust, generalize, maintain",
    body: "Inside a program page: a Decision Log for tracking what you changed and why, a Generalization matrix for where the skill transfers, and a Maintenance schedule once you've mastered it — so gains don't quietly slip.",
    href: firstProgramId ? `/programs/${firstProgramId}` : undefined,
    hrefLabel: firstProgramId ? "Open your program" : undefined,
  });

  steps.push({
    title: "Come back anytime",
    body: "This tour is a quick orientation. For the full written walkthrough, the Getting Started guide covers every stop in more depth.",
    href: "/guide",
    hrefLabel: "Open the full guide",
  });

  steps.push({
    title: "That's the loop",
    body: "Practice. Measure. Improve. Repeat. You've got this.",
  });

  return steps;
}

export function SelfDirectedTour(props: {
  storageKey: string;
  autoShowOnce?: boolean;
  participantId?: string;
  firstProgramId?: string;
  programLabel: string;
  sessionLabel: string;
}) {
  const { storageKey, autoShowOnce, ...stepOpts } = props;
  return <GuidedTour steps={buildSelfDirectedSteps(stepOpts)} storageKey={storageKey} autoShowOnce={autoShowOnce} />;
}

function buildFullAccessSteps(opts: {
  isOrgAdmin: boolean;
  firstParticipantId?: string;
  firstProgramId?: string;
  hasAnyParticipant: boolean;
}): TourStep[] {
  const { isOrgAdmin, firstParticipantId, firstProgramId, hasAnyParticipant } = opts;
  const steps: TourStep[] = [
    {
      title: "Welcome — you manage a caseload here",
      body: "This app runs one loop for every person you support: Define → Teach → Practice → Measure → Analyze → Adjust → Generalize → Maintain. As a practitioner, you run that loop across everyone on your caseload, not just one person. A quick tour of where each piece lives.",
    },
    {
      title: "People — your caseload",
      body: hasAnyParticipant
        ? "Every participant you support lives here. Open one to see their programs, sessions, and team; add a new one from this page whenever intake happens."
        : "Nobody's on your caseload yet. Add your first participant here — a name, an ID, and a workspace (Clinical, Performance, Education, or General) is all it takes to start.",
      href: hasAnyParticipant ? "/people" : "/people/new",
      hrefLabel: hasAnyParticipant ? "Open People" : "Add a participant",
    },
    {
      title: "Define: build a program",
      body: "From a participant's profile, Build Program walks through the operational definition, task analysis, prompt hierarchy, measurement type, and mastery criteria — the full spec for what you're teaching and how you'll know it's working.",
      href: firstParticipantId ? `/people/${firstParticipantId}/programs/new` : "/people",
      hrefLabel: firstParticipantId ? "Build a program" : "Open People to pick someone",
    },
    {
      title: "Practice: run a session",
      body: "Sessions is where structured, trial-by-trial data collection happens. Pick a participant and, optionally, which program the session covers — the app fills in their prompt hierarchy and targets automatically.",
      href: "/sessions/new",
      hrefLabel: "Start a session",
    },
  ];

  if (firstProgramId) {
    steps.push({
      title: "Adjust, fidelity, generalize, maintain",
      body: "A program page has everything after the first session: a Decision Log for changes and why you made them, an Implementation/Treatment Fidelity checklist, a Generalization matrix, and a Maintenance schedule once mastery is confirmed.",
      href: `/programs/${firstProgramId}`,
      hrefLabel: "Open a program",
    });
  }

  steps.push({
    title: "Analyze across your whole caseload",
    body: "The Analytics board sorts every active program into Progressing, Stable, or Needs Review, with average fidelity across recent observations — a fast read on where to focus next.",
    href: "/analytics",
    hrefLabel: "Open Analytics",
  });

  if (isOrgAdmin) {
    steps.push({
      title: "Organization — team & audit log",
      body: "As an org admin, you also manage accounts and can see a running audit trail of program changes, mastery confirmations, and permission changes across the org.",
      href: "/organization",
      hrefLabel: "Open Organization",
    });
  }

  steps.push({
    title: "Come back anytime",
    body: "This tour is a quick orientation. The Getting Started guide covers the same ground with more depth, and stays put for whenever you need it.",
    href: "/guide",
    hrefLabel: "Open the full guide",
  });

  steps.push({
    title: "That's the loop",
    body: "Practice. Measure. Improve. Repeat — across everyone you support.",
  });

  return steps;
}

export function FullAccessTour(props: {
  storageKey: string;
  autoShowOnce?: boolean;
  isOrgAdmin: boolean;
  firstParticipantId?: string;
  firstProgramId?: string;
  hasAnyParticipant: boolean;
}) {
  const { storageKey, autoShowOnce, ...stepOpts } = props;
  return <GuidedTour steps={buildFullAccessSteps(stepOpts)} storageKey={storageKey} autoShowOnce={autoShowOnce} />;
}

function buildImplementerSteps(opts: {
  hasAnyParticipant: boolean;
  firstParticipantId?: string;
  firstProgramId?: string;
  sessionLabel: string;
  programLabel: string;
}): TourStep[] {
  const { hasAnyParticipant, firstParticipantId, firstProgramId, sessionLabel, programLabel } = opts;
  const steps: TourStep[] = [
    {
      title: "Welcome — you run sessions for the people you support",
      body: `Building a ${programLabel.toLowerCase()} is your practitioner's call — your part of the loop is Practice: running sessions and logging progress for whoever you're assigned to. A quick tour of what's yours to do.`,
    },
    {
      title: "People — who you're assigned to",
      body: hasAnyParticipant
        ? "Open a participant to see their program, prompt hierarchy, and recent sessions before you work with them."
        : "Nobody's assigned to you yet — check with your practitioner or org admin.",
      href: hasAnyParticipant ? "/people" : undefined,
      hrefLabel: hasAnyParticipant ? "Open People" : undefined,
    },
    {
      title: `Practice: run a ${sessionLabel.toLowerCase()}`,
      body: "Structured, rep-by-rep data collection. Pick who you're working with — the prompt hierarchy and targets they're already set up with load in automatically.",
      href: firstParticipantId ? `/sessions/new?participantId=${firstParticipantId}` : "/sessions/new",
      hrefLabel: `Start a ${sessionLabel}`,
    },
    {
      title: "Practice Mode — the lighter log",
      body: "For homework-style practice between formal sessions, and anything assigned to you specifically.",
      href: "/practice",
      hrefLabel: "Open Practice",
    },
  ];

  steps.push({
    title: "Check progress before you go in",
    body: "You can see how things are trending — read-only, but a good way to walk in prepared.",
    href: firstProgramId ? `/analytics/${firstProgramId}` : "/analytics",
    hrefLabel: "Open Analytics",
  });

  steps.push({
    title: "That's the loop",
    body: "Practice. Measure. Improve. Repeat.",
  });

  return steps;
}

export function ImplementerTour(props: {
  storageKey: string;
  autoShowOnce?: boolean;
  hasAnyParticipant: boolean;
  firstParticipantId?: string;
  firstProgramId?: string;
  sessionLabel: string;
  programLabel: string;
}) {
  const { storageKey, autoShowOnce, ...stepOpts } = props;
  return <GuidedTour steps={buildImplementerSteps(stepOpts)} storageKey={storageKey} autoShowOnce={autoShowOnce} />;
}

function buildCaregiverSteps(opts: {
  subjectIsSelf: boolean;
  hasParticipant: boolean;
  firstParticipantId?: string;
  practitionerLabel: string;
}): TourStep[] {
  const { subjectIsSelf, hasParticipant, firstParticipantId, practitionerLabel } = opts;
  const whoseProgress = subjectIsSelf ? "your progress" : "their progress";
  const yourWork = subjectIsSelf ? "your own" : "the practice you support";

  const steps: TourStep[] = [
    {
      title: subjectIsSelf ? "Welcome — here's how to track your practice" : "Welcome — here's how to support their practice",
      body: `This app runs a full Define → Teach → Practice → Measure → Analyze → Adjust → Generalize → Maintain loop, but ${
        subjectIsSelf ? "your" : "your"
      } part of it is simple: log practice as it happens, and check in on ${whoseProgress} whenever you want.`,
    },
    {
      title: "Assigned practice",
      body: `Home shows what's been assigned to log — a quick way to keep a record of ${yourWork} without a formal session.`,
      href: "/practice",
      hrefLabel: "Open Practice",
    },
  ];

  if (hasParticipant && firstParticipantId) {
    steps.push({
      title: subjectIsSelf ? "Your profile" : "Their profile",
      body: subjectIsSelf
        ? "See your own programs, recent sessions, and where things stand — read-only, but everything's there."
        : "See their programs, recent sessions, and where things stand — read-only, but everything's there.",
      href: `/people/${firstParticipantId}`,
      hrefLabel: subjectIsSelf ? "See your profile" : "See their profile",
    });
  }

  steps.push({
    title: "Analytics",
    body: `A trend view of ${whoseProgress} — Progressing, Stable, or Needs Review — without having to ask.`,
    href: "/analytics",
    hrefLabel: "Open Analytics",
  });

  steps.push({
    title: "Building the plan itself",
    body: `Programs, formal sessions, and any changes to the plan are handled by ${
      subjectIsSelf ? "your" : "their"
    } ${practitionerLabel.toLowerCase()} — reach out to them with questions about the plan itself.`,
  });

  steps.push({
    title: "That's the loop",
    body: "Practice. Measure. Improve. Repeat.",
  });

  return steps;
}

export function CaregiverTour(props: {
  storageKey: string;
  autoShowOnce?: boolean;
  subjectIsSelf: boolean;
  hasParticipant: boolean;
  firstParticipantId?: string;
  practitionerLabel: string;
}) {
  const { storageKey, autoShowOnce, ...stepOpts } = props;
  return <GuidedTour steps={buildCaregiverSteps(stepOpts)} storageKey={storageKey} autoShowOnce={autoShowOnce} />;
}

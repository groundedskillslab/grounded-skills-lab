"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type TourStep = {
  title: string;
  body: string;
  href?: string;
  hrefLabel?: string;
};

function buildSteps(opts: { participantId?: string; firstProgramId?: string; programLabel: string; sessionLabel: string }): TourStep[] {
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

export function SelfDirectedTour({
  storageKey,
  autoShowOnce = true,
  participantId,
  firstProgramId,
  programLabel,
  sessionLabel,
}: {
  storageKey: string;
  autoShowOnce?: boolean;
  participantId?: string;
  firstProgramId?: string;
  programLabel: string;
  sessionLabel: string;
}) {
  const [open, setOpen] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const steps = buildSteps({ participantId, firstProgramId, programLabel, sessionLabel });

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

  const step = steps[stepIndex];
  const isLast = stepIndex === steps.length - 1;
  const isFirst = stepIndex === 0;

  return (
    <>
      <button
        type="button"
        onClick={openTour}
        className="text-xs text-brand-ink hover:underline font-medium"
      >
        Take the tour
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40" role="dialog" aria-modal="true">
          <div className="bg-surface rounded-2xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center gap-1.5 mb-4">
              {steps.map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 flex-1 rounded-full transition ${i <= stepIndex ? "bg-brand" : "bg-gridline"}`}
                />
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

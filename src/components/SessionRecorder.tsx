"use client";

import { useMemo, useState, useTransition } from "react";
import { recordTrial } from "@/actions/sessions";

interface Step {
  id: string;
  text: string;
  isCritical: boolean;
}

interface TargetInfo {
  id: string;
  name: string;
  measurementType: string;
  unitLabel: string | null;
  promptLevels: string[] | null;
}

interface Counts {
  independent: number;
  prompted: number;
  incorrect: number;
  total: number;
}

const emptyCounts = (): Counts => ({ independent: 0, prompted: 0, incorrect: 0, total: 0 });

export function SessionRecorder({
  sessionId,
  targets,
  steps,
  initialCounts,
  labels,
}: {
  sessionId: string;
  targets: TargetInfo[];
  steps: Record<string, Step[]>; // targetId -> steps (task_analysis only)
  initialCounts: Record<string, Counts>;
  labels: { independent: string; prompt: string };
}) {
  const [activeTargetId, setActiveTargetId] = useState(targets[0]?.id);
  const [counts, setCounts] = useState<Record<string, Counts>>(initialCounts);
  const [taStepIndex, setTaStepIndex] = useState(0);
  const [taResults, setTaResults] = useState<{ stepId: string; result: string; promptLevel?: string }[]>([]);
  const [notes, setNotes] = useState("");
  const [flash, setFlash] = useState<string | null>(null);
  const [numericValue, setNumericValue] = useState("");
  const [isPending, startTransition] = useTransition();

  const activeTarget = targets.find((t) => t.id === activeTargetId) || targets[0];
  const activeSteps = activeTarget ? steps[activeTarget.id] || [] : [];
  const activeCounts = (activeTarget && counts[activeTarget.id]) || emptyCounts();

  const bump = (targetId: string, bucket: keyof Counts) => {
    setCounts((prev) => {
      const c = prev[targetId] || emptyCounts();
      return { ...prev, [targetId]: { ...c, [bucket]: c[bucket] + 1, total: c.total + 1 } };
    });
  };

  function submitSimpleTrial(result: "independent" | "prompted" | "incorrect" | "correct", promptLevel?: string) {
    if (!activeTarget) return;
    const bucket: keyof Counts = result === "correct" ? "independent" : (result as keyof Counts);
    bump(activeTarget.id, bucket);
    setFlash(result);
    setTimeout(() => setFlash(null), 350);
    startTransition(() => {
      recordTrial({ sessionId, targetId: activeTarget.id, result, promptLevel: promptLevel || null, notes: notes || null });
    });
  }

  function submitNumericTrial() {
    if (!activeTarget || numericValue === "") return;
    setCounts((prev) => {
      const c = prev[activeTarget.id] || emptyCounts();
      return { ...prev, [activeTarget.id]: { ...c, total: c.total + 1 } };
    });
    startTransition(() => {
      recordTrial({ sessionId, targetId: activeTarget.id, result: "correct", value: Number(numericValue), notes: notes || null });
    });
    setNumericValue("");
  }

  function recordTaStep(result: string, promptLevel?: string) {
    if (!activeTarget) return;
    const step = activeSteps[taStepIndex];
    const next = [...taResults, { stepId: step.id, result, promptLevel }];
    if (taStepIndex + 1 >= activeSteps.length) {
      // full attempt complete
      const overall = next.every((r) => r.result === "independent") ? "independent" : "prompted";
      bump(activeTarget.id, overall === "independent" ? "independent" : "prompted");
      startTransition(() => {
        recordTrial({ sessionId, targetId: activeTarget.id, result: overall, stepResults: next, notes: notes || null });
      });
      setTaResults([]);
      setTaStepIndex(0);
    } else {
      setTaResults(next);
      setTaStepIndex(taStepIndex + 1);
    }
  }

  const levelButtons = activeTarget?.promptLevels && activeTarget.promptLevels.length > 0 ? activeTarget.promptLevels : null;

  return (
    <div className="grid lg:grid-cols-[220px_1fr] gap-6">
      <div className="space-y-1.5">
        {targets.map((t) => (
          <button
            key={t.id}
            onClick={() => {
              setActiveTargetId(t.id);
              setTaStepIndex(0);
              setTaResults([]);
            }}
            className={`w-full text-left rounded-lg px-3 py-2.5 text-sm transition ${
              activeTargetId === t.id ? "bg-ink text-white" : "bg-surface border border-gridline hover:border-ink/30"
            }`}
          >
            <div className="font-medium">{t.name}</div>
            <div className={`text-xs ${activeTargetId === t.id ? "text-white/60" : "text-ink-muted"}`}>
              {(counts[t.id]?.total || 0)} recorded
            </div>
          </button>
        ))}
      </div>

      <div className="space-y-5">
        {activeTarget?.measurementType === "task_analysis" ? (
          <div className="card p-6">
            <div className="text-xs uppercase tracking-wide text-ink-muted mb-1">Step {taStepIndex + 1} of {activeSteps.length}</div>
            <div className="text-xl font-medium mb-6">{activeSteps[taStepIndex]?.text}</div>
            <TrialButtons levels={levelButtons} onPick={(r, l) => recordTaStep(r, l)} flash={flash} />
            <div className="mt-6 flex flex-wrap gap-1.5">
              {activeSteps.map((s, i) => (
                <span
                  key={s.id}
                  className={`h-2 flex-1 min-w-6 rounded-full ${
                    i < taResults.length ? (taResults[i].result === "independent" ? "bg-status-good" : "bg-status-warning") : i === taStepIndex ? "bg-ink" : "bg-gridline"
                  }`}
                />
              ))}
            </div>
          </div>
        ) : ["duration", "latency", "rating", "frequency", "custom"].includes(activeTarget?.measurementType || "") ? (
          <div className="card p-6">
            <div className="text-sm text-ink-secondary mb-2">{activeTarget?.name} — {activeTarget?.unitLabel || "value"}</div>
            <div className="flex gap-2">
              <input
                type="number"
                value={numericValue}
                onChange={(e) => setNumericValue(e.target.value)}
                className="flex-1 rounded-lg border border-gridline px-3 py-3 text-lg tabular"
                placeholder="0"
              />
              <button onClick={submitNumericTrial} className="rounded-lg bg-ink text-white px-6 text-sm font-medium">
                Save
              </button>
            </div>
          </div>
        ) : activeTarget?.measurementType === "correct_incorrect" || activeTarget?.measurementType === "yes_no" ? (
          <div className="card p-6">
            <div className="text-sm text-ink-secondary mb-4">{activeTarget?.name}</div>
            <div className="grid grid-cols-2 gap-3">
              <BigButton tone="good" onClick={() => submitSimpleTrial("correct")}>{activeTarget?.measurementType === "yes_no" ? "Yes" : "Correct"}</BigButton>
              <BigButton tone="critical" onClick={() => submitSimpleTrial("incorrect")}>{activeTarget?.measurementType === "yes_no" ? "No" : "Incorrect"}</BigButton>
            </div>
          </div>
        ) : (
          <div className="card p-6">
            <div className="text-sm text-ink-secondary mb-4">{activeTarget?.name}</div>
            <TrialButtons levels={levelButtons} onPick={(r, l) => submitSimpleTrial(r as any, l)} flash={flash} />
          </div>
        )}

        <div className="card p-5">
          <div className="text-xs uppercase tracking-wide text-ink-muted mb-3">Running Summary — this {activeTarget?.name}</div>
          <div className="grid grid-cols-4 gap-3 text-center">
            <SummaryStat label={labels.independent} value={activeCounts.independent} tone="good" />
            <SummaryStat label={labels.prompt + "ed"} value={activeCounts.prompted} tone="warning" />
            <SummaryStat label="Incorrect" value={activeCounts.incorrect} tone="critical" />
            <SummaryStat label="Total" value={activeCounts.total} />
          </div>
        </div>

        <div className="card p-4">
          <label className="block text-xs uppercase tracking-wide text-ink-muted mb-1.5">Notes</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder="Anything worth remembering about this session..."
            className="w-full rounded-lg border border-gridline px-3 py-2 text-sm"
          />
        </div>
      </div>
    </div>
  );
}

function TrialButtons({ levels, onPick, flash }: { levels: string[] | null; onPick: (result: string, level?: string) => void; flash: string | null }) {
  if (levels) {
    // Levels are ordered least-support -> most-support. First = independent, last treated as "incorrect" alternative stays separate.
    const [first, ...rest] = levels;
    return (
      <div className="flex flex-wrap gap-2">
        <BigButton tone="good" onClick={() => onPick("independent", first)}>{first}</BigButton>
        {rest.map((lvl) => (
          <BigButton key={lvl} tone="warning" small onClick={() => onPick("prompted", lvl)}>
            {lvl}
          </BigButton>
        ))}
        <BigButton tone="critical" onClick={() => onPick("incorrect")}>Incorrect</BigButton>
      </div>
    );
  }
  return (
    <div className="grid grid-cols-3 gap-3">
      <BigButton tone="good" onClick={() => onPick("independent")}>Independent</BigButton>
      <BigButton tone="warning" onClick={() => onPick("prompted")}>Prompted</BigButton>
      <BigButton tone="critical" onClick={() => onPick("incorrect")}>Incorrect</BigButton>
    </div>
  );
}

function BigButton({
  children,
  tone,
  onClick,
  small,
}: {
  children: React.ReactNode;
  tone: "good" | "warning" | "critical";
  onClick: () => void;
  small?: boolean;
}) {
  const toneClasses = {
    good: "bg-status-good-soft text-status-good hover:bg-status-good hover:text-white",
    warning: "bg-status-warning-soft text-[#8a5a00] hover:bg-status-warning hover:text-white",
    critical: "bg-status-critical-soft text-status-critical hover:bg-status-critical hover:text-white",
  }[tone];
  return (
    <button
      onClick={onClick}
      className={`rounded-xl font-medium transition active:scale-95 ${small ? "px-4 py-3 text-sm" : "py-6 text-base flex-1"} ${toneClasses}`}
    >
      {children}
    </button>
  );
}

function SummaryStat({ label, value, tone }: { label: string; value: number; tone?: "good" | "warning" | "critical" }) {
  const color = tone ? { good: "text-status-good", warning: "text-[#8a5a00]", critical: "text-status-critical" }[tone] : "text-ink";
  return (
    <div>
      <div className={`text-2xl font-medium tabular ${color}`}>{value}</div>
      <div className="text-[11px] text-ink-muted mt-0.5">{label}</div>
    </div>
  );
}

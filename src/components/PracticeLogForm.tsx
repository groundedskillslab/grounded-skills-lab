"use client";

import { useState } from "react";
import { logPractice } from "@/actions/practice";

const RESULT_OPTIONS = [
  { value: "successful", label: "Successful", tone: "good" },
  { value: "needed_help", label: "Needed Help", tone: "warning" },
  { value: "not_completed", label: "Not Completed", tone: "critical" },
  { value: "barrier", label: "Barrier Encountered", tone: "neutral" },
] as const;

const TONE_CLASSES: Record<string, { idle: string; active: string }> = {
  good: { idle: "bg-status-good-soft text-status-good", active: "bg-status-good text-white" },
  warning: { idle: "bg-status-warning-soft text-[#8a5a00]", active: "bg-status-warning text-white" },
  critical: { idle: "bg-status-critical-soft text-status-critical", active: "bg-status-critical text-white" },
  neutral: { idle: "bg-plane text-ink-secondary", active: "bg-ink text-white" },
};

export function PracticeLogForm({
  assignmentId,
  participantId,
  programId,
  targetId,
}: {
  assignmentId: string;
  participantId: string;
  programId: string;
  targetId?: string;
}) {
  const [result, setResult] = useState<string>("");
  const [confidence, setConfidence] = useState<number | null>(null);

  return (
    <form action={logPractice} className="space-y-5">
      <input type="hidden" name="assignmentId" value={assignmentId} />
      <input type="hidden" name="participantId" value={participantId} />
      <input type="hidden" name="programId" value={programId} />
      {targetId && <input type="hidden" name="targetId" value={targetId} />}
      <input type="hidden" name="result" value={result} />
      {confidence !== null && <input type="hidden" name="confidenceRating" value={confidence} />}

      <div>
        <label className="block text-xs font-medium mb-1">Session ID (optional)</label>
        <input name="sessionCode" placeholder="e.g. GSL-024 — if you're also using a Practice Journal" className="w-full rounded-lg border border-gridline px-3 py-2 text-sm" />
      </div>

      <div>
        <div className="text-xs uppercase tracking-wide text-ink-muted text-center mb-2">Practice</div>
        <div className="grid grid-cols-2 gap-3">
          {RESULT_OPTIONS.map((opt) => {
            const tones = TONE_CLASSES[opt.tone];
            const active = result === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setResult(opt.value)}
                aria-pressed={active}
                className={`rounded-xl font-medium py-6 transition ${active ? tones.active : tones.idle}`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium mb-1.5">How confident do you feel about this? (optional)</label>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setConfidence(confidence === n ? null : n)}
              aria-pressed={confidence === n}
              className={`flex-1 rounded-lg py-2 text-sm font-medium border transition ${
                confidence === n ? "bg-brand text-white border-brand" : "border-gridline text-ink-secondary hover:bg-plane"
              }`}
            >
              {n}
            </button>
          ))}
        </div>
        <div className="flex justify-between text-[11px] text-ink-muted mt-1">
          <span>Not confident</span>
          <span>Very confident</span>
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium mb-1">What worked? (optional)</label>
        <input name="whatWorkedNote" placeholder="e.g. Slower pace, quiet room, extra warm-up" className="w-full rounded-lg border border-gridline px-3 py-2 text-sm" />
      </div>
      <div>
        <label className="block text-xs font-medium mb-1">What got in the way? (optional)</label>
        <input name="barrierNote" placeholder="e.g. Fatigue, new environment, distraction" className="w-full rounded-lg border border-gridline px-3 py-2 text-sm" />
      </div>
      <div>
        <label className="block text-xs font-medium mb-1">Anything else? (optional)</label>
        <textarea name="notes" rows={2} className="w-full rounded-lg border border-gridline px-3 py-2 text-sm" />
      </div>

      <button
        type="submit"
        disabled={!result}
        className="w-full rounded-lg bg-ink text-white py-3 text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed"
      >
        Save
      </button>
    </form>
  );
}

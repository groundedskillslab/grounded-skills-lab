// Mastery criterion evaluation. This NEVER confirms mastery on its own —
// it only detects that the configured criterion "appears met" so a
// practitioner can review and confirm. See lib/mastery.ts callers.

export type MasteryCriteria =
  | { type: "percentage_consecutive"; threshold: number; consecutiveSessions: number }
  | { type: "independent_across_implementers"; threshold: number; implementerCount: number }
  | { type: "trials_across_environments"; correctCount: number; environmentCount: number }
  | { type: "task_analysis_independent"; consecutiveSessions: number }
  | { type: "rate_target"; threshold: number; consecutivePractices: number }
  | { type: "manual"; note?: string };

export interface TrialLike {
  sessionId: string;
  sessionDate: number; // epoch ms
  conductedByUserId: string;
  contextTags: string[];
  result: "independent" | "prompted" | "incorrect" | "correct" | "na";
  stepResults?: { stepId: string; result: string }[] | null;
}

export interface MasteryEvalResult {
  met: boolean;
  summary: string;
}

function sessionGroups(trials: TrialLike[]) {
  const bySession = new Map<string, TrialLike[]>();
  for (const t of trials) {
    if (!bySession.has(t.sessionId)) bySession.set(t.sessionId, []);
    bySession.get(t.sessionId)!.push(t);
  }
  return [...bySession.entries()]
    .map(([sessionId, items]) => ({
      sessionId,
      date: items[0].sessionDate,
      items,
    }))
    .sort((a, b) => a.date - b.date);
}

function pctCorrect(items: TrialLike[]) {
  if (items.length === 0) return 0;
  const good = items.filter((i) => i.result === "independent" || i.result === "correct").length;
  return (good / items.length) * 100;
}

export function evaluateMasteryRule(criteria: MasteryCriteria, trials: TrialLike[]): MasteryEvalResult {
  if (trials.length === 0) return { met: false, summary: "No data recorded yet." };

  switch (criteria.type) {
    case "percentage_consecutive": {
      const groups = sessionGroups(trials);
      if (groups.length < criteria.consecutiveSessions) {
        return { met: false, summary: `${groups.length} of ${criteria.consecutiveSessions} required sessions recorded.` };
      }
      const lastN = groups.slice(-criteria.consecutiveSessions);
      const pcts = lastN.map((g) => pctCorrect(g.items));
      const allMet = pcts.every((p) => p >= criteria.threshold);
      return {
        met: allMet,
        summary: `Last ${criteria.consecutiveSessions} sessions: ${pcts.map((p) => p.toFixed(0) + "%").join(", ")} (need ≥ ${criteria.threshold}%).`,
      };
    }
    case "independent_across_implementers": {
      const implementers = new Set(trials.map((t) => t.conductedByUserId));
      const pct = pctCorrect(trials);
      const met = implementers.size >= criteria.implementerCount && pct >= criteria.threshold;
      return {
        met,
        summary: `${pct.toFixed(0)}% independent across ${implementers.size} implementer(s) (need ≥ ${criteria.threshold}% across ${criteria.implementerCount}).`,
      };
    }
    case "trials_across_environments": {
      const envs = new Set(trials.flatMap((t) => t.contextTags || []));
      const correct = trials.filter((t) => t.result === "independent" || t.result === "correct").length;
      const met = correct >= criteria.correctCount && envs.size >= criteria.environmentCount;
      return {
        met,
        summary: `${correct} correct trials across ${envs.size} environment(s) (need ${criteria.correctCount} across ${criteria.environmentCount}).`,
      };
    }
    case "task_analysis_independent": {
      const groups = sessionGroups(trials.filter((t) => t.stepResults && t.stepResults.length > 0));
      if (groups.length < criteria.consecutiveSessions) {
        return { met: false, summary: `${groups.length} of ${criteria.consecutiveSessions} required sessions with task-analysis data.` };
      }
      const lastN = groups.slice(-criteria.consecutiveSessions);
      const allIndependent = lastN.every((g) =>
        g.items.every((i) => (i.stepResults || []).every((s) => s.result === "independent"))
      );
      return { met: allIndependent, summary: `Checked last ${criteria.consecutiveSessions} sessions for all-independent steps.` };
    }
    case "rate_target": {
      const groups = sessionGroups(trials);
      const lastN = groups.slice(-criteria.consecutivePractices);
      const met = lastN.length >= criteria.consecutivePractices && lastN.every((g) => pctCorrect(g.items) >= criteria.threshold);
      return { met, summary: `Last ${lastN.length} practices checked against target rate of ${criteria.threshold}.` };
    }
    case "manual":
    default:
      return { met: false, summary: "This mastery rule requires manual practitioner review." };
  }
}

export const MASTERY_CRITERIA_PRESETS: { label: string; criteria: MasteryCriteria }[] = [
  { label: "80% across 3 consecutive sessions", criteria: { type: "percentage_consecutive", threshold: 80, consecutiveSessions: 3 } },
  { label: "90% independent across 2 implementers", criteria: { type: "independent_across_implementers", threshold: 90, implementerCount: 2 } },
  { label: "10 correct trials across 2 environments", criteria: { type: "trials_across_environments", correctCount: 10, environmentCount: 2 } },
  { label: "All task-analysis steps independent, 2 consecutive sessions", criteria: { type: "task_analysis_independent", consecutiveSessions: 2 } },
  { label: "Maintain target rate for 3 practices", criteria: { type: "rate_target", threshold: 80, consecutivePractices: 3 } },
  { label: "Manual review only", criteria: { type: "manual" } },
];

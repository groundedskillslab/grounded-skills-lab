export interface TrialRow {
  id: string;
  sessionId: string;
  targetId: string;
  timestamp: number;
  result: string;
  promptLevel: string | null;
  value: number | null;
  stepResults: string | null;
  recordedByUserId: string;
}

export interface SessionAggregate {
  sessionId: string;
  date: number;
  n: number;
  performancePct: number;
  independencePct: number;
  avgValue: number | null;
}

function parseSteps(raw: string | null): { stepId: string; result: string }[] {
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

// Fraction (0-1) of a single trial that counts as "got it right, with or without
// support" — for task-analysis rows this is the fraction of steps completed
// correctly, so partial progress shows up rather than an all-or-nothing flag.
export function rowPerformanceFraction(t: Pick<TrialRow, "result" | "stepResults">): number {
  if (t.stepResults) {
    const steps = parseSteps(t.stepResults);
    if (steps.length === 0) return 0;
    const good = steps.filter((s) => s.result === "independent" || s.result === "correct" || s.result === "prompted").length;
    return good / steps.length;
  }
  return t.result === "independent" || t.result === "correct" || t.result === "prompted" ? 1 : 0;
}

export function aggregateTrialsBySession(trials: TrialRow[]): SessionAggregate[] {
  const bySession = new Map<string, TrialRow[]>();
  for (const t of trials) {
    if (!bySession.has(t.sessionId)) bySession.set(t.sessionId, []);
    bySession.get(t.sessionId)!.push(t);
  }
  const out: SessionAggregate[] = [];
  for (const [sessionId, rows] of bySession) {
    const date = Math.min(...rows.map((r) => r.timestamp));
    const taRows = rows.filter((r) => r.stepResults);
    let performancePct: number;
    let independencePct: number;
    if (taRows.length === rows.length && taRows.length > 0) {
      let stepTotal = 0;
      let stepCorrect = 0;
      let stepIndependent = 0;
      for (const r of taRows) {
        const steps = parseSteps(r.stepResults);
        stepTotal += steps.length;
        // Performance = completed correctly, with or without a prompt.
        stepCorrect += steps.filter((s) => s.result === "independent" || s.result === "correct" || s.result === "prompted").length;
        stepIndependent += steps.filter((s) => s.result === "independent").length;
      }
      performancePct = stepTotal ? (stepCorrect / stepTotal) * 100 : 0;
      independencePct = stepTotal ? (stepIndependent / stepTotal) * 100 : 0;
    } else {
      // Performance = got it right, regardless of support (independent, prompted, or correct).
      // Independence = got it right WITHOUT support. These are intentionally different metrics —
      // two learners at the same performance level can have very different independence levels.
      const good = rows.filter((r) => r.result === "independent" || r.result === "correct" || r.result === "prompted").length;
      const indep = rows.filter((r) => r.result === "independent").length;
      performancePct = rows.length ? (good / rows.length) * 100 : 0;
      independencePct = rows.length ? (indep / rows.length) * 100 : 0;
    }
    const values = rows.map((r) => r.value).filter((v): v is number => v !== null && v !== undefined);
    out.push({
      sessionId,
      date,
      n: rows.length,
      performancePct,
      independencePct,
      avgValue: values.length ? values.reduce((s, v) => s + v, 0) / values.length : null,
    });
  }
  return out.sort((a, b) => a.date - b.date);
}

export function promptLevelDistribution(trials: TrialRow[]): { level: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const t of trials) {
    const lvl = t.promptLevel || (t.result === "independent" ? "Independent" : "Unspecified");
    counts.set(lvl, (counts.get(lvl) || 0) + 1);
  }
  return [...counts.entries()].map(([level, count]) => ({ level, count }));
}

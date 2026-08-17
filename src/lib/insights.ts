// Insight Engine — finds descriptive patterns in already-computed data.
// Every output here is an "Observed Data Pattern", never a treatment
// recommendation, and every string should be traceable back to the
// numbers it quotes.

export interface Insight {
  text: string;
  kind: "trend" | "comparison" | "correlation" | "dosage" | "generalization";
}

export function trendInsight(label: string, points: { date: number; value: number }[], unit = "%"): Insight | null {
  if (points.length < 4) return null;
  const sorted = [...points].sort((a, b) => a.date - b.date);
  const half = Math.floor(sorted.length / 2);
  const first = sorted.slice(0, half);
  const last = sorted.slice(-half);
  const avg = (arr: typeof sorted) => arr.reduce((s, p) => s + p.value, 0) / arr.length;
  const a = avg(first);
  const b = avg(last);
  const delta = b - a;
  if (Math.abs(delta) < 5) {
    return { text: `${label} has remained stable, around ${b.toFixed(0)}${unit} over the last ${sorted.length} sessions.`, kind: "trend" };
  }
  const dir = delta > 0 ? "increased" : "decreased";
  return {
    text: `${label} has ${dir} from ${a.toFixed(0)}${unit} to ${b.toFixed(0)}${unit} over the past ${sorted.length} sessions.`,
    kind: "trend",
  };
}

export function independenceVsPerformanceInsight(
  performance: { date: number; value: number }[],
  independence: { date: number; value: number }[]
): Insight | null {
  const perfTrend = trendInsight("Performance", performance);
  const indTrend = trendInsight("Independence", independence);
  if (!perfTrend || !indTrend) return null;
  const perfUp = perfTrend.text.includes("increased");
  const indStable = indTrend.text.includes("stable");
  if (perfUp && indStable) {
    return {
      text: "Performance is improving, but independence has remained stable — the learner is getting more of these right, but not yet with less support.",
      kind: "comparison",
    };
  }
  if (perfUp && indTrend.text.includes("increased")) {
    return { text: "Both performance and independence are improving together.", kind: "comparison" };
  }
  return null;
}

export function fidelityPerformanceCorrelationInsight(
  points: { fidelityPercent: number; performancePercent: number }[]
): Insight | null {
  if (points.length < 4) return null;
  const high = points.filter((p) => p.fidelityPercent >= 90);
  const low = points.filter((p) => p.fidelityPercent < 90);
  if (high.length < 2 || low.length < 2) return null;
  const avg = (arr: typeof points, key: "performancePercent") => arr.reduce((s, p) => s + p[key], 0) / arr.length;
  const highAvg = avg(high, "performancePercent");
  const lowAvg = avg(low, "performancePercent");
  if (highAvg - lowAvg < 5) return null;
  return {
    text: `Sessions with implementation fidelity at or above 90% show higher average performance (${highAvg.toFixed(0)}% vs ${lowAvg.toFixed(0)}% when fidelity was lower).`,
    kind: "correlation",
  };
}

export function practiceDosageTrendInsight(logs: { date: number }[]): Insight | null {
  if (logs.length < 4) return null;
  const sorted = [...logs].sort((a, b) => a.date - b.date);
  const twoWeeksMs = 14 * 24 * 60 * 60 * 1000;
  const now = Date.now();
  const recent = sorted.filter((l) => now - l.date <= twoWeeksMs).length;
  const priorWindow = sorted.filter((l) => now - l.date > twoWeeksMs && now - l.date <= twoWeeksMs * 2).length;
  if (priorWindow === 0) return null;
  const delta = recent - priorWindow;
  if (Math.abs(delta) < 2) return null;
  return {
    text: `Practice frequency ${delta < 0 ? "declined" : "increased"} over the past two weeks (${priorWindow} sessions logged the prior two weeks vs ${recent} the most recent two weeks).`,
    kind: "dosage",
  };
}

export function contextComparisonInsight(
  byContext: { context: string; pct: number; n: number }[]
): Insight | null {
  const usable = byContext.filter((c) => c.n >= 3);
  if (usable.length < 2) return null;
  const sorted = [...usable].sort((a, b) => b.pct - a.pct);
  const best = sorted[0];
  const worst = sorted[sorted.length - 1];
  if (best.pct - worst.pct < 15) return null;
  return {
    text: `Success is highest in ${best.context} (${best.pct.toFixed(0)}%) and drops substantially in ${worst.context} (${worst.pct.toFixed(0)}%).`,
    kind: "comparison",
  };
}

export function generalizationGapInsight(
  target: string,
  masteredWith: string,
  notYetWith: string[]
): Insight | null {
  if (notYetWith.length === 0) return null;
  return {
    text: `${target} is mastered with ${masteredWith} but has not yet generalized to ${notYetWith.join(", ")}.`,
    kind: "generalization",
  };
}

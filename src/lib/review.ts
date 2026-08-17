import { aggregateTrialsBySession, TrialRow } from "@/lib/analytics";
import {
  getTrialsForProgram,
  getFidelityObservations,
  getGeneralizationProbes,
  getGeneralizationDimensions,
  getPracticeLogsForProgram,
} from "@/lib/data";

export type ReviewStatus = "progressing" | "stable" | "needs_review" | "insufficient_data";

export interface ReviewResult {
  status: ReviewStatus;
  reasons: string[];
  performanceDeltaPct: number | null;
  sessionCount: number;
  avgFidelityRecent: number | null;
}

export async function computeProgramReview(programId: string, journeyStage: string): Promise<ReviewResult> {
  const trials = (await getTrialsForProgram(programId)) as unknown as TrialRow[];
  const aggregates = aggregateTrialsBySession(trials);
  const reasons: string[] = [];

  if (aggregates.length < 3) {
    reasons.push("Fewer than 3 sessions recorded — not enough data yet for a reliable trend.");
    return { status: "insufficient_data", reasons, performanceDeltaPct: null, sessionCount: aggregates.length, avgFidelityRecent: null };
  }

  const half = Math.max(1, Math.floor(aggregates.length / 2));
  const firstAvg = aggregates.slice(0, half).reduce((s, a) => s + a.performancePct, 0) / half;
  const lastAvg = aggregates.slice(-half).reduce((s, a) => s + a.performancePct, 0) / half;
  const delta = lastAvg - firstAvg;

  const firstIndepAvg = aggregates.slice(0, half).reduce((s, a) => s + a.independencePct, 0) / half;
  const lastIndepAvg = aggregates.slice(-half).reduce((s, a) => s + a.independencePct, 0) / half;
  const indepDelta = lastIndepAvg - firstIndepAvg;

  const fidelity = await getFidelityObservations(programId);
  const recentFidelity = fidelity.slice(0, 3);
  const avgFidelityRecent = recentFidelity.length ? recentFidelity.reduce((s, f) => s + f.fidelityPercent, 0) / recentFidelity.length : null;

  const practiceLogs = await getPracticeLogsForProgram(programId);
  const twoWeeksAgo = Date.now() - 14 * 24 * 60 * 60 * 1000;
  const recentPractice = practiceLogs.filter((p) => p.date.getTime() >= twoWeeksAgo);

  const dims = await getGeneralizationDimensions(programId);
  const probes = await getGeneralizationProbes(programId);
  const notMet = probes.filter((p) => p.result === "not_met");

  let needsReview = false;
  if (delta <= -5) {
    needsReview = true;
    reasons.push(`Performance declined from ${firstAvg.toFixed(0)}% to ${lastAvg.toFixed(0)}%.`);
  }
  if (avgFidelityRecent !== null && avgFidelityRecent < 80) {
    needsReview = true;
    reasons.push(`Implementation fidelity is averaging ${avgFidelityRecent.toFixed(0)}% over the last ${recentFidelity.length} observations (below 80%).`);
  }
  if (indepDelta <= -8 && delta > -5) {
    needsReview = true;
    reasons.push("Prompt dependence appears to be increasing — independence is trending down even though overall performance isn't declining.");
  }
  if ((journeyStage === "acquisition" || journeyStage === "improving") && Math.abs(delta) < 4 && aggregates.length >= 6) {
    needsReview = true;
    reasons.push("Performance has been flat across recent sessions despite ongoing teaching.");
  }
  if (dims.length > 0 && journeyStage === "generalizing" && notMet.length > 0) {
    needsReview = true;
    reasons.push(`${notMet.length} generalization probe(s) not yet met.`);
  }
  if (practiceLogs.length > 0 && recentPractice.length === 0) {
    needsReview = true;
    reasons.push("No home/outside practice logged in the last two weeks.");
  }

  if (needsReview) {
    return { status: "needs_review", reasons, performanceDeltaPct: delta, sessionCount: aggregates.length, avgFidelityRecent };
  }
  if (delta >= 8 || indepDelta >= 8) {
    return {
      status: "progressing",
      reasons: [`Performance moved from ${firstAvg.toFixed(0)}% to ${lastAvg.toFixed(0)}%.`],
      performanceDeltaPct: delta,
      sessionCount: aggregates.length,
      avgFidelityRecent,
    };
  }
  return { status: "stable", reasons: ["Little recent change in performance."], performanceDeltaPct: delta, sessionCount: aggregates.length, avgFidelityRecent };
}

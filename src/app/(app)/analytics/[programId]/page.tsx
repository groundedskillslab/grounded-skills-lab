import { requireUser } from "@/lib/session";
import {
  getProgram, getParticipant, getProgramTargets, getTrialsForProgram, getProgramSessions,
  getFidelityObservations, getGeneralizationDimensions, getGeneralizationProbes, getMaintenancePlan,
  getPracticeLogsForProgram, getUser,
} from "@/lib/data";
import { userCanAccessParticipant } from "@/lib/rbac";
import { getLabels, JOURNEY_STAGES } from "@/lib/labels";
import { aggregateTrialsBySession, promptLevelDistribution, rowPerformanceFraction, TrialRow } from "@/lib/analytics";
import {
  trendInsight, independenceVsPerformanceInsight, fidelityPerformanceCorrelationInsight,
  practiceDosageTrendInsight, contextComparisonInsight, generalizationGapInsight, Insight,
} from "@/lib/insights";
import { Card, SectionHeader, Pill, EmptyState } from "@/components/ui";
import { TrendChart } from "@/components/charts/TrendChart";
import { BarList } from "@/components/charts/BarList";
import { notFound, redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function ProgramAnalyticsPage({ params }: { params: Promise<{ programId: string }> }) {
  const { programId } = await params;
  const user = await requireUser();
  const program = await getProgram(programId);
  if (!program) notFound();
  const participant = await getParticipant(program.participantId);
  if (!participant || participant.orgId !== user.orgId) notFound();
  const allowed = await userCanAccessParticipant(user.id, user.role, participant.id);
  if (!allowed) redirect("/analytics");

  const labels = getLabels(participant.workspaceType);

  const [targets, trials, sessions, fidelityObs, dims, probes, maintenance, practiceLogs] = await Promise.all([
    getProgramTargets(programId),
    getTrialsForProgram(programId) as unknown as Promise<TrialRow[]>,
    getProgramSessions(programId),
    getFidelityObservations(programId),
    getGeneralizationDimensions(programId),
    getGeneralizationProbes(programId),
    getMaintenancePlan(programId),
    getPracticeLogsForProgram(programId),
  ]);

  const aggregates = aggregateTrialsBySession(trials);
  const sessionMap = new Map(sessions.map((s) => [s.id, s]));

  const trendData = aggregates.map((a) => ({
    date: a.date,
    performance: Number(a.performancePct.toFixed(1)),
    independence: Number(a.independencePct.toFixed(1)),
  }));

  const promptDist = promptLevelDistribution(trials);

  // Context comparison
  const byContext = new Map<string, { correct: number; total: number }>();
  for (const t of trials) {
    const sess = sessionMap.get(t.sessionId);
    const tags: string[] = sess?.contextTags ? JSON.parse(sess.contextTags) : [];
    const fraction = rowPerformanceFraction(t);
    for (const tag of tags.length ? tags : ["Unspecified"]) {
      const c = byContext.get(tag) || { correct: 0, total: 0 };
      c.total += 1;
      c.correct += fraction;
      byContext.set(tag, c);
    }
  }
  const contextBars = [...byContext.entries()]
    .map(([context, v]) => ({ context, pct: v.total ? (v.correct / v.total) * 100 : 0, n: v.total }))
    .filter((c) => c.n >= 2)
    .sort((a, b) => b.pct - a.pct);

  // Fidelity trend
  const fidelityTrendData = [...fidelityObs].reverse().map((f) => ({ date: f.date.getTime(), fidelity: Number(f.fidelityPercent.toFixed(1)) }));

  // Insights
  const insights: Insight[] = [];
  const perfTrend = trendInsight("Performance", aggregates.map((a) => ({ date: a.date, value: a.performancePct })));
  if (perfTrend) insights.push(perfTrend);
  const cmp = independenceVsPerformanceInsight(
    aggregates.map((a) => ({ date: a.date, value: a.performancePct })),
    aggregates.map((a) => ({ date: a.date, value: a.independencePct }))
  );
  if (cmp) insights.push(cmp);

  const fidelityPerfPoints = fidelityObs
    .map((f) => {
      const near = aggregates.reduce((best, a) => (Math.abs(a.date - f.date.getTime()) < Math.abs((best?.date ?? Infinity) - f.date.getTime()) ? a : best), null as any);
      return near ? { fidelityPercent: f.fidelityPercent, performancePercent: near.performancePct } : null;
    })
    .filter(Boolean) as { fidelityPercent: number; performancePercent: number }[];
  const fidCorr = fidelityPerformanceCorrelationInsight(fidelityPerfPoints);
  if (fidCorr) insights.push(fidCorr);

  const dosage = practiceDosageTrendInsight(practiceLogs.map((p) => ({ date: p.date.getTime() })));
  if (dosage) insights.push(dosage);

  const ctxInsight = contextComparisonInsight(contextBars);
  if (ctxInsight) insights.push(ctxInsight);

  for (const dim of dims) {
    const dimProbes = probes.filter((p) => p.dimensionId === dim.id);
    const notMet = dimProbes.filter((p) => p.result === "not_met");
    if (notMet.length > 0) {
      const metWith = dims.find((d) => probes.some((p) => p.dimensionId === d.id && p.result === "met"));
      const gapInsight = generalizationGapInsight(program.name, metWith?.label || "the original implementer", [dim.label]);
      if (gapInsight) insights.push(gapInsight);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="text-sm text-ink-muted">{participant.displayName}</div>
        <h1 className="text-2xl font-medium">{program.name} — Analytics</h1>
        <Pill tone="brand">{JOURNEY_STAGES.find((s) => s.value === program.journeyStage)?.label}</Pill>
      </div>

      <Card>
        <SectionHeader title="Observed Data Patterns" subtitle="Descriptive observations, not automatic recommendations." />
        {insights.length === 0 ? (
          <EmptyState title="Not enough data yet for a pattern" body="Insights appear once several sessions have been recorded." />
        ) : (
          <ul className="space-y-2.5">
            {insights.map((ins, i) => (
              <li key={i} className="flex gap-2.5 text-sm">
                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-brand shrink-0" />
                <span>{ins.text}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card>
        <SectionHeader title="Performance & Independence Over Time" subtitle="Two related but distinct signals — getting it right vs. getting it right without help." />
        <TrendChart
          data={trendData}
          series={[
            { key: "performance", label: "Performance", colorIndex: 0 },
            { key: "independence", label: labels.independent, colorIndex: 2 },
          ]}
        />
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <SectionHeader title={`${labels.prompt} Level Distribution`} />
          <BarList items={promptDist.map((p) => ({ label: p.level, value: p.count }))} valueSuffix=" trials" max={Math.max(...promptDist.map((p) => p.count), 1)} />
        </Card>
        <Card>
          <SectionHeader title="Success by Context" />
          <BarList items={contextBars.map((c) => ({ label: c.context, value: c.pct, sublabel: `n=${c.n}` }))} />
        </Card>
      </div>

      {fidelityTrendData.length > 0 && (
        <Card>
          <SectionHeader title={`${labels.fidelity} Over Time`} />
          <TrendChart data={fidelityTrendData} series={[{ key: "fidelity", label: labels.fidelity, colorIndex: 6 }]} />
        </Card>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <SectionHeader title={labels.generalization} />
          {dims.length === 0 ? (
            <EmptyState title="No generalization dimensions defined" />
          ) : (
            <ul className="space-y-2">
              {dims.map((d) => {
                const latest = probes.filter((p) => p.dimensionId === d.id).sort((a, b) => b.date.getTime() - a.date.getTime())[0];
                const tone = latest ? ({ met: "good", partial: "warning", not_met: "critical" } as const)[latest.result as "met" | "partial" | "not_met"] : "neutral";
                return (
                  <li key={d.id} className="flex items-center justify-between text-sm">
                    <span>{d.label}</span>
                    <Pill tone={tone}>{latest ? latest.result.replace("_", " ") : "not probed"}</Pill>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
        <Card>
          <SectionHeader title={labels.maintenance} />
          {!maintenance ? (
            <EmptyState title="No maintenance plan yet" />
          ) : (
            <ul className="space-y-2">
              {maintenance.checks.map((c) => (
                <li key={c.id} className="flex items-center justify-between text-sm">
                  <span>{c.label}</span>
                  <Pill tone={c.result === "stable" ? "good" : c.result === "declined" ? "critical" : "neutral"}>{c.result.replace(/_/g, " ")}</Pill>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}

import { requireUser } from "@/lib/session";
import { listParticipants, getParticipantPrograms, getFidelityObservations, getSelfDirectedParticipant } from "@/lib/data";
import { computeProgramReview, ReviewStatus } from "@/lib/review";
import { getLabels } from "@/lib/labels";
import { Card, SectionHeader, Pill, EmptyState, StatTile } from "@/components/ui";
import Link from "next/link";

export const dynamic = "force-dynamic";

const COLUMN_META: Record<ReviewStatus, { title: string; subtitle: string; tone: any }> = {
  progressing: { title: "Progressing", subtitle: "Meaningful recent improvement.", tone: "good" },
  stable: { title: "Stable", subtitle: "Little recent change.", tone: "neutral" },
  needs_review: { title: "Needs Review", subtitle: "Worth a closer look.", tone: "serious" },
  insufficient_data: { title: "Insufficient Data", subtitle: "Not enough sessions yet.", tone: "warning" },
};

export default async function AnalyticsPage() {
  const user = await requireUser();
  const participants = await listParticipants(user.orgId, user.id, user.role);

  const rows: { participant: (typeof participants)[number]; program: any; review: any }[] = [];
  let fidelityTotal = 0;
  let fidelityCount = 0;
  for (const p of participants) {
    const progs = await getParticipantPrograms(p.id);
    for (const prog of progs) {
      const review = await computeProgramReview(prog.id, prog.journeyStage);
      rows.push({ participant: p, program: prog, review });
      const obs = await getFidelityObservations(prog.id);
      const recent = obs.slice(0, 3);
      if (recent.length) {
        fidelityTotal += recent.reduce((s, o) => s + o.fidelityPercent, 0);
        fidelityCount += recent.length;
      }
    }
  }

  const byStatus: Record<ReviewStatus, typeof rows> = { progressing: [], stable: [], needs_review: [], insufficient_data: [] };
  for (const r of rows) byStatus[r.review.status as ReviewStatus].push(r);

  const avgFidelity = fidelityCount ? fidelityTotal / fidelityCount : null;

  // Same self-directed signal used on Home/Practice/People — softens the
  // "professional implementation" framing for someone tracking their own
  // training rather than someone else's caseload.
  const selfDirected = user.role === "learner" ? await getSelfDirectedParticipant(user.id) : undefined;

  // The fidelity concept is workspace-vocabulary-aware everywhere else in
  // the app (e.g. "Coaching Fidelity" on the Program page) — this tile was
  // the one place still hardcoded to the clinical term regardless of who's
  // looking at it. Only resolve to a single vocabulary when every visible
  // participant shares one workspace type (always true for a self-directed
  // viewer, since they only ever see themselves); otherwise fall back to
  // the neutral "Fidelity" for a mixed-workspace org view.
  // For a self-directed viewer specifically, override to "Plan Fidelity" —
  // "Coaching Fidelity"/"Treatment Fidelity" etc. describe someone else
  // implementing a plan on your behalf, which doesn't fit someone following
  // their own plan for themselves. Presentation-only: the underlying
  // workspace LabelSet, data, and practitioner-facing wording are untouched.
  const workspaceTypes = new Set(participants.map((p) => p.workspaceType));
  const fidelityLabel = selfDirected
    ? "Plan Fidelity"
    : workspaceTypes.size === 1 ? getLabels([...workspaceTypes][0]).fidelity : "Fidelity";

  return (
    <div className="space-y-8">
      <SectionHeader
        title="Analytics"
        subtitle={
          selfDirected
            ? "What's improving, what's stalled, and what might need a closer look."
            : "Which programs are improving, which are stalled, and where implementation needs attention."
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatTile label="Active Programs" value={rows.length} />
        <StatTile label="Progressing" value={byStatus.progressing.length} tone="good" />
        <StatTile label="Needs Review" value={byStatus.needs_review.length} tone={byStatus.needs_review.length > 0 ? "serious" : "good"} />
        <StatTile
          label={`Avg. ${fidelityLabel} (recent)`}
          value={avgFidelity !== null ? `${avgFidelity.toFixed(0)}%` : "—"}
          tone={avgFidelity !== null && avgFidelity < 80 ? "warning" : "good"}
          sub={selfDirected ? "How closely you're following your own plan" : undefined}
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {(["needs_review", "progressing", "stable"] as ReviewStatus[]).map((status) => (
          <Card key={status}>
            <SectionHeader title={COLUMN_META[status].title} subtitle={COLUMN_META[status].subtitle} />
            {byStatus[status].length === 0 ? (
              <EmptyState title="Nothing here" />
            ) : (
              <ul className="space-y-3">
                {byStatus[status].map((r) => (
                  <li key={r.program.id}>
                    <Link href={`/analytics/${r.program.id}`} className="block rounded-lg border border-gridline p-3 hover:border-brand/40 transition">
                      <div className="font-medium text-sm">{r.program.name}</div>
                      <div className="text-xs text-ink-muted mb-1.5">{r.participant.displayName}</div>
                      {r.review.reasons[0] && <div className="text-xs text-ink-secondary">{r.review.reasons[0]}</div>}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        ))}
      </div>

      {byStatus.insufficient_data.length > 0 && (
        <Card>
          <SectionHeader title="Insufficient Data" subtitle="These programs need more sessions before a trend is meaningful." />
          <div className="flex flex-wrap gap-2">
            {byStatus.insufficient_data.map((r) => (
              <Link key={r.program.id} href={`/analytics/${r.program.id}`}>
                <Pill tone="warning">{r.program.name} — {r.participant.displayName}</Pill>
              </Link>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

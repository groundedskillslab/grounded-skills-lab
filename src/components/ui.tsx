import { JOURNEY_STAGES } from "@/lib/labels";
import Link from "next/link";

export function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`card p-5 ${className}`}>{children}</div>;
}

export function SectionHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 mb-4">
      <div>
        <h2 className="text-lg font-medium">{title}</h2>
        {subtitle && <p className="text-sm text-ink-secondary mt-0.5">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function StatTile({ label, value, sub, tone }: { label: string; value: string | number; sub?: string; tone?: "good" | "warning" | "serious" | "critical" }) {
  const toneColor = tone
    ? { good: "text-status-good", warning: "text-status-warning", serious: "text-status-serious", critical: "text-status-critical" }[tone]
    : "text-ink";
  return (
    <Card>
      <div className="text-xs uppercase tracking-wide text-ink-muted mb-2">{label}</div>
      <div className={`text-3xl font-medium tabular ${toneColor}`}>{value}</div>
      {sub && <div className="text-xs text-ink-muted mt-1">{sub}</div>}
    </Card>
  );
}

const PILL_TONES: Record<string, string> = {
  good: "bg-status-good-soft text-status-good",
  warning: "bg-status-warning-soft text-[#8a5a00]",
  serious: "bg-status-serious-soft text-[#9a4322]",
  critical: "bg-status-critical-soft text-status-critical",
  neutral: "bg-plane text-ink-secondary",
  brand: "bg-brand-soft text-brand-ink",
};

export function Pill({ tone = "neutral", children }: { tone?: keyof typeof PILL_TONES; children: React.ReactNode }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${PILL_TONES[tone]}`}>
      {children}
    </span>
  );
}

export function JourneyBar({ stage, compact = false }: { stage: string; compact?: boolean }) {
  const idx = JOURNEY_STAGES.findIndex((s) => s.value === stage);
  return (
    <div className="flex items-center w-full">
      {JOURNEY_STAGES.map((s, i) => {
        const done = i < idx;
        const current = i === idx;
        return (
          <div key={s.value} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1.5 shrink-0">
              <div
                className={`rounded-full transition ${compact ? "h-2.5 w-2.5" : "h-3.5 w-3.5"} ${
                  current ? "bg-brand ring-4 ring-brand-soft" : done ? "bg-brand" : "bg-gridline"
                }`}
              />
              {!compact && (
                <span className={`text-[11px] whitespace-nowrap ${current ? "text-brand-ink font-medium" : "text-ink-muted"}`}>
                  {s.label}
                </span>
              )}
            </div>
            {i < JOURNEY_STAGES.length - 1 && (
              <div className={`h-px flex-1 mx-1 ${i < idx ? "bg-brand" : "bg-gridline"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

export function EmptyState({ title, body, action }: { title: string; body?: string; action?: React.ReactNode }) {
  return (
    <div className="text-center py-16 px-6">
      <div className="text-ink font-medium mb-1">{title}</div>
      {body && <div className="text-sm text-ink-secondary max-w-sm mx-auto">{body}</div>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function LinkButton({ href, children, variant = "primary" }: { href: string; children: React.ReactNode; variant?: "primary" | "secondary" }) {
  const cls =
    variant === "primary"
      ? "bg-ink text-white hover:opacity-90"
      : "bg-transparent border border-gridline text-ink hover:bg-plane";
  return (
    <Link href={href} className={`inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition ${cls}`}>
      {children}
    </Link>
  );
}

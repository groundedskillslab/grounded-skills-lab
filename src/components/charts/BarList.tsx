import { CATEGORICAL } from "@/lib/chartColors";

export function BarList({
  items,
  valueSuffix = "%",
  max = 100,
}: {
  items: { label: string; value: number; sublabel?: string }[];
  valueSuffix?: string;
  max?: number;
}) {
  if (items.length === 0) return <div className="text-sm text-ink-muted py-4">No data yet.</div>;
  return (
    <div className="space-y-3">
      {items.map((item, i) => (
        <div key={item.label}>
          <div className="flex items-baseline justify-between mb-1">
            <span className="text-sm font-medium">{item.label}</span>
            <span className="text-sm tabular text-ink-secondary">
              {item.value.toFixed(0)}
              {valueSuffix}
            </span>
          </div>
          <div className="h-2 rounded-full bg-plane overflow-hidden">
            <div
              className="h-full rounded-full"
              style={{ width: `${Math.min(100, (item.value / max) * 100)}%`, background: CATEGORICAL[i % CATEGORICAL.length] }}
            />
          </div>
          {item.sublabel && <div className="text-xs text-ink-muted mt-1">{item.sublabel}</div>}
        </div>
      ))}
    </div>
  );
}

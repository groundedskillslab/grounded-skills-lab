"use client";

import { useState } from "react";

export function Tabs({ panels, defaultId }: { panels: { id: string; label: string; content: React.ReactNode; badge?: React.ReactNode }[]; defaultId?: string }) {
  const [active, setActive] = useState(defaultId || panels[0]?.id);
  const activePanel = panels.find((p) => p.id === active) || panels[0];

  return (
    <div>
      <div className="flex items-center gap-1 border-b border-gridline mb-6 overflow-x-auto">
        {panels.map((p) => (
          <button
            key={p.id}
            onClick={() => setActive(p.id)}
            className={`px-3.5 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 -mb-px transition flex items-center gap-1.5 ${
              active === p.id ? "border-ink text-ink" : "border-transparent text-ink-muted hover:text-ink"
            }`}
          >
            {p.label}
            {p.badge}
          </button>
        ))}
      </div>
      <div>{activePanel?.content}</div>
    </div>
  );
}

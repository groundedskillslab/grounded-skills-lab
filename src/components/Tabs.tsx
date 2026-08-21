"use client";

import { useState } from "react";

export function Tabs({
  panels,
  defaultId,
  numbered = false,
}: {
  panels: { id: string; label: string; content: React.ReactNode; badge?: React.ReactNode }[];
  defaultId?: string;
  /** Render as a numbered left-to-right pill progression instead of an underlined tab bar —
   * every pill stays clickable (order is a suggestion, not a lock), just visually numbered so
   * the intended sequence is obvious. Built for self-directed users working through a program
   * with no coach in the room to say "do this part next." */
  numbered?: boolean;
}) {
  const [active, setActive] = useState(defaultId || panels[0]?.id);
  const activeIndex = panels.findIndex((p) => p.id === active);
  const activePanel = panels[activeIndex] ?? panels[0];

  return (
    <div>
      {numbered ? (
        <div className="card px-4 py-3.5 mb-6 overflow-x-auto">
          <div className="flex items-center w-max">
            {panels.map((p, i) => (
              <div key={p.id} className="flex items-center">
                {i > 0 && <div className={`w-5 h-px mx-0.5 ${i <= activeIndex ? "bg-brand" : "bg-gridline"}`} />}
                <button
                  onClick={() => setActive(p.id)}
                  aria-current={i === activeIndex ? "step" : undefined}
                  className={`flex items-center gap-1.5 rounded-full pl-1.5 pr-3 py-1.5 text-sm font-medium whitespace-nowrap transition border ${
                    i === activeIndex
                      ? "bg-ink text-white border-ink"
                      : "bg-plane text-ink-muted border-gridline hover:text-ink hover:border-ink-muted"
                  }`}
                >
                  <span
                    className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-[11px] font-semibold border ${
                      i === activeIndex ? "bg-brand text-ink border-brand" : "bg-surface text-ink-muted border-gridline"
                    }`}
                  >
                    {i + 1}
                  </span>
                  {p.label}
                  {p.badge}
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : (
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
      )}
      <div>{activePanel?.content}</div>
    </div>
  );
}

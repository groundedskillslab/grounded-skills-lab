// A small, native <details> disclosure — no client JS needed, works without
// hydration, degrades gracefully. Drop it in a SectionHeader's `action` slot
// for a "What's this?" toggle that explains a form section in plain language
// with a concrete example, instead of assuming the reader already knows the
// term (built for self-directed users building their own program with no
// coach/BCBA in the room to ask).
export function HelpDisclosure({
  label = "What's this?",
  children,
}: {
  label?: string;
  children: React.ReactNode;
}) {
  return (
    <details className="text-xs">
      <summary className="cursor-pointer text-ink-muted underline hover:text-ink list-none [&::-webkit-details-marker]:hidden">
        {label}
      </summary>
      <div className="mt-2 max-w-sm text-sm text-ink-secondary bg-plane/60 border border-gridline rounded-lg p-3 space-y-2">
        {children}
      </div>
    </details>
  );
}

// Shared "GROUNDED / SKILLS LAB" lockup — used by the nav, footer, and the
// beta page header, so all three stay in sync.
//
// The two lines are tuned to justify into one tight rectangle: "SKILLS LAB"
// is set at 78% of GROUNDED's size with 0.345em tracking, a ratio measured
// (not eyeballed) against the real Sofia Pro metrics so its tracked width
// lands on GROUNDED's width exactly — both lines start and end at the same
// edges. That match holds at any size these are rendered at, since both the
// percentage size and the em-based tracking scale proportionally together.
//
// Letter-spacing also adds trailing space after the very last glyph, and
// text-align:center factors that trailing space into where it centers a
// line — so two lines with different tracking would drift to different
// visual centers even while each is individually "centered." Each line
// cancels its own trailing space with a matching negative margin-right so
// both share one true optical center (this also matters for the rectangle:
// without it, the trailing gap would break the right-edge alignment).

export function Wordmark({ size = "text-[15px]" }: { size?: string }) {
  return (
    <div className={`font-heading font-semibold ${size} text-center leading-[1]`}>
      <span className="inline-block tracking-[0.1em] mr-[-0.1em]">GROUNDED</span>
      <br />
      <span className="inline-block mt-[1px] text-[78%] font-normal tracking-[0.345em] mr-[-0.345em] text-brand">
        SKILLS LAB
      </span>
    </div>
  );
}

// Single-line compact variant for tight spaces (mobile nav header, beta page
// header) where the two-line stack doesn't fit.
export function WordmarkInline({ className = "" }: { className?: string }) {
  return (
    <span className={`font-heading font-semibold tracking-[0.01em] ${className}`}>
      GROUNDED <span className="font-normal text-brand tracking-[0.04em]">SKILLS LAB</span>
    </span>
  );
}

// Shared "GROUNDED / SKILLS LAB" lockup — used by the nav, footer, and the
// beta page header, so all three stay in sync.
//
// Two fixes over the first pass: (1) tracking on "SKILLS LAB" was 0.34em on
// text rendered at 57% size — at that scale it read as scattered dots, not a
// word. Brought both lines' tracking down to something an eye can actually
// parse. (2) letter-spacing adds trailing space after the last glyph, and
// text-align:center includes that trailing space when it centers a line —
// so two lines with different tracking amounts (and thus different trailing
// space) don't stack centered over each other, they visibly drift apart.
// Each line cancels its own trailing space with a matching negative
// margin-right so both lines share one true optical center.

export function Wordmark({ size = "text-[15px]" }: { size?: string }) {
  return (
    <div className={`font-heading font-semibold ${size} text-center leading-[1.05]`}>
      <span className="inline-block tracking-[0.1em] mr-[-0.1em]">GROUNDED</span>
      <br />
      <span className="inline-block mt-[3px] text-[64%] font-normal tracking-[0.13em] mr-[-0.13em] text-brand">
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

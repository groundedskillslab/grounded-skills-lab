import Link from "next/link";

const FOOTER_COLUMNS = [
  { heading: "Product", links: [{ label: "How it works", href: "#how-it-works" }, { label: "Self-Directed", href: "#self-directed" }, { label: "Coaches & Practitioners", href: "#supported-practice" }] },
  { heading: "Company", links: [{ label: "About", href: "#about" }, { label: "Practice Journal", href: "#journal" }, { label: "Join the Beta", href: "/beta" }] },
  { heading: "Sign In", links: [{ label: "App Sign In", href: "/login" }] },
];

export function MarketingFooter() {
  return (
    <footer className="bg-ink text-white px-6 sm:px-10 py-12 sm:py-16 sm:pb-8">
      <div className="max-w-[1400px] mx-auto grid grid-cols-1 sm:grid-cols-[1.4fr_1fr_1fr_1fr] gap-8 sm:gap-10 pb-8 sm:pb-10 border-b border-white/10">
        <div>
          <Link href="/" className="flex items-center gap-2.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-mark.svg" alt="" className="w-6 h-auto" aria-hidden />
            <div className="font-heading font-semibold text-[13px] leading-[1.1] tracking-[0.18em] text-center">
              GROUNDED
              <br />
              <span className="text-[57%] font-normal tracking-[0.34em] text-brand">SKILLS LAB</span>
            </div>
          </Link>
          <p className="font-body italic text-brand-soft text-[15px] mt-4">Practice. Measure. Improve. Repeat.</p>
        </div>

        {FOOTER_COLUMNS.map((col) => (
          <div key={col.heading}>
            <div className="font-heading text-[11px] tracking-[0.1em] uppercase text-white/45 mb-3.5">{col.heading}</div>
            <div className="flex flex-col gap-2.5 font-heading text-[13.5px] text-white/80">
              {col.links.map((l) => (
                <Link key={l.label} href={l.href}>
                  {l.label}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="max-w-[1400px] mx-auto flex justify-between pt-6 font-heading text-xs text-white/45">
        <div>© {new Date().getFullYear()} Grounded Skills Lab</div>
        <div className="flex gap-6">
          <Link href="#">Privacy</Link>
          <Link href="#">Terms</Link>
        </div>
      </div>
    </footer>
  );
}

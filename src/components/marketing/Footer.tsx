import Link from "next/link";
import { Wordmark } from "./Wordmark";

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
            <Wordmark size="text-[13px]" />
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

      <div className="max-w-[1400px] mx-auto flex justify-between items-center pt-6 font-heading text-xs text-white/45">
        <div>© {new Date().getFullYear()} Grounded Skills Lab</div>
        <div className="flex items-center gap-6">
          <a
            href="https://www.instagram.com/groundedskillslab/"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Grounded Skills Lab on Instagram"
            className="hover:text-white transition"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
              <rect x="2" y="2" width="20" height="20" rx="5.5" stroke="currentColor" strokeWidth="1.8" />
              <circle cx="12" cy="12" r="4.2" stroke="currentColor" strokeWidth="1.8" />
              <circle cx="17.4" cy="6.6" r="1.1" fill="currentColor" />
            </svg>
          </a>
          <Link href="/privacy">Privacy</Link>
          <Link href="/terms">Terms</Link>
        </div>
      </div>
    </footer>
  );
}

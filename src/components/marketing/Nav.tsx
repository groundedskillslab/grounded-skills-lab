"use client";

import { useState } from "react";
import Link from "next/link";
import { Wordmark, WordmarkInline } from "./Wordmark";

const NAV_LINKS = [
  { href: "#how-it-works", label: "How it works" },
  { href: "#product", label: "Product" },
  { href: "#self-directed", label: "Self-Directed" },
  { href: "#journal", label: "Journal" },
];

export function MarketingNav() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="sticky top-0 z-40 bg-plane/92 backdrop-blur-sm border-b border-gridline">
        <div className="max-w-[1400px] mx-auto flex items-center justify-between px-6 sm:px-10 py-4">
          <Link href="/" className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-mark.svg" alt="" className="w-7 h-auto" aria-hidden />
            <span className="hidden sm:block">
              <Wordmark />
            </span>
            <WordmarkInline className="sm:hidden text-[12.5px]" />
          </Link>

          <nav className="hidden md:flex items-center gap-9">
            {NAV_LINKS.map((l) => (
              <a key={l.href} href={l.href} className="font-heading font-medium text-sm text-ink/75 hover:text-brand-ink hover:opacity-100 transition">
                {l.label}
              </a>
            ))}
            <Link href="/login" className="font-heading font-medium text-sm text-ink/75 hover:text-brand-ink hover:opacity-100 transition">
              Sign In
            </Link>
            <Link
              href="/beta"
              className="font-heading font-semibold text-[14.5px] bg-ink text-white rounded px-6 py-3.5 hover:bg-black transition whitespace-nowrap"
            >
              Join the Beta
            </Link>
          </nav>

          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            className="md:hidden h-11 w-11 flex items-center justify-center"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
          >
            <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden>
              {open ? (
                <path d="M5 5 L19 19 M19 5 L5 19" stroke="var(--ink)" strokeWidth={1.7} strokeLinecap="round" />
              ) : (
                <path d="M4 7H20 M4 12H20 M4 17H20" stroke="var(--ink)" strokeWidth={1.7} strokeLinecap="round" />
              )}
            </svg>
          </button>
        </div>

        {open && (
          <div className="md:hidden bg-plane border-t border-gridline px-6 py-6 flex flex-col gap-5 font-heading font-semibold text-lg">
            {NAV_LINKS.map((l) => (
              <a key={l.href} href={l.href} onClick={() => setOpen(false)}>
                {l.label}
              </a>
            ))}
            <Link href="/login" onClick={() => setOpen(false)}>
              Sign In
            </Link>
            <Link
              href="/beta"
              onClick={() => setOpen(false)}
              className="text-center font-heading font-semibold text-base bg-ink text-white rounded px-6 py-3.5 mt-1"
            >
              Join the Beta
            </Link>
          </div>
        )}
      </div>

      {/* Sticky bottom CTA — mobile only, mirrors the approved mobile design */}
      <div className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-plane/97 backdrop-blur-sm border-t border-gridline px-5 py-3 flex gap-2.5">
        <Link
          href="/login"
          className="shrink-0 flex items-center justify-center font-heading font-semibold text-[13.5px] border border-ink rounded-[5px] px-[18px] py-3 min-h-11"
        >
          Sign In
        </Link>
        <Link
          href="/beta"
          className="flex-1 flex items-center justify-center font-heading font-semibold text-sm bg-ink text-white rounded-[5px] px-4 py-3 min-h-11"
        >
          Join the Beta
        </Link>
      </div>
    </>
  );
}

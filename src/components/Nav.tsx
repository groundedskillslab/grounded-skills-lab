"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { ROLE_LABELS } from "@/lib/roles";

const NAV_ITEMS = [
  { href: "/home", label: "Home" },
  { href: "/people", label: "People" },
  { href: "/sessions", label: "Sessions" },
  { href: "/practice", label: "Practice" },
  { href: "/analytics", label: "Analytics" },
  { href: "/library", label: "Library" },
];

export function Nav({ user }: { user: { name?: string | null; email?: string | null; role: string; title?: string } }) {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 bg-surface/95 backdrop-blur border-b border-gridline">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 flex items-center h-16 gap-6">
        <Link href="/home" className="flex items-center gap-2 shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-mark.png" alt="" className="h-7 w-7" aria-hidden />
          <span className="font-heading font-medium uppercase tracking-wide text-sm">Grounded Skills Lab</span>
        </Link>

        <nav className="hidden md:flex items-center gap-1 flex-1">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                  active ? "bg-ink text-white" : "text-ink-secondary hover:bg-plane"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
          {user.role === "org_admin" && (
            <Link
              href="/organization"
              className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                pathname.startsWith("/organization") ? "bg-ink text-white" : "text-ink-secondary hover:bg-plane"
              }`}
            >
              Organization
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-3 ml-auto">
          <div className="text-right hidden sm:block">
            <div className="text-sm font-medium leading-tight">{user.name}</div>
            <div className="text-xs text-ink-muted leading-tight">{user.title || ROLE_LABELS[user.role as keyof typeof ROLE_LABELS]}</div>
          </div>
          <div className="h-9 w-9 rounded-full bg-brand-soft text-brand-ink flex items-center justify-center text-sm font-medium">
            {(user.name || "?").split(" ").map((s) => s[0]).slice(0, 2).join("")}
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="text-xs text-ink-muted hover:text-ink px-2 py-1"
          >
            Sign out
          </button>
        </div>
      </div>
      <nav className="md:hidden flex items-center gap-1 px-4 pb-2 overflow-x-auto">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap ${
              pathname.startsWith(item.href) ? "bg-ink text-white" : "text-ink-secondary bg-plane"
            }`}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}

import localFont from "next/font/local";

// Grounded Skills Lab brand typography (licensed files provided by Greg,
// 2026-08-17 — see the project's brand-identity doc). Self-hosted via
// next/font/local: no network dependency at build/runtime, automatic
// font-display + preload optimization, zero layout shift.
//
// Primary (headlines / wordmark / logo): Sofia Pro — 8 weights x 2 styles.
// Secondary (body text / taglines): Bookmania — only Regular + Semibold
// Italic were provided, which is enough for body copy plus the italic
// serif accent already used for "Practice Journal" on the physical journal.

export const sofiaPro = localFont({
  src: [
    { path: "../fonts/sofia-pro/sofia-pro-100.otf", weight: "100", style: "normal" },
    { path: "../fonts/sofia-pro/sofia-pro-100-italic.otf", weight: "100", style: "italic" },
    { path: "../fonts/sofia-pro/sofia-pro-200.otf", weight: "200", style: "normal" },
    { path: "../fonts/sofia-pro/sofia-pro-200-italic.otf", weight: "200", style: "italic" },
    { path: "../fonts/sofia-pro/sofia-pro-300.otf", weight: "300", style: "normal" },
    { path: "../fonts/sofia-pro/sofia-pro-300-italic.otf", weight: "300", style: "italic" },
    { path: "../fonts/sofia-pro/sofia-pro-400.otf", weight: "400", style: "normal" },
    { path: "../fonts/sofia-pro/sofia-pro-400-italic.otf", weight: "400", style: "italic" },
    { path: "../fonts/sofia-pro/sofia-pro-500.otf", weight: "500", style: "normal" },
    { path: "../fonts/sofia-pro/sofia-pro-500-italic.otf", weight: "500", style: "italic" },
    { path: "../fonts/sofia-pro/sofia-pro-600.otf", weight: "600", style: "normal" },
    { path: "../fonts/sofia-pro/sofia-pro-600-italic.otf", weight: "600", style: "italic" },
    { path: "../fonts/sofia-pro/sofia-pro-700.otf", weight: "700", style: "normal" },
    { path: "../fonts/sofia-pro/sofia-pro-700-italic.otf", weight: "700", style: "italic" },
    { path: "../fonts/sofia-pro/sofia-pro-900.otf", weight: "900", style: "normal" },
    { path: "../fonts/sofia-pro/sofia-pro-900-italic.otf", weight: "900", style: "italic" },
  ],
  variable: "--font-sofia-pro",
  display: "swap",
});

export const bookmania = localFont({
  src: [
    { path: "../fonts/bookmania/bookmania-400.ttf", weight: "400", style: "normal" },
    { path: "../fonts/bookmania/bookmania-600-italic.ttf", weight: "600", style: "italic" },
  ],
  variable: "--font-bookmania",
  display: "swap",
});

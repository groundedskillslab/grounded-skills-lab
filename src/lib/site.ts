// Resolves the app's own public URL for building absolute links (e.g. the
// redirect target inside an invite email). Prefers Vercel's automatically
// populated system env vars — no manual setup needed in Vercel — and falls
// back to localhost for local dev. NEXT_PUBLIC_SITE_URL is an optional
// manual override if a custom domain is added later and the Vercel vars
// don't reflect it.
export function getSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return explicit.replace(/\/$/, "");

  const vercelProdUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (vercelProdUrl) return `https://${vercelProdUrl}`;

  const vercelUrl = process.env.VERCEL_URL;
  if (vercelUrl) return `https://${vercelUrl}`;

  return "http://localhost:3000";
}

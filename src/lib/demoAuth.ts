// Single source of truth for the shared demo-account password, used by
// the login page, src/db/seed.ts, and scripts/link-supabase-auth-users.ts.
// Client-safe (no server-only imports) so the login page can import it too.
export const DEMO_PASSWORD = "grounded123";

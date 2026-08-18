import { createBrowserClient } from "@supabase/ssr";

// Browser-side Supabase client. Used from Client Components (e.g. the
// login form) once Supabase Auth replaces NextAuth. Reads the public
// URL + publishable (anon) key — both safe to expose to the browser,
// access is governed by RLS policies on the database side, not by
// keeping these values secret.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

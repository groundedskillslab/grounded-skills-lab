import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Server-only admin client — uses the service role key, bypasses RLS, and
// can call the Supabase Auth admin API (createUser, inviteUserByEmail,
// listUsers, etc.). Never import this from a Client Component or any code
// path that could run in the browser; NEXT_PUBLIC_SUPABASE_ANON_KEY is the
// browser-safe key (see client.ts). Mirrors the pattern already used in
// scripts/link-supabase-auth-users.ts.
//
// Requires SUPABASE_SERVICE_ROLE_KEY to be set (Vercel: Project Settings ->
// Environment Variables, marked Sensitive; local: .env.local, get the key
// from Supabase Project Settings -> API -> service_role secret).
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set to use the Supabase admin client."
    );
  }

  return createSupabaseClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

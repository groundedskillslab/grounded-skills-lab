import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Server-side Supabase client for Server Components, Server Actions, and
// Route Handlers. Reads/writes the auth session via Next.js's cookie
// store so Supabase Auth's session stays in sync across requests.
//
// Not wired into the app yet — this is scaffolding for the Supabase Auth
// migration described in the architecture doc's pre-deployment checklist.
// NextAuth (see auth.ts / src/lib/session.ts) is still the live auth path
// until the database migration + user migration into Supabase Auth happens.
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // setAll called from a Server Component — safe to ignore if
            // there's middleware refreshing the session on every request.
          }
        },
      },
    }
  );
}

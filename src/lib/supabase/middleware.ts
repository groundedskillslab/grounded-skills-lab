import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Middleware-specific Supabase client. Different cookie API than
// src/lib/supabase/server.ts (that one uses next/headers' cookies(), which
// only works in Server Components/Actions/Route Handlers) — middleware
// reads/writes cookies on the NextRequest/NextResponse pair directly.
//
// Returns both the Supabase client and the NextResponse it's writing
// refreshed session cookies onto, so middleware.ts can keep using that
// same response for its own redirect logic further down the chain.
export function createMiddlewareClient(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    }
  );

  return { supabase, getResponse: () => response };
}

import { NextResponse, type NextRequest } from "next/server";
import { createMiddlewareClient } from "@/lib/supabase/middleware";

const PUBLIC_PATHS = ["/login", "/signup", "/accept-invite", "/auth", "/forgot-password", "/reset-password"];

// Site-wide demo gate (added 2026-08-17, see architecture doc's
// "Decided 2026-08-17" pre-deployment note). Every demo account shares
// the same password, so on a public URL anyone with the link could log
// in as any persona. SITE_ACCESS_PASSWORD adds one more shared password
// in front of the whole app (including the login page itself) via HTTP
// Basic Auth. Unset locally on purpose: leave it out of .env.local for
// dev, and only set it in Vercel's production env vars when going live.
function siteAccessOk(req: Request): boolean {
  const sitePassword = process.env.SITE_ACCESS_PASSWORD;
  if (!sitePassword) return true; // gate disabled — local/dev default

  const header = req.headers.get("authorization");
  if (!header?.startsWith("Basic ")) return false;

  let decoded: string;
  try {
    decoded = atob(header.slice(6));
  } catch {
    return false;
  }
  const separatorIndex = decoded.indexOf(":");
  const password = separatorIndex === -1 ? "" : decoded.slice(separatorIndex + 1);
  return password === sitePassword;
}

export async function middleware(request: NextRequest) {
  if (!siteAccessOk(request)) {
    return new NextResponse("Authentication required", {
      status: 401,
      headers: { "WWW-Authenticate": 'Basic realm="Grounded Skills Lab"' },
    });
  }

  const { pathname } = request.nextUrl;
  const isPublic =
    PUBLIC_PATHS.some((p) => pathname.startsWith(p)) ||
    pathname.startsWith("/_next") ||
    pathname === "/favicon.ico";

  // Supabase Auth (2026-08-18, replaced NextAuth) — this call both refreshes
  // the session cookies (required so server components see a valid session
  // on the next request) and tells us whether anyone's signed in.
  const { supabase, getResponse } = createMiddlewareClient(request);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (isPublic) return getResponse();

  if (!user) {
    const loginUrl = new URL("/login", request.nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return getResponse();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|.*\\.png$|.*\\.svg$).*)"],
};

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

// Internal admin tools (currently just /admin/beta-signups) show data that
// isn't scoped to any organization, so none of the product's own roles
// (org_admin | practitioner | implementer | caregiver | learner — see
// rbac.ts) is the right gate, and there's no "platform superadmin" concept
// to bolt on. Rather than stretch the org-scoped user model to cover this,
// /admin gets its own HTTP Basic Auth gate — same mechanism as
// siteAccessOk above, but its own password, and the OPPOSITE fail-safe
// direction: unset ADMIN_PASSWORD means the route is BLOCKED, not open,
// since this serves real user PII (beta signup names/emails), not a demo
// toggle. Checked first and returns early — admin routes intentionally
// don't touch Supabase auth/session at all.
function adminAccessOk(req: Request): boolean {
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) return false; // fail closed — no password configured means no access

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
  return password === adminPassword;
}

export async function middleware(request: NextRequest) {
  if (!siteAccessOk(request)) {
    return new NextResponse("Authentication required", {
      status: 401,
      headers: { "WWW-Authenticate": 'Basic realm="Grounded Skills Lab"' },
    });
  }

  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/admin")) {
    if (!adminAccessOk(request)) {
      return new NextResponse("Authentication required", {
        status: 401,
        headers: { "WWW-Authenticate": 'Basic realm="Grounded Skills Lab Admin"' },
      });
    }
    return NextResponse.next();
  }

  // Next.js's own static assets (JS/CSS/font/image chunks under _next/static
  // — including the self-hosted Sofia Pro/Bookmania font files, see
  // fonts.ts — plus the image-optimization endpoint and bare image/font
  // files) never carry session-relevant routing of their own. They used to
  // be excluded entirely via `matcher` below, which was faster but had a
  // real security gap: a matcher exclusion skips this whole function,
  // siteAccessOk() included, so while SITE_ACCESS_PASSWORD is set these
  // paths were reachable with NO password at all — found 2026-10-27 when a
  // font-licensing concern made that a real problem, not just a theoretical
  // one. `matcher` now covers everything (see below) so siteAccessOk() above
  // always runs first; this early return just skips the (unrelated)
  // Supabase session lookup for pure asset requests once that gate is
  // cleared, so this fix doesn't add a Supabase call to every JS/CSS/font
  // request during normal (gate-disabled) operation.
  const isNextInternalAsset =
    pathname.startsWith("/_next/static") ||
    pathname.startsWith("/_next/image") ||
    pathname === "/favicon.ico" ||
    /\.(png|svg|jpe?g|gif|webp|ico|ttf|otf|woff2?)$/.test(pathname);
  if (isNextInternalAsset) return NextResponse.next();

  const isPublic =
    pathname === "/" || // marketing homepage — exact match only, NOT startsWith("/")
    pathname.startsWith("/beta") || // public beta-interest form
    pathname.startsWith("/privacy") || // public privacy policy
    pathname.startsWith("/terms") || // public terms of service
    PUBLIC_PATHS.some((p) => pathname.startsWith(p)) ||
    pathname.startsWith("/_next"); // non-static _next paths (e.g. /_next/data) — deliberately NOT bypassed above; see Next's own proxy docs on why /_next/data should still pass through auth logic

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
  // No exclusions. Per Next's own proxy/middleware docs, a matcher
  // exclusion skips this entire function for matching paths — that's what
  // let static assets (including the licensed font files) bypass
  // siteAccessOk() entirely. Every request must clear that gate now; the
  // isNextInternalAsset check above keeps the Supabase session lookup from
  // running on every asset request once it does.
  matcher: ["/(.*)"],
};

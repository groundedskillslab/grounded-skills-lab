import { type EmailOtpType } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Where every Supabase Auth email link (invite, magic link, password
// recovery, signup confirmation, email change) actually points, per
// Supabase's current recommended pattern. Their emails carry a
// `token_hash` + `type` pair rather than a ready-made session — this
// route is the one place that exchanges that pair for a real session
// (via verifyOtp, server-side, so it can set httpOnly cookies through
// our SSR client) before sending the person on to wherever they land
// next (e.g. /accept-invite to set a password). Without this route,
// a client page hoping a session "just appears" in the URL never
// gets one, which is what produced the "invite link isn't valid"
// bug on /accept-invite before this was added.
//
// Public path — see middleware.ts. Must stay reachable with no
// session, since establishing one is exactly what this route does.
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const rawNext = searchParams.get("next");
  const next = rawNext && rawNext.startsWith("/") ? rawNext : "/accept-invite";

  if (token_hash && type) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({ type, token_hash });
    if (!error) {
      return NextResponse.redirect(new URL(next, request.url));
    }
  }

  // Missing/expired/already-used token — send them to the same
  // destination anyway; without a session it shows its own
  // "link isn't valid" message rather than a dead-end error page.
  return NextResponse.redirect(new URL(next, request.url));
}

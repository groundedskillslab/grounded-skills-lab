"use server";

import { db } from "@/db";
import { betaSignups } from "@/db/schema";

export type BetaFormState = { error: string | null; success: boolean };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Public, unauthenticated submission from the marketing site's "Request
// Beta Access" form (src/app/beta/page.tsx) — no account, no org, just
// interest capture. Returns { error, success } via useActionState instead
// of throwing, same lesson as inviteTeamMember/signUpIndependent: an
// uncaught throw from a Server Action renders as an opaque Next.js error
// page, which is a bad first impression on a public marketing form.
export async function submitBetaSignup(_prevState: BetaFormState, formData: FormData): Promise<BetaFormState> {
  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const skillFocus = String(formData.get("skillFocus") || "").trim();
  const describesYou = String(formData.get("describesYou") || "").trim();
  const interestedIn = String(formData.get("interestedIn") || "").trim();
  const note = String(formData.get("note") || "").trim();

  if (!name) return { error: "Name is required.", success: false };
  if (!email || !EMAIL_RE.test(email)) return { error: "Enter a valid email address.", success: false };
  if (!describesYou) return { error: "Let us know which best describes you.", success: false };
  if (!interestedIn) return { error: "Let us know what you're interested in.", success: false };

  await db.insert(betaSignups).values({
    name,
    email,
    skillFocus: skillFocus || null,
    describesYou,
    interestedIn,
    note: note || null,
  });

  return { error: null, success: true };
}

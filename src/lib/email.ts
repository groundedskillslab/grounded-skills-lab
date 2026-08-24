import { Resend } from "resend";

// Transactional email — currently just the beta-signup notification below.
// Deliberately NOT wired through the hello@ Gmail forwarding setup: that
// trick authenticates as a real person's Gmail account and is meant for
// Greg composing mail by hand, not for the server to send automated mail
// on its own. Resend sends from its own infrastructure using an API key,
// so this never touches or stores a personal Gmail credential.
let client: Resend | null = null;

function getClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null; // not configured yet — callers no-op rather than throw
  if (!client) client = new Resend(apiKey);
  return client;
}

export type BetaSignupNotification = {
  name: string;
  email: string;
  describesYou: string;
  interestedIn: string;
  skillFocus: string | null;
  note: string | null;
};

/**
 * Best-effort notification email to the team when someone requests beta
 * access. Never throws — a failure here (missing API key, Resend outage,
 * bad address) must never take down the signup flow itself, since the row
 * is already safely in beta_signups by the time this runs. Call this from
 * inside `after()` in the server action so it can't add latency to the
 * response the person submitting the form is waiting on.
 */
export async function notifyBetaSignup(signup: BetaSignupNotification): Promise<void> {
  const resend = getClient();
  if (!resend) return; // RESEND_API_KEY unset — silently skip, see .env.example

  const to = process.env.BETA_SIGNUP_NOTIFY_EMAIL || "hello@groundedskillslab.com";
  const from = process.env.BETA_SIGNUP_FROM_EMAIL || "Grounded Skills Lab <onboarding@resend.dev>";

  const lines = [
    `${signup.name} <${signup.email}> just requested beta access.`,
    "",
    `Describes them: ${signup.describesYou}`,
    `Interested in: ${signup.interestedIn}`,
  ];
  if (signup.skillFocus) lines.push(`Skill focus: ${signup.skillFocus}`);
  if (signup.note) lines.push(`Note: ${signup.note}`);
  lines.push("", "Full list: https://groundedskillslab.com/admin/beta-signups");

  try {
    await resend.emails.send({
      from,
      to,
      replyTo: signup.email,
      subject: `New beta signup: ${signup.name}`,
      text: lines.join("\n"),
    });
  } catch (err) {
    // Log and swallow — see the doc comment above for why this must not throw.
    console.error("notifyBetaSignup: failed to send", err);
  }
}

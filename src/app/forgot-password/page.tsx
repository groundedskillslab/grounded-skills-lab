"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

// Entry point for "I forgot my password" — reachable from /login. Sends a
// Supabase recovery email whose link lands on /reset-password (see that
// page, and getSiteUrl-equivalent handling below: this is a client
// component, so it reads window.location.origin directly rather than
// importing getSiteUrl(), which resolves Vercel's server-only env vars and
// would silently fall back to localhost if evaluated in the browser).
//
// Always shows the same "check your email" message whether or not the
// address has an account — Supabase's resetPasswordForEmail is designed
// not to reveal that either way, and mirroring that here avoids using
// this form to enumerate real user emails. Public path — see middleware.ts.
export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);

    // A genuine send failure (network, rate limit) still surfaces — only
    // "this email doesn't exist" is deliberately masked, and Supabase
    // itself doesn't report that as an error here.
    if (resetError) {
      setError(resetError.message);
      return;
    }
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="max-w-sm text-center space-y-2">
          <h1 className="text-xl font-medium">Check your email</h1>
          <p className="text-sm text-ink-secondary">
            If an account exists for <span className="font-medium">{email}</span>, we&apos;ve sent a link to reset
            the password. It expires after a while, so use it soon.
          </p>
          <p className="text-sm mt-4">
            <Link href="/login" className="text-brand underline">
              Back to sign in
            </Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="max-w-sm w-full space-y-6">
        <div>
          <h1 className="text-2xl font-medium mb-1">Reset your password</h1>
          <p className="text-sm text-ink-secondary">
            Enter the email on your account and we&apos;ll send you a link to set a new password.
          </p>
        </div>
        <form className="space-y-3" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-gridline px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
              placeholder="you@example.com"
            />
          </div>
          {error && <p className="text-sm text-status-critical">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-ink text-white py-2 text-sm font-medium hover:opacity-90 transition disabled:opacity-50"
          >
            {loading ? "Sending..." : "Send reset link"}
          </button>
        </form>

        <p className="text-sm">
          <Link href="/login" className="text-brand underline">
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

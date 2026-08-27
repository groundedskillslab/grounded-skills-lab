"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

// Public, self-service entry point for a locked-out user. Submits to
// Supabase's resetPasswordForEmail with redirectTo pointing at
// /reset-password, which resolves the emailed link's hash-fragment tokens
// the same way /accept-invite does (see that page's comment — Supabase
// delivers these as an implicit-flow URL hash, not a query param, and the
// browser client doesn't reliably auto-consume it here) and lets the user
// set a new password. Public path — see middleware.ts.
export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ForgotPasswordForm />
    </Suspense>
  );
}

function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);

    // Show the same success message whether or not the email exists, so this
    // page can't be used to check which emails have accounts.
    if (resetError) {
      setError("Something went wrong sending the reset link. Please try again.");
      return;
    }
    setSent(true);
  }

  if (sent) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="max-w-sm text-center space-y-3">
          <h1 className="text-xl font-medium">Check your email</h1>
          <p className="text-sm text-ink-secondary">
            If an account exists for <span className="font-medium">{email}</span>, we&apos;ve sent a link to reset the password. It&apos;ll expire after a while, so use it soon.
          </p>
          <Link href="/login" className="text-sm text-brand underline inline-block">
            Back to sign in
          </Link>
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
          {error && <p className="text-sm text-status-serious">{error}</p>}
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

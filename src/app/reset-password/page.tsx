"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

// Landed on from the link in a password-recovery email (see
// /forgot-password, which calls resetPasswordForEmail with redirectTo
// pointing here), or from /auth/confirm's redirect for the token_hash-style
// links Supabase uses for some flows (see that route's DEFAULT_NEXT_BY_TYPE).
// Session resolution mirrors /accept-invite exactly: this project's
// recovery links deliver the session as an implicit-style URL hash
// fragment (`#access_token=...&refresh_token=...&type=recovery`), which the
// browser Supabase client does not reliably auto-consume here, so this page
// parses it explicitly via setSession() rather than trusting
// detectSessionInUrl. Public path — see middleware.ts.
export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordForm />
    </Suspense>
  );
}

function ResetPasswordForm() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [email, setEmail] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    async function resolveSession() {
      const hash = window.location.hash.startsWith("#") ? window.location.hash.slice(1) : window.location.hash;
      const hashParams = new URLSearchParams(hash);
      const access_token = hashParams.get("access_token");
      const refresh_token = hashParams.get("refresh_token");

      if (access_token && refresh_token) {
        const { data, error: setSessionError } = await supabase.auth.setSession({ access_token, refresh_token });
        // Single-use tokens — clear them from the visible URL either way.
        window.history.replaceState(null, "", window.location.pathname);
        if (!setSessionError && data.user) {
          setEmail(data.user.email ?? null);
          setReady(true);
          return;
        }
      }

      // No hash tokens (or setSession failed) — fall back to whatever
      // session already exists, e.g. arrived via /auth/confirm having
      // already established one server-side.
      const { data } = await supabase.auth.getUser();
      if (data.user) setEmail(data.user.email ?? null);
      setReady(true);
    }

    resolveSession();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }
    setDone(true);
  }

  if (!ready) {
    return <div className="min-h-screen flex items-center justify-center text-sm text-ink-secondary">Loading...</div>;
  }

  if (!email) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="max-w-sm text-center space-y-2">
          <h1 className="text-xl font-medium">This reset link isn&apos;t valid</h1>
          <p className="text-sm text-ink-secondary">
            It may have already been used or expired. Request a new one from the{" "}
            <a href="/forgot-password" className="underline">
              forgot password
            </a>{" "}
            page.
          </p>
        </div>
      </div>
    );
  }

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="max-w-sm text-center space-y-4">
          <h1 className="text-xl font-medium">Password updated</h1>
          <p className="text-sm text-ink-secondary">You&apos;re all set — continue into your account.</p>
          <button
            onClick={() => {
              router.push("/home");
              router.refresh();
            }}
            className="w-full rounded-lg bg-ink text-white py-2 text-sm font-medium hover:opacity-90 transition"
          >
            Continue
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="max-w-sm w-full space-y-6">
        <div>
          <h1 className="text-2xl font-medium mb-1">Set a new password</h1>
          <p className="text-sm text-ink-secondary">
            For <span className="font-medium">{email}</span>.
          </p>
        </div>
        <form className="space-y-3" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium mb-1">New password</label>
            <input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-gridline px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
              placeholder="At least 8 characters"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Confirm password</label>
            <input
              type="password"
              required
              minLength={8}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="w-full rounded-lg border border-gridline px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
            />
          </div>
          {error && <p className="text-sm text-status-critical">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-ink text-white py-2 text-sm font-medium hover:opacity-90 transition disabled:opacity-50"
          >
            {loading ? "Updating..." : "Update password"}
          </button>
        </form>
      </div>
    </div>
  );
}

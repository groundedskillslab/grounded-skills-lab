"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

// Landed on from the link in a password-reset email (see
// /forgot-password, which calls resetPasswordForEmail with redirectTo
// pointing here). Session resolution mirrors /accept-invite exactly:
// Supabase delivers recovery links the same way it delivers invite links
// — as an implicit-flow URL hash fragment
// (`#access_token=...&refresh_token=...&type=recovery`) rather than a
// query param — and the browser Supabase client (@supabase/ssr) does not
// reliably auto-detect/consume that fragment on its own here, so this
// page parses it explicitly and calls setSession() itself. Public path —
// see middleware.ts.
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

  useEffect(() => {
    const supabase = createClient();

    async function resolveSession() {
      const hash = window.location.hash.startsWith("#") ? window.location.hash.slice(1) : window.location.hash;
      const hashParams = new URLSearchParams(hash);
      const access_token = hashParams.get("access_token");
      const refresh_token = hashParams.get("refresh_token");

      if (access_token && refresh_token) {
        const { data, error: setSessionError } = await supabase.auth.setSession({ access_token, refresh_token });
        // Clear the tokens out of the visible URL/history either way —
        // they're single-use but no reason to leave them sitting there.
        window.history.replaceState(null, "", window.location.pathname);
        if (!setSessionError && data.user) {
          setEmail(data.user.email ?? null);
          setReady(true);
          return;
        }
      }

      // No hash tokens (or setSession failed) — fall back to whatever
      // session already exists, same defensive fallback /accept-invite uses.
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

    router.push("/home");
    router.refresh();
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
            <a href="/forgot-password" className="text-brand underline">
              password reset page
            </a>
            .
          </p>
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
          {error && <p className="text-sm text-status-serious">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-ink text-white py-2 text-sm font-medium hover:opacity-90 disabled:opacity-50"
          >
            {loading ? "Setting password..." : "Set password & continue"}
          </button>
        </form>
      </div>
    </div>
  );
}

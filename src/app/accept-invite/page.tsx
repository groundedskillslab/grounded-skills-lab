"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

// Landed on from the link in an invite email (see src/actions/team.ts,
// which calls admin.auth.admin.inviteUserByEmail with redirectTo pointing
// here), or from /auth/confirm's redirect for the token_hash-style links
// Supabase uses for some flows (see that route). Confirmed 2026-08-18: this
// project's invite links deliver the session as an implicit-style URL hash
// fragment (`#access_token=...&refresh_token=...&type=invite`) rather than
// a query param, and the browser Supabase client (@supabase/ssr) does NOT
// reliably auto-detect/consume that fragment on its own here — so this page
// parses it explicitly and calls setSession() itself instead of trusting
// detectSessionInUrl. Public path — see middleware.ts.
export default function AcceptInvitePage() {
  return (
    <Suspense fallback={null}>
      <AcceptInviteForm />
    </Suspense>
  );
}

function AcceptInviteForm() {
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
      // Hash fragments never reach the server, so only client JS can read
      // this — parse it directly rather than relying on the client
      // library's automatic detection.
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
          <h1 className="text-xl font-medium">This invite link isn&apos;t valid</h1>
          <p className="text-sm text-ink-secondary">
            It may have already been used or expired. Ask whoever invited you to send a new one, then use the link from the newest email.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="max-w-sm w-full space-y-6">
        <div>
          <h1 className="text-2xl font-medium mb-1">Welcome to Grounded Skills Lab</h1>
          <p className="text-sm text-ink-secondary">
            Set a password for <span className="font-medium">{email}</span> to finish creating your account.
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

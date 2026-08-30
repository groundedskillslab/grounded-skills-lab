"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const callbackUrl = params.get("callbackUrl") || "/home";
  const justSignedUp = params.get("justSignedUp") === "1";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function doSignIn(e: string, p: string) {
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({ email: e, password: p });
    setLoading(false);
    if (signInError) {
      setError("That email and password combination wasn't found.");
      return;
    }
    router.push(callbackUrl);
    router.refresh();
  }

  return (
    <div className="min-h-screen w-full grid lg:grid-cols-2">
      <div className="hidden lg:flex flex-col justify-between p-12 bg-ink text-white">
        <div className="flex items-center gap-2.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-mark.png" alt="" className="h-6 w-6" aria-hidden />
          <div className="font-heading text-sm tracking-widest uppercase text-white/60">Grounded Skills Lab</div>
        </div>
        <div className="max-w-md">
          <h1 className="text-3xl font-medium leading-tight mb-4">
            Behavior science for building better skills.
          </h1>
          <p className="text-white/70 leading-relaxed">
            Turn a broad goal into an observable, teachable, measurable skill —
            then prove whether both the learner and the teaching system are improving.
          </p>
        </div>
        <div className="text-white/40 text-sm">Define → Teach → Practice → Measure → Analyze → Adjust → Generalize → Maintain</div>
      </div>

      <div className="flex flex-col justify-center px-6 sm:px-12 py-12">
        <div className="max-w-sm w-full mx-auto">
          <h2 className="text-2xl font-medium mb-1">Sign in</h2>
          <p className="text-ink-secondary mb-2 text-sm">Welcome back to Grounded Skills Lab.</p>
          {justSignedUp && (
            <p className="text-sm text-status-good mb-6">
              Account created — sign in with the password you just set.
            </p>
          )}

          <form
            className="space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              doSignIn(email, password);
            }}
          >
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
            <div>
              <label className="block text-sm font-medium mb-1">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-gridline px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                placeholder="••••••••"
              />
            </div>
            {error && <p className="text-sm text-status-critical">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-ink text-white py-2 text-sm font-medium hover:opacity-90 transition disabled:opacity-50"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <p className="text-sm mt-6">
            Working on your own, with no coach or organization?{" "}
            <Link href="/signup" className="text-brand underline">
              Create your own account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

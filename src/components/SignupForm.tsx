"use client";

import { useActionState } from "react";
import { WORKSPACE_TYPES } from "@/lib/labels";
import type { SignupFormState } from "@/actions/signup";

export function SignupForm({
  action,
}: {
  action: (prevState: SignupFormState, formData: FormData) => Promise<SignupFormState>;
}) {
  const [state, formAction, pending] = useActionState<SignupFormState, FormData>(action, { error: null });

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Name</label>
        <input name="name" required placeholder="Full name" className="w-full rounded-lg border border-gridline px-3 py-2 text-sm" />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Email</label>
        <input type="email" name="email" required placeholder="you@example.com" className="w-full rounded-lg border border-gridline px-3 py-2 text-sm" />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">What are you working on?</label>
        <select name="workspaceType" defaultValue="general" className="w-full rounded-lg border border-gridline px-3 py-2 text-sm">
          {WORKSPACE_TYPES.map((w) => (
            <option key={w.value} value={w.value}>{w.label} — {w.blurb}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Password</label>
        <input type="password" name="password" required minLength={8} placeholder="At least 8 characters" className="w-full rounded-lg border border-gridline px-3 py-2 text-sm" />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Confirm password</label>
        <input type="password" name="confirmPassword" required minLength={8} className="w-full rounded-lg border border-gridline px-3 py-2 text-sm" />
      </div>

      {state.error && <p className="text-sm text-status-serious">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-ink text-white py-2 text-sm font-medium hover:opacity-90 disabled:opacity-50"
      >
        {pending ? "Creating account..." : "Create my account"}
      </button>

      <p className="text-xs text-ink-muted text-center">
        By creating an account, you agree to our{" "}
        <a href="/terms" target="_blank" rel="noopener noreferrer" className="underline">
          Terms of Service
        </a>{" "}
        and{" "}
        <a href="/privacy" target="_blank" rel="noopener noreferrer" className="underline">
          Privacy Policy
        </a>
        .
      </p>
    </form>
  );
}

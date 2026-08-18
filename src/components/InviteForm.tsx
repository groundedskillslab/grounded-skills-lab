"use client";

import { useActionState, useState } from "react";
import { ROLE_LABELS, type Role } from "@/lib/roles";
import { WORKSPACE_TYPES } from "@/lib/labels";
import type { InviteFormState } from "@/actions/team";

const CASE_ROLES = new Set<Role>(["implementer", "caregiver", "learner"]);

type ParticipantOption = { id: string; displayName: string; participantCode: string };

export function InviteForm({
  action,
  participants,
}: {
  action: (prevState: InviteFormState, formData: FormData) => Promise<InviteFormState>;
  participants: ParticipantOption[];
}) {
  const [role, setRole] = useState<Role>("learner");
  const [participantMode, setParticipantMode] = useState<"none" | "existing" | "new">(
    participants.length > 0 ? "existing" : "new"
  );
  // Server action returns { error } instead of throwing for expected
  // failures (duplicate email, bad input) — see src/actions/team.ts — so
  // they render inline here instead of crashing to a generic error page.
  const [state, formAction, pending] = useActionState<InviteFormState, FormData>(action, { error: null });

  const showParticipantSection = CASE_ROLES.has(role);

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Name</label>
        <input name="name" required placeholder="Full name" className="w-full rounded-lg border border-gridline px-3 py-2 text-sm" />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Email</label>
        <input type="email" name="email" required placeholder="client@example.com" className="w-full rounded-lg border border-gridline px-3 py-2 text-sm" />
        <p className="text-xs text-ink-muted mt-1">They&apos;ll get an email with a link to set their own password.</p>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Role</label>
        <select
          name="role"
          value={role}
          onChange={(e) => setRole(e.target.value as Role)}
          className="w-full rounded-lg border border-gridline px-3 py-2 text-sm"
        >
          {Object.entries(ROLE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </div>

      {showParticipantSection && (
        <div className="rounded-lg border border-gridline p-3 space-y-3 bg-plane/40">
          <div className="text-xs font-medium uppercase tracking-wide text-ink-muted">
            Link to a {role === "learner" ? "participant record for this person" : "participant"}
          </div>

          <div className="flex flex-wrap gap-4 text-sm">
            {participants.length > 0 && (
              <label className="flex items-center gap-1.5">
                <input
                  type="radio"
                  name="participantMode"
                  value="existing"
                  checked={participantMode === "existing"}
                  onChange={() => setParticipantMode("existing")}
                />
                Existing participant
              </label>
            )}
            <label className="flex items-center gap-1.5">
              <input
                type="radio"
                name="participantMode"
                value="new"
                checked={participantMode === "new"}
                onChange={() => setParticipantMode("new")}
              />
              Create a new one
            </label>
            <label className="flex items-center gap-1.5">
              <input
                type="radio"
                name="participantMode"
                value="none"
                checked={participantMode === "none"}
                onChange={() => setParticipantMode("none")}
              />
              Skip for now
            </label>
          </div>

          {participantMode === "existing" && (
            <select name="existingParticipantId" className="w-full rounded-lg border border-gridline px-3 py-2 text-sm">
              {participants.map((p) => (
                <option key={p.id} value={p.id}>{p.displayName} ({p.participantCode})</option>
              ))}
            </select>
          )}

          {participantMode === "new" && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium mb-1">Display name</label>
                <input name="newParticipantName" placeholder="Defaults to the person's name above" className="w-full rounded-lg border border-gridline px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Participant ID</label>
                <input name="newParticipantCode" placeholder="e.g. CL-1050" className="w-full rounded-lg border border-gridline px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Workspace</label>
                <select name="workspaceType" defaultValue="clinical" className="w-full rounded-lg border border-gridline px-3 py-2 text-sm">
                  {WORKSPACE_TYPES.map((w) => (
                    <option key={w.value} value={w.value}>{w.label} — {w.blurb}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {role === "learner" && participantMode !== "none" && (
            <label className="flex items-center gap-1.5 text-sm">
              <input type="checkbox" name="selfDirected" />
              Self-directed — this person manages their own training (no separate coach on the platform)
            </label>
          )}
        </div>
      )}

      {state.error && <p className="text-sm text-status-serious">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-ink text-white py-2 text-sm font-medium hover:opacity-90 disabled:opacity-50"
      >
        {pending ? "Sending..." : "Send Invite"}
      </button>
    </form>
  );
}

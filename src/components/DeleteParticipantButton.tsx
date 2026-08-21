"use client";

// A plain <form action={...}> has no built-in confirmation step, and this
// action is permanent — so this wraps it in one native browser confirm()
// before letting the submit through. Deliberately minimal (no modal
// component, no pending-state UI) since this is an infrequent admin action,
// not something that needs a polished multi-step flow.
export function DeleteParticipantButton({
  participantId,
  participantName,
  action,
}: {
  participantId: string;
  participantName: string;
  action: (formData: FormData) => Promise<void>;
}) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        const confirmed = window.confirm(
          `Permanently delete ${participantName}? This removes all of their programs, sessions, and practice data. This can't be undone.`
        );
        if (!confirmed) e.preventDefault();
      }}
    >
      <input type="hidden" name="participantId" value={participantId} />
      <button type="submit" className="text-xs text-status-serious underline hover:opacity-80">
        Delete Participant
      </button>
    </form>
  );
}

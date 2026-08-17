import { requireUser } from "@/lib/session";
import { isFullAccessRole } from "@/lib/rbac";
import { WORKSPACE_TYPES } from "@/lib/labels";
import { Card, SectionHeader } from "@/components/ui";
import { createParticipant } from "@/actions/participants";
import { redirect } from "next/navigation";

export default async function NewParticipantPage() {
  const user = await requireUser();
  if (!isFullAccessRole(user.role)) redirect("/people");

  return (
    <div className="max-w-lg mx-auto">
      <SectionHeader title="Add a Participant" subtitle="Start with the essentials — everything else builds from here." />
      <Card>
        <form action={createParticipant} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Display name</label>
            <input name="displayName" required placeholder="e.g. Riley C. or a de-identified initial" className="w-full rounded-lg border border-gridline px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Participant ID</label>
            <input name="participantCode" required placeholder="e.g. CL-1050" className="w-full rounded-lg border border-gridline px-3 py-2 text-sm" />
            <p className="text-xs text-ink-muted mt-1">Use a de-identified code for demo/testing data.</p>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Workspace</label>
            <select name="workspaceType" className="w-full rounded-lg border border-gridline px-3 py-2 text-sm" defaultValue="clinical">
              {WORKSPACE_TYPES.map((w) => (
                <option key={w.value} value={w.value}>{w.label} — {w.blurb}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">First domain (optional)</label>
            <input name="domainName" placeholder="e.g. Daily Living Skills, Guard Retention" className="w-full rounded-lg border border-gridline px-3 py-2 text-sm" />
          </div>
          <button type="submit" className="w-full rounded-lg bg-ink text-white py-2 text-sm font-medium hover:opacity-90">
            Create Participant
          </button>
        </form>
      </Card>
    </div>
  );
}

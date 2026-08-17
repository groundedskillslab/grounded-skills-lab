import { requireUser } from "@/lib/session";
import { getParticipant, getParticipantDomains, getParticipantGoals, listPromptHierarchies } from "@/lib/data";
import { canManagePrograms } from "@/lib/rbac";
import { getLabels, MEASUREMENT_TYPES, TEACHING_PROCEDURES } from "@/lib/labels";
import { Card, SectionHeader } from "@/components/ui";
import { createProgram } from "@/actions/programs";
import { notFound, redirect } from "next/navigation";

export default async function NewProgramPage({ params }: { params: Promise<{ participantId: string }> }) {
  const { participantId } = await params;
  const user = await requireUser();
  if (!(await canManagePrograms(user, participantId))) redirect(`/people/${participantId}`);

  const participant = await getParticipant(participantId);
  if (!participant) notFound();
  const labels = getLabels(participant.workspaceType);
  const [domainsList, goalsList, hierarchies] = await Promise.all([
    getParticipantDomains(participantId),
    getParticipantGoals(participantId),
    listPromptHierarchies(user.orgId),
  ]);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <SectionHeader
        title={`Build a ${labels.program}`}
        subtitle={`Turn a broad goal into an observable, teachable, measurable ${labels.program.toLowerCase()} for ${participant.displayName}.`}
      />

      <form action={createProgram} className="space-y-6">
        <input type="hidden" name="participantId" value={participantId} />

        <Card>
          <SectionHeader title="1. Where does this fit?" />
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Existing domain</label>
              <select name="domainId" className="w-full rounded-lg border border-gridline px-3 py-2 text-sm">
                <option value="">— choose —</option>
                {domainsList.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
              <input name="newDomainName" placeholder="or create a new domain" className="w-full rounded-lg border border-gridline px-3 py-2 text-sm mt-2" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Existing goal</label>
              <select name="goalId" className="w-full rounded-lg border border-gridline px-3 py-2 text-sm">
                <option value="">— choose —</option>
                {goalsList.map((g) => <option key={g.id} value={g.id}>{g.title}</option>)}
              </select>
              <input name="newGoalTitle" placeholder="or create a new goal title" className="w-full rounded-lg border border-gridline px-3 py-2 text-sm mt-2" />
            </div>
          </div>
          <div className="mt-3">
            <label className="block text-sm font-medium mb-1">Broad goal (plain language)</label>
            <input name="broadGoal" placeholder="e.g. Improve guard retention / Independently prepare a simple meal" className="w-full rounded-lg border border-gridline px-3 py-2 text-sm" />
          </div>
        </Card>

        <Card>
          <SectionHeader title="2. Define the skill" />
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1">{labels.program} name</label>
              <input name="name" required placeholder="e.g. Knee-Elbow Recovery" className="w-full rounded-lg border border-gridline px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Operational definition</label>
              <textarea name="operationalDefinition" rows={3} placeholder="Describe the behavior objectively and measurably." className="w-full rounded-lg border border-gridline px-3 py-2 text-sm" />
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">Rationale</label>
                <textarea name="rationale" rows={2} placeholder="Why this skill matters." className="w-full rounded-lg border border-gridline px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Prerequisites</label>
                <textarea name="prerequisites" rows={2} placeholder="Skills that should already exist." className="w-full rounded-lg border border-gridline px-3 py-2 text-sm" />
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <SectionHeader title="3. Task analysis" subtitle="Break the skill into steps. Leave blank rows empty — you can add more later." />
          <div className="grid sm:grid-cols-2 gap-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <input key={i} name="stepText" placeholder={`Step ${i + 1}`} className="rounded-lg border border-gridline px-3 py-2 text-sm" />
            ))}
          </div>
        </Card>

        <Card>
          <SectionHeader title="4. Teaching procedure" />
          <div className="flex flex-wrap gap-2 mb-4">
            {TEACHING_PROCEDURES.map((tp) => (
              <label key={tp} className="flex items-center gap-1.5 text-sm rounded-full border border-gridline px-3 py-1.5 cursor-pointer has-[:checked]:bg-brand-soft has-[:checked]:border-brand/40">
                <input type="checkbox" name="teachingProcedures" value={tp} className="accent-current" /> {tp}
              </label>
            ))}
          </div>
          <label className="block text-sm font-medium mb-1">{labels.prompt} hierarchy</label>
          <select name="promptHierarchyId" className="w-full rounded-lg border border-gridline px-3 py-2 text-sm">
            <option value="">— none —</option>
            {hierarchies.map((h) => <option key={h.id} value={h.id}>{h.name} ({JSON.parse(h.levels).join(" → ")})</option>)}
          </select>
        </Card>

        <Card>
          <SectionHeader title="5. First target & measurement" />
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">{labels.target} name</label>
              <input name="targetName" placeholder="Defaults to program name" className="w-full rounded-lg border border-gridline px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Measurement type</label>
              <select name="measurementType" className="w-full rounded-lg border border-gridline px-3 py-2 text-sm">
                {MEASUREMENT_TYPES.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
            </div>
          </div>
        </Card>

        <Card>
          <SectionHeader title="6. Caregiver / coach translation" subtitle="Plain-language version for non-clinical implementers." />
          <div className="grid sm:grid-cols-2 gap-3">
            <textarea name="caregiverSummary" rows={3} placeholder="Caregiver-friendly instructions" className="w-full rounded-lg border border-gridline px-3 py-2 text-sm" />
            <textarea name="coachSummary" rows={3} placeholder="Coach-friendly instructions" className="w-full rounded-lg border border-gridline px-3 py-2 text-sm" />
          </div>
        </Card>

        <button type="submit" className="w-full rounded-lg bg-ink text-white py-3 text-sm font-medium">
          Create {labels.program}
        </button>
      </form>
    </div>
  );
}

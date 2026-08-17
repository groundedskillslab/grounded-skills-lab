import { requireUser } from "@/lib/session";
import { listTemplates } from "@/lib/data";
import { Card, SectionHeader, Pill, EmptyState } from "@/components/ui";

export const dynamic = "force-dynamic";

const TYPE_LABELS: Record<string, string> = {
  program: "Program Template",
  task_analysis: "Task Analysis",
  measurement: "Measurement",
  prompt_hierarchy: "Prompt Hierarchy",
  fidelity_checklist: "Fidelity Checklist",
  mastery_rule: "Mastery Rule",
  generalization_plan: "Generalization Plan",
};

export default async function LibraryPage() {
  const user = await requireUser();
  const templates = await listTemplates(user.orgId);

  const byType = new Map<string, typeof templates>();
  for (const t of templates) {
    if (!byType.has(t.type)) byType.set(t.type, []);
    byType.get(t.type)!.push(t);
  }

  return (
    <div className="space-y-8">
      <SectionHeader
        title="Library"
        subtitle="Reusable program templates, task analyses, and checklists — the beginning of your organization's playbook."
      />
      {templates.length === 0 ? (
        <Card><EmptyState title="No templates saved yet" /></Card>
      ) : (
        [...byType.entries()].map(([type, items]) => (
          <div key={type}>
            <div className="text-xs uppercase tracking-wide text-ink-muted mb-3">{TYPE_LABELS[type] || type}</div>
            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
              {items.map((t) => (
                <Card key={t.id}>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="font-medium text-sm">{t.name}</div>
                    {t.isOrgWide && <Pill tone="brand">Org-wide</Pill>}
                  </div>
                  <p className="text-sm text-ink-secondary">{t.description}</p>
                </Card>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

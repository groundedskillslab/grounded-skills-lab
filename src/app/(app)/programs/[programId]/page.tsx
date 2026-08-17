import { requireUser } from "@/lib/session";
import {
  getProgram, getProgramSteps, getProgramTargets, getPromptHierarchy, listPromptHierarchies,
  getGeneralizationDimensions, getGeneralizationProbes, getMaintenancePlan, getFidelityProtocol,
  getFidelityObservations, getParticipant, getGoal, getDomain, getTrialsForProgram,
} from "@/lib/data";
import { db } from "@/db";
import { programChanges } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { getLabels, JOURNEY_STAGES, MEASUREMENT_TYPES, GENERALIZATION_DIMENSIONS } from "@/lib/labels";
import { MASTERY_CRITERIA_PRESETS } from "@/lib/mastery";
import { userCanAccessParticipant, canManagePrograms } from "@/lib/rbac";
import { Card, SectionHeader, Pill, JourneyBar, LinkButton, EmptyState } from "@/components/ui";
import { Tabs } from "@/components/Tabs";
import { notFound, redirect } from "next/navigation";
import { format } from "date-fns";
import {
  addProgramStep, toggleStepCritical, moveStep, deleteStep, addTarget, setMasteryRule, confirmMastery,
  checkMasteryStatus, addGeneralizationDimension, addGeneralizationProbe, createMaintenancePlan,
  completeMaintenanceCheck, createFidelityProtocol, addProgramChange, updateProgramStage,
} from "@/actions/programs";
import { aggregateTrialsBySession, TrialRow } from "@/lib/analytics";

export const dynamic = "force-dynamic";

export default async function ProgramPage({ params }: { params: Promise<{ programId: string }> }) {
  const { programId } = await params;
  const user = await requireUser();
  const program = await getProgram(programId);
  if (!program) notFound();

  const participant = await getParticipant(program.participantId);
  if (!participant || participant.orgId !== user.orgId) notFound();
  const allowed = await userCanAccessParticipant(user.id, user.role, participant.id);
  if (!allowed) redirect("/people");

  const canManage = await canManagePrograms(user, participant.id);
  const labels = getLabels(participant.workspaceType);
  const goal = await getGoal(program.goalId);
  const domain = goal ? await getDomain(goal.domainId) : null;

  const [steps, progTargets, promptHierarchy, allHierarchies, dims, probes, maintenance, fidelity, fidelityObs, changes, trials] =
    await Promise.all([
      getProgramSteps(programId),
      getProgramTargets(programId),
      getPromptHierarchy(program.promptHierarchyId),
      listPromptHierarchies(user.orgId),
      getGeneralizationDimensions(programId),
      getGeneralizationProbes(programId),
      getMaintenancePlan(programId),
      getFidelityProtocol(programId),
      getFidelityObservations(programId),
      db.select().from(programChanges).where(eq(programChanges.programId, programId)).orderBy(desc(programChanges.date)),
      getTrialsForProgram(programId),
    ]);

  const aggregates = aggregateTrialsBySession(trials as unknown as TrialRow[]);
  const latestPerformance = aggregates.length ? aggregates[aggregates.length - 1].performancePct : null;
  const latestIndependence = aggregates.length ? aggregates[aggregates.length - 1].independencePct : null;

  const teachingProcedures: string[] = program.teachingProcedures ? JSON.parse(program.teachingProcedures) : [];

  const masteryChecks = await Promise.all(progTargets.map(async (t) => ({ target: t, status: await checkMasteryStatus(t.id) })));

  return (
    <div className="space-y-6">
      <div className="text-sm text-ink-muted">
        <span>{participant.displayName}</span> {domain && <> · {domain.name}</>} {goal && <> · {goal.title}</>}
      </div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-medium">{program.name}</h1>
          <div className="flex items-center gap-2 mt-2">
            <Pill tone="brand">{JOURNEY_STAGES.find((s) => s.value === program.journeyStage)?.label}</Pill>
            {latestPerformance !== null && <Pill tone="neutral">Latest performance {latestPerformance.toFixed(0)}%</Pill>}
            {latestIndependence !== null && <Pill tone="neutral">Latest {labels.independent.toLowerCase()} {latestIndependence.toFixed(0)}%</Pill>}
          </div>
        </div>
        <div className="flex gap-2">
          <LinkButton href={`/sessions/new?participantId=${participant.id}&programId=${program.id}`}>Start {labels.session}</LinkButton>
          <LinkButton href={`/analytics/${program.id}`} variant="secondary">Analytics</LinkButton>
        </div>
      </div>

      <Card>
        <div className="max-w-3xl">
          <JourneyBar stage={program.journeyStage} />
        </div>
        {canManage && (
          <div className="flex flex-wrap gap-2 mt-4">
            {JOURNEY_STAGES.map((s) => (
              <form key={s.value} action={updateProgramStage.bind(null, program.id, s.value)}>
                <button
                  type="submit"
                  className={`text-xs rounded-full px-2.5 py-1 border transition ${
                    program.journeyStage === s.value ? "bg-ink text-white border-ink" : "border-gridline text-ink-secondary hover:border-ink"
                  }`}
                >
                  {s.label}
                </button>
              </form>
            ))}
          </div>
        )}
      </Card>

      <Tabs
        panels={[
          { id: "overview", label: "Overview", content: <OverviewTab program={program} labels={labels} teachingProcedures={teachingProcedures} promptHierarchy={promptHierarchy} /> },
          { id: "ta", label: "Task Analysis", content: <TaskAnalysisTab programId={programId} steps={steps} canManage={canManage} /> },
          { id: "measurement", label: "Measurement & Mastery", content: <MeasurementTab programId={programId} targets={progTargets} labels={labels} canManage={canManage} masteryChecks={masteryChecks} /> },
          { id: "generalization", label: labels.generalization, content: <GeneralizationTab programId={programId} dims={dims} probes={probes} targets={progTargets} canManage={canManage} /> },
          { id: "maintenance", label: labels.maintenance, content: <MaintenanceTab programId={programId} maintenance={maintenance} canManage={canManage} /> },
          { id: "fidelity", label: labels.fidelity, content: <FidelityTab programId={programId} fidelity={fidelity} observations={fidelityObs} canManage={canManage} /> },
          { id: "translation", label: "Caregiver / Coach View", content: <TranslationTab program={program} labels={labels} /> },
          { id: "log", label: "Decision Log", content: <DecisionLogTab programId={programId} changes={changes} canManage={canManage} /> },
        ]}
      />
    </div>
  );
}

function OverviewTab({ program, labels, teachingProcedures, promptHierarchy }: any) {
  return (
    <div className="grid md:grid-cols-2 gap-6">
      <Card>
        <SectionHeader title="Goal & Definition" />
        <dl className="space-y-4 text-sm">
          <div><dt className="text-xs uppercase tracking-wide text-ink-muted mb-1">Operational Definition</dt><dd className="text-ink-secondary leading-relaxed">{program.operationalDefinition || "—"}</dd></div>
          <div><dt className="text-xs uppercase tracking-wide text-ink-muted mb-1">Rationale</dt><dd className="text-ink-secondary leading-relaxed">{program.rationale || "—"}</dd></div>
          <div><dt className="text-xs uppercase tracking-wide text-ink-muted mb-1">Prerequisites</dt><dd className="text-ink-secondary leading-relaxed">{program.prerequisites || "—"}</dd></div>
        </dl>
      </Card>
      <Card>
        <SectionHeader title="Teaching & Prompting" />
        <div className="mb-4">
          <div className="text-xs uppercase tracking-wide text-ink-muted mb-2">Teaching Procedures</div>
          <div className="flex flex-wrap gap-1.5">
            {teachingProcedures.length ? teachingProcedures.map((t: string) => <Pill key={t} tone="brand">{t}</Pill>) : <span className="text-sm text-ink-muted">None specified</span>}
          </div>
        </div>
        {program.teachingProcedureNotes && (
          <p className="text-sm text-ink-secondary mb-4">{program.teachingProcedureNotes}</p>
        )}
        <div>
          <div className="text-xs uppercase tracking-wide text-ink-muted mb-2">{labels.prompt} Hierarchy</div>
          {promptHierarchy ? (
            <ol className="flex flex-wrap gap-1.5">
              {JSON.parse(promptHierarchy.levels).map((lvl: string, i: number) => (
                <li key={lvl} className="text-xs bg-plane rounded-full px-2.5 py-1 flex items-center gap-1">
                  <span className="text-ink-muted">{i + 1}</span> {lvl}
                </li>
              ))}
            </ol>
          ) : (
            <span className="text-sm text-ink-muted">No hierarchy configured</span>
          )}
        </div>
      </Card>
    </div>
  );
}

function TaskAnalysisTab({ programId, steps, canManage }: any) {
  return (
    <Card>
      <SectionHeader title="Task Analysis" subtitle="Break the skill into teachable, orderable steps. Mark the steps most critical to score." />
      {steps.length === 0 ? (
        <EmptyState title="No steps yet" body="Add the first step below." />
      ) : (
        <ol className="space-y-1.5 mb-5">
          {steps.map((step: any, i: number) => (
            <li key={step.id} className="flex items-center gap-3 border border-gridline rounded-lg px-3 py-2">
              <span className="text-xs text-ink-muted w-5 tabular">{i + 1}</span>
              <span className="flex-1 text-sm">{step.text}</span>
              {step.isCritical && <Pill tone="warning">Critical</Pill>}
              {canManage && (
                <div className="flex items-center gap-1">
                  <form action={moveStep.bind(null, step.id, programId, "up")}><button className="text-ink-muted hover:text-ink px-1.5 py-1 text-xs" title="Move up">↑</button></form>
                  <form action={moveStep.bind(null, step.id, programId, "down")}><button className="text-ink-muted hover:text-ink px-1.5 py-1 text-xs" title="Move down">↓</button></form>
                  <form action={toggleStepCritical.bind(null, step.id, programId, step.isCritical)}><button className="text-ink-muted hover:text-ink px-1.5 py-1 text-xs" title="Toggle critical">★</button></form>
                  <form action={deleteStep.bind(null, step.id, programId)}><button className="text-status-critical/70 hover:text-status-critical px-1.5 py-1 text-xs" title="Delete">✕</button></form>
                </div>
              )}
            </li>
          ))}
        </ol>
      )}
      {canManage && (
        <form action={addProgramStep} className="flex gap-2">
          <input type="hidden" name="programId" value={programId} />
          <input name="text" placeholder="Add a step..." className="flex-1 rounded-lg border border-gridline px-3 py-2 text-sm" />
          <button type="submit" className="rounded-lg bg-ink text-white px-4 py-2 text-sm font-medium">Add</button>
        </form>
      )}
    </Card>
  );
}

function MeasurementTab({ programId, targets, labels, canManage, masteryChecks }: any) {
  return (
    <div className="space-y-6">
      {targets.map((t: any) => {
        const mc = masteryChecks.find((m: any) => m.target.id === t.id);
        return (
          <Card key={t.id}>
            <div className="flex items-start justify-between gap-4 mb-3">
              <div>
                <div className="font-medium">{t.name}</div>
                <div className="text-xs text-ink-muted">{MEASUREMENT_TYPES.find((m) => m.value === t.measurementType)?.label}{t.unitLabel ? ` · ${t.unitLabel}` : ""}</div>
              </div>
            </div>
            {mc?.status ? (
              <div className="mb-4">
                <div className="text-xs uppercase tracking-wide text-ink-muted mb-1">Mastery Rule</div>
                <p className="text-sm text-ink-secondary mb-2">{mc.status.rule.description}</p>
                <p className="text-xs text-ink-muted mb-2">{mc.status.result.summary}</p>
                {mc.status.rule.confirmedAt ? (
                  <Pill tone="good">Mastery confirmed {format(new Date(mc.status.rule.confirmedAt), "MMM d, yyyy")}</Pill>
                ) : mc.status.result.met ? (
                  <div className="flex items-center gap-3">
                    <Pill tone="warning">Mastery criterion appears to have been met</Pill>
                    {canManage && (
                      <form action={confirmMastery}>
                        <input type="hidden" name="targetId" value={t.id} />
                        <input type="hidden" name="programId" value={programId} />
                        <button className="text-xs rounded-lg bg-ink text-white px-3 py-1.5 font-medium">Confirm Mastery</button>
                      </form>
                    )}
                  </div>
                ) : (
                  <Pill tone="neutral">Not yet met</Pill>
                )}
              </div>
            ) : (
              canManage && (
                <form action={setMasteryRule} className="mb-2 space-y-2">
                  <input type="hidden" name="targetId" value={t.id} />
                  <input type="hidden" name="programId" value={programId} />
                  <select name="criteriaPreset" className="hidden" />
                  <div className="grid sm:grid-cols-[1fr_auto] gap-2">
                    <select
                      name="description"
                      className="rounded-lg border border-gridline px-3 py-2 text-sm"
                      onChange={undefined}
                    >
                      {MASTERY_CRITERIA_PRESETS.map((p) => (
                        <option key={p.label} value={p.label}>{p.label}</option>
                      ))}
                    </select>
                    <button
                      formAction={async (formData: FormData) => {
                        "use server";
                        const label = String(formData.get("description"));
                        const preset = MASTERY_CRITERIA_PRESETS.find((p) => p.label === label) || MASTERY_CRITERIA_PRESETS[MASTERY_CRITERIA_PRESETS.length - 1];
                        const fd = new FormData();
                        fd.set("targetId", t.id);
                        fd.set("programId", programId);
                        fd.set("description", preset.label);
                        fd.set("criteria", JSON.stringify(preset.criteria));
                        await setMasteryRule(fd);
                      }}
                      className="rounded-lg bg-ink text-white px-3 py-2 text-sm font-medium"
                    >
                      Set Mastery Rule
                    </button>
                  </div>
                </form>
              )
            )}
          </Card>
        );
      })}

      {canManage && (
        <Card>
          <SectionHeader title="Add a Target" />
          <form action={addTarget} className="grid sm:grid-cols-[1fr_1fr_auto] gap-2">
            <input type="hidden" name="programId" value={programId} />
            <input name="name" placeholder={`${labels.target} name`} className="rounded-lg border border-gridline px-3 py-2 text-sm" />
            <select name="measurementType" className="rounded-lg border border-gridline px-3 py-2 text-sm">
              {MEASUREMENT_TYPES.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
            <button className="rounded-lg bg-ink text-white px-4 py-2 text-sm font-medium">Add</button>
          </form>
        </Card>
      )}
    </div>
  );
}

function GeneralizationTab({ programId, dims, probes, targets, canManage }: any) {
  const probesByDim = new Map<string, any[]>();
  for (const p of probes) {
    if (!probesByDim.has(p.dimensionId)) probesByDim.set(p.dimensionId, []);
    probesByDim.get(p.dimensionId)!.push(p);
  }
  const resultTone: Record<string, any> = { met: "good", partial: "warning", not_met: "critical" };

  return (
    <div className="space-y-6">
      <Card>
        <SectionHeader title="Generalization Matrix" subtitle="Where has this skill transferred, and where hasn't it been probed yet?" />
        {dims.length === 0 ? (
          <EmptyState title="No generalization dimensions defined" body="Add a dimension (person, setting, partner, etc.) below." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-ink-muted border-b border-gridline">
                  <th className="pb-2 pr-4">Dimension</th>
                  <th className="pb-2 pr-4">Latest Result</th>
                  <th className="pb-2">Context</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gridline">
                {dims.map((d: any) => {
                  const dimProbes = (probesByDim.get(d.id) || []).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
                  const latest = dimProbes[0];
                  return (
                    <tr key={d.id}>
                      <td className="py-2.5 pr-4">
                        <div className="font-medium">{d.label}</div>
                        <div className="text-xs text-ink-muted capitalize">{d.dimensionType.replace("_", " ")}</div>
                      </td>
                      <td className="py-2.5 pr-4">
                        {latest ? <Pill tone={resultTone[latest.result]}>{latest.result.replace("_", " ")}</Pill> : <Pill tone="neutral">Not yet probed</Pill>}
                      </td>
                      <td className="py-2.5 text-ink-secondary">{latest?.context || "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {canManage && (
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <SectionHeader title="Add Dimension" />
            <form action={addGeneralizationDimension} className="space-y-2">
              <input type="hidden" name="programId" value={programId} />
              <select name="dimensionType" className="w-full rounded-lg border border-gridline px-3 py-2 text-sm">
                {GENERALIZATION_DIMENSIONS.map((d) => <option key={d} value={d} className="capitalize">{d.replace("_", " ")}</option>)}
              </select>
              <input name="label" placeholder="e.g. New training partner" className="w-full rounded-lg border border-gridline px-3 py-2 text-sm" />
              <button className="rounded-lg bg-ink text-white px-4 py-2 text-sm font-medium">Add Dimension</button>
            </form>
          </Card>
          <Card>
            <SectionHeader title="Log a Probe" />
            <form action={addGeneralizationProbe} className="space-y-2">
              <input type="hidden" name="programId" value={programId} />
              <select name="dimensionId" className="w-full rounded-lg border border-gridline px-3 py-2 text-sm">
                {dims.map((d: any) => <option key={d.id} value={d.id}>{d.label}</option>)}
              </select>
              <select name="targetId" className="w-full rounded-lg border border-gridline px-3 py-2 text-sm">
                <option value="">(no specific target)</option>
                {targets.map((t: any) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
              <select name="result" className="w-full rounded-lg border border-gridline px-3 py-2 text-sm">
                <option value="met">Met</option>
                <option value="partial">Partial</option>
                <option value="not_met">Not Met</option>
              </select>
              <input name="context" placeholder="Context / notes" className="w-full rounded-lg border border-gridline px-3 py-2 text-sm" />
              <button className="rounded-lg bg-ink text-white px-4 py-2 text-sm font-medium">Log Probe</button>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}

function MaintenanceTab({ programId, maintenance, canManage }: any) {
  const resultTone: Record<string, any> = { stable: "good", declined: "critical", not_yet_checked: "neutral" };
  return (
    <div className="space-y-6">
      <Card>
        <SectionHeader title="Maintenance Schedule" subtitle="Once a skill is mastered, check that it holds up over time." />
        {!maintenance ? (
          <EmptyState title="No maintenance plan yet" body="Set one up once this skill reaches mastery." />
        ) : (
          <ul className="divide-y divide-gridline">
            {maintenance.checks.map((c: any) => (
              <li key={c.id} className="py-3 flex items-center justify-between gap-4">
                <div>
                  <div className="font-medium text-sm">{c.label} check</div>
                  <div className="text-xs text-ink-muted">Due {format(new Date(c.dueDate), "MMM d, yyyy")}{c.completedDate ? ` · Completed ${format(new Date(c.completedDate), "MMM d, yyyy")}` : ""}</div>
                  {c.notes && <div className="text-xs text-ink-secondary mt-1">{c.notes}</div>}
                </div>
                {c.result !== "not_yet_checked" ? (
                  <Pill tone={resultTone[c.result]}>{c.result}</Pill>
                ) : canManage ? (
                  <details className="relative">
                    <summary className="text-xs cursor-pointer rounded-lg border border-gridline px-3 py-1.5 list-none">Record Check</summary>
                    <form action={completeMaintenanceCheck} className="absolute right-0 mt-2 w-64 bg-surface border border-gridline rounded-xl p-3 shadow-lg z-10 space-y-2">
                      <input type="hidden" name="checkId" value={c.id} />
                      <input type="hidden" name="programId" value={programId} />
                      <select name="result" className="w-full rounded-lg border border-gridline px-2 py-1.5 text-sm">
                        <option value="stable">Stable</option>
                        <option value="declined">Declined</option>
                      </select>
                      <input name="performanceValue" type="number" placeholder="Performance %" className="w-full rounded-lg border border-gridline px-2 py-1.5 text-sm" />
                      <textarea name="notes" placeholder="Notes" className="w-full rounded-lg border border-gridline px-2 py-1.5 text-sm" rows={2} />
                      <button className="w-full rounded-lg bg-ink text-white py-1.5 text-sm font-medium">Save</button>
                    </form>
                  </details>
                ) : (
                  <Pill tone="neutral">Not yet checked</Pill>
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>
      {canManage && !maintenance && (
        <Card>
          <SectionHeader title="Set Up Maintenance Plan" />
          <form action={createMaintenancePlan} className="space-y-3">
            <input type="hidden" name="programId" value={programId} />
            <div className="flex flex-wrap gap-4">
              {[["1_week", "1 week"], ["2_week", "2 weeks"], ["1_month", "1 month"], ["3_month", "3 months"]].map(([v, l]) => (
                <label key={v} className="flex items-center gap-2 text-sm">
                  <input type="checkbox" name="schedule" value={v} defaultChecked={v !== "3_month"} /> {l}
                </label>
              ))}
            </div>
            <button className="rounded-lg bg-ink text-white px-4 py-2 text-sm font-medium">Create Plan</button>
          </form>
        </Card>
      )}
    </div>
  );
}

function FidelityTab({ programId, fidelity, observations, canManage }: any) {
  const avgRecent = observations.slice(0, 5);
  const avg = avgRecent.length ? avgRecent.reduce((s: number, o: any) => s + o.fidelityPercent, 0) / avgRecent.length : null;

  return (
    <div className="space-y-6">
      <div className="grid sm:grid-cols-2 gap-4">
        <Card>
          <div className="text-xs uppercase tracking-wide text-ink-muted mb-2">Average (last 5 observations)</div>
          <div className={`text-3xl font-medium tabular ${avg !== null && avg < 80 ? "text-status-serious" : "text-status-good"}`}>{avg !== null ? `${avg.toFixed(0)}%` : "—"}</div>
        </Card>
        <Card className="flex items-center justify-between">
          <div>
            <div className="text-xs uppercase tracking-wide text-ink-muted mb-1">Protocol</div>
            <div className="text-sm font-medium">{fidelity?.protocol.name || "Not configured"}</div>
          </div>
          {fidelity && canManage && <LinkButton href={`/programs/${programId}/fidelity/new`} variant="secondary">Record Observation</LinkButton>}
        </Card>
      </div>

      {!fidelity ? (
        canManage && (
          <Card>
            <SectionHeader title="Create Fidelity Checklist" subtitle="List the steps a good implementation of this program includes." />
            <form action={createFidelityProtocol} className="space-y-2">
              <input type="hidden" name="programId" value={programId} />
              <input name="name" placeholder="Checklist name" className="w-full rounded-lg border border-gridline px-3 py-2 text-sm" />
              {[0, 1, 2, 3, 4].map((i) => (
                <input key={i} name="item" placeholder={`Step ${i + 1}`} className="w-full rounded-lg border border-gridline px-3 py-2 text-sm" />
              ))}
              <button className="rounded-lg bg-ink text-white px-4 py-2 text-sm font-medium">Create Checklist</button>
            </form>
          </Card>
        )
      ) : (
        <Card>
          <SectionHeader title="Checklist Items" />
          <ol className="space-y-1.5">
            {fidelity.items.map((it: any, i: number) => (
              <li key={it.id} className="text-sm flex gap-2"><span className="text-ink-muted tabular">{i + 1}.</span>{it.text}</li>
            ))}
          </ol>
        </Card>
      )}

      <Card>
        <SectionHeader title="Observation History" />
        {observations.length === 0 ? (
          <EmptyState title="No observations recorded yet" />
        ) : (
          <ul className="divide-y divide-gridline">
            {observations.map((o: any) => (
              <li key={o.id} className="py-2.5 flex items-center justify-between">
                <div className="text-sm">{format(new Date(o.date), "MMM d, yyyy")}</div>
                <Pill tone={o.fidelityPercent >= 90 ? "good" : o.fidelityPercent >= 80 ? "warning" : "critical"}>{o.fidelityPercent.toFixed(0)}%</Pill>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

function TranslationTab({ program, labels }: any) {
  return (
    <div className="grid md:grid-cols-2 gap-6">
      <Card>
        <SectionHeader title="Professional Version" />
        <p className="text-sm text-ink-secondary leading-relaxed">{program.operationalDefinition || "No operational definition written yet."}</p>
      </Card>
      <Card>
        <SectionHeader title={`${labels.caregiver} / ${labels.implementer} Version`} />
        <p className="text-sm text-ink-secondary leading-relaxed">
          {program.caregiverSummary || program.coachSummary || "No simplified version written yet — add one so non-clinical implementers have plain-language steps."}
        </p>
      </Card>
    </div>
  );
}

function DecisionLogTab({ programId, changes, canManage }: any) {
  return (
    <div className="space-y-6">
      <Card>
        <SectionHeader title="Professional Decision Log" subtitle="A transparent record of what changed, why, and what to review next — not an automatic treatment recommendation." />
        {changes.length === 0 ? (
          <EmptyState title="No changes logged yet" />
        ) : (
          <ul className="space-y-4">
            {changes.map((c: any) => (
              <li key={c.id} className="border-l-2 border-gridline pl-4">
                <div className="flex items-center gap-2 text-xs text-ink-muted mb-1">
                  <span>{format(new Date(c.date), "MMM d, yyyy")}</span>
                  <Pill tone="neutral">{c.changeType}</Pill>
                </div>
                <p className="text-sm">{c.description}</p>
                {c.rationale && <p className="text-xs text-ink-secondary mt-1"><span className="font-medium">Why: </span>{c.rationale}</p>}
                {c.expectedOutcome && <p className="text-xs text-ink-secondary mt-1"><span className="font-medium">Expecting: </span>{c.expectedOutcome}</p>}
                {c.dataToReview && <p className="text-xs text-ink-secondary mt-1"><span className="font-medium">Reviewing: </span>{c.dataToReview}</p>}
              </li>
            ))}
          </ul>
        )}
      </Card>
      {canManage && (
        <Card>
          <SectionHeader title="Log a Change" />
          <form action={addProgramChange} className="space-y-2">
            <input type="hidden" name="programId" value={programId} />
            <input name="changeType" placeholder="e.g. Changed prompt strategy, Increased resistance" className="w-full rounded-lg border border-gridline px-3 py-2 text-sm" />
            <textarea name="description" placeholder="What changed" className="w-full rounded-lg border border-gridline px-3 py-2 text-sm" rows={2} />
            <textarea name="rationale" placeholder="Why" className="w-full rounded-lg border border-gridline px-3 py-2 text-sm" rows={2} />
            <textarea name="expectedOutcome" placeholder="Expected outcome" className="w-full rounded-lg border border-gridline px-3 py-2 text-sm" rows={2} />
            <input name="dataToReview" placeholder="What data will be reviewed" className="w-full rounded-lg border border-gridline px-3 py-2 text-sm" />
            <button className="rounded-lg bg-ink text-white px-4 py-2 text-sm font-medium">Log Change</button>
          </form>
        </Card>
      )}
    </div>
  );
}

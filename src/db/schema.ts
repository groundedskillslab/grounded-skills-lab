import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { randomUUID } from "crypto";

const id = () =>
  text("id")
    .primaryKey()
    .$defaultFn(() => randomUUID());

const now = () => integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date());

/* ------------------------------------------------------------------ */
/* Organizations & Users                                               */
/* ------------------------------------------------------------------ */

export const organizations = sqliteTable("organizations", {
  id: id(),
  name: text("name").notNull(),
  createdAt: now(),
});

// role: org_admin | practitioner | implementer | caregiver | learner
export const users = sqliteTable("users", {
  id: id(),
  orgId: text("org_id").notNull(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: text("role").notNull(),
  title: text("title"), // e.g. "BCBA", "Head Coach", "Mom"
  createdAt: now(),
});

/* ------------------------------------------------------------------ */
/* Participants                                                        */
/* ------------------------------------------------------------------ */

// workspaceType: clinical | performance | education | general
export const participants = sqliteTable("participants", {
  id: id(),
  orgId: text("org_id").notNull(),
  displayName: text("display_name").notNull(),
  participantCode: text("participant_code").notNull(),
  workspaceType: text("workspace_type").notNull(),
  primaryPractitionerId: text("primary_practitioner_id"),
  archived: integer("archived", { mode: "boolean" }).notNull().default(false),
  createdAt: now(),
});

// roleOnCase: practitioner | implementer | caregiver | learner
export const participantAssignments = sqliteTable("participant_assignments", {
  id: id(),
  participantId: text("participant_id").notNull(),
  userId: text("user_id").notNull(),
  roleOnCase: text("role_on_case").notNull(),
  createdAt: now(),
});

/* ------------------------------------------------------------------ */
/* Goal hierarchy: Domain -> Goal -> Program -> Target                 */
/* ------------------------------------------------------------------ */

export const domains = sqliteTable("domains", {
  id: id(),
  participantId: text("participant_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  createdAt: now(),
});

// status: active | on_hold | achieved | discontinued
export const goals = sqliteTable("goals", {
  id: id(),
  domainId: text("domain_id").notNull(),
  participantId: text("participant_id").notNull(),
  title: text("title").notNull(),
  broadGoal: text("broad_goal").notNull(),
  successDescription: text("success_description"),
  status: text("status").notNull().default("active"),
  createdAt: now(),
});

// journeyStage: not_started | baseline | acquisition | improving | generalizing | mastered | maintenance
export const programs = sqliteTable("programs", {
  id: id(),
  goalId: text("goal_id").notNull(),
  participantId: text("participant_id").notNull(),
  name: text("name").notNull(),
  operationalDefinition: text("operational_definition"),
  rationale: text("rationale"),
  prerequisites: text("prerequisites"),
  teachingProcedures: text("teaching_procedures"), // JSON string[] of strategy names
  teachingProcedureNotes: text("teaching_procedure_notes"),
  promptHierarchyId: text("prompt_hierarchy_id"),
  caregiverSummary: text("caregiver_summary"),
  coachSummary: text("coach_summary"),
  journeyStage: text("journey_stage").notNull().default("not_started"),
  masteredAt: integer("mastered_at", { mode: "timestamp" }),
  archived: integer("archived", { mode: "boolean" }).notNull().default(false),
  createdByUserId: text("created_by_user_id"),
  createdAt: now(),
});

// ordered breakdown of the skill for teaching / display purposes
export const programSteps = sqliteTable("program_steps", {
  id: id(),
  programId: text("program_id").notNull(),
  orderIndex: integer("order_index").notNull(),
  text: text("text").notNull(),
  groupLabel: text("group_label"),
  isCritical: integer("is_critical", { mode: "boolean" }).notNull().default(false),
});

// measurementType: independent_prompted_incorrect | correct_incorrect | percentage | frequency
//   | rate | duration | latency | task_analysis | rating | opportunity | yes_no | custom
export const targets = sqliteTable("targets", {
  id: id(),
  programId: text("program_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  orderIndex: integer("order_index").notNull().default(0),
  measurementType: text("measurement_type").notNull(),
  unitLabel: text("unit_label"), // e.g. "seconds", "reps", "%"
  promptHierarchyId: text("prompt_hierarchy_id"),
  archived: integer("archived", { mode: "boolean" }).notNull().default(false),
  createdAt: now(),
});

/* ------------------------------------------------------------------ */
/* Prompt hierarchies & mastery rules                                  */
/* ------------------------------------------------------------------ */

export const promptHierarchies = sqliteTable("prompt_hierarchies", {
  id: id(),
  orgId: text("org_id").notNull(),
  name: text("name").notNull(),
  levels: text("levels").notNull(), // JSON string[] ordered least->most support
  strategy: text("strategy").notNull().default("least_to_most"), // least_to_most|most_to_least|graduated_guidance|time_delay|custom
  isTemplate: integer("is_template", { mode: "boolean" }).notNull().default(false),
});

// criteria: JSON e.g. {"type":"percentage_consecutive","threshold":80,"consecutiveSessions":3}
export const masteryRules = sqliteTable("mastery_rules", {
  id: id(),
  targetId: text("target_id"),
  programId: text("program_id"),
  description: text("description").notNull(),
  criteria: text("criteria").notNull(), // JSON
  autoDetectedAt: integer("auto_detected_at", { mode: "timestamp" }),
  confirmedByUserId: text("confirmed_by_user_id"),
  confirmedAt: integer("confirmed_at", { mode: "timestamp" }),
});

/* ------------------------------------------------------------------ */
/* Generalization & Maintenance                                        */
/* ------------------------------------------------------------------ */

// dimensionType: person|setting|equipment|instruction|partner|environment|time|stimulus|training_condition|opponent
export const generalizationDimensions = sqliteTable("generalization_dimensions", {
  id: id(),
  programId: text("program_id").notNull(),
  dimensionType: text("dimension_type").notNull(),
  label: text("label").notNull(),
});

// result: met | partial | not_met
export const generalizationProbes = sqliteTable("generalization_probes", {
  id: id(),
  dimensionId: text("dimension_id").notNull(),
  targetId: text("target_id"),
  programId: text("program_id").notNull(),
  date: integer("date", { mode: "timestamp" }).notNull(),
  result: text("result").notNull(),
  context: text("context"),
  notes: text("notes"),
  recordedByUserId: text("recorded_by_user_id"),
});

export const maintenancePlans = sqliteTable("maintenance_plans", {
  id: id(),
  programId: text("program_id").notNull(),
  schedule: text("schedule").notNull(), // JSON string[] e.g. ["1_week","2_week","1_month"]
  createdAt: now(),
});

// result: stable | declined | not_yet_checked
export const maintenanceChecks = sqliteTable("maintenance_checks", {
  id: id(),
  maintenancePlanId: text("maintenance_plan_id").notNull(),
  label: text("label").notNull(), // "1 week"
  dueDate: integer("due_date", { mode: "timestamp" }).notNull(),
  completedDate: integer("completed_date", { mode: "timestamp" }),
  result: text("result").notNull().default("not_yet_checked"),
  performanceValue: real("performance_value"),
  notes: text("notes"),
  recordedByUserId: text("recorded_by_user_id"),
});

/* ------------------------------------------------------------------ */
/* Sessions & Trial Data                                                */
/* ------------------------------------------------------------------ */

// type: session | fidelity_observation
export const sessions = sqliteTable("sessions", {
  id: id(),
  participantId: text("participant_id").notNull(),
  programId: text("program_id"),
  conductedByUserId: text("conducted_by_user_id").notNull(),
  date: integer("date", { mode: "timestamp" }).notNull(),
  durationMinutes: real("duration_minutes"),
  contextTags: text("context_tags"), // JSON string[]
  notes: text("notes"),
  aiSummary: text("ai_summary"),
  // Optional human-entered code (e.g. "GSL-024") linking this session to an entry
  // in the physical Grounded Practice Journal — see the journal's "Companion System" page.
  sessionCode: text("session_code"),
  createdAt: now(),
});

// result: independent | prompted | incorrect | correct | na
export const trialData = sqliteTable("trial_data", {
  id: id(),
  sessionId: text("session_id").notNull(),
  targetId: text("target_id").notNull(),
  timestamp: integer("timestamp", { mode: "timestamp" }).notNull(),
  result: text("result").notNull(),
  promptLevel: text("prompt_level"),
  value: real("value"), // duration/latency/rating/frequency/custom numeric
  stepResults: text("step_results"), // JSON for task_analysis: [{stepId, result, promptLevel}]
  notes: text("notes"),
  recordedByUserId: text("recorded_by_user_id").notNull(),
  // edit history / never silently overwrite
  editedFromId: text("edited_from_id"),
  editReason: text("edit_reason"),
  createdAt: now(),
});

/* ------------------------------------------------------------------ */
/* Implementation / Treatment Fidelity                                 */
/* ------------------------------------------------------------------ */

export const fidelityProtocols = sqliteTable("fidelity_protocols", {
  id: id(),
  programId: text("program_id").notNull(),
  name: text("name").notNull(),
  createdAt: now(),
});

export const fidelityItems = sqliteTable("fidelity_items", {
  id: id(),
  protocolId: text("protocol_id").notNull(),
  orderIndex: integer("order_index").notNull(),
  text: text("text").notNull(),
});

// scores: JSON { [itemId]: "correct"|"incorrect"|"na" }
export const fidelityObservations = sqliteTable("fidelity_observations", {
  id: id(),
  protocolId: text("protocol_id").notNull(),
  participantId: text("participant_id").notNull(),
  programId: text("program_id").notNull(),
  sessionId: text("session_id"),
  observedUserId: text("observed_user_id"), // implementer being observed
  observerUserId: text("observer_user_id").notNull(),
  date: integer("date", { mode: "timestamp" }).notNull(),
  scores: text("scores").notNull(), // JSON
  fidelityPercent: real("fidelity_percent").notNull(),
  notes: text("notes"),
  createdAt: now(),
});

/* ------------------------------------------------------------------ */
/* Assignments & Practice Logs                                         */
/* ------------------------------------------------------------------ */

// status: assigned | started | completed | missed
export const assignments = sqliteTable("assignments", {
  id: id(),
  participantId: text("participant_id").notNull(),
  programId: text("program_id"),
  title: text("title").notNull(),
  instructions: text("instructions"),
  frequency: text("frequency"), // free text e.g. "Once each evening"
  assignedByUserId: text("assigned_by_user_id").notNull(),
  assignedToUserId: text("assigned_to_user_id"),
  dueDate: integer("due_date", { mode: "timestamp" }),
  status: text("status").notNull().default("assigned"),
  createdAt: now(),
});

// result: successful | needed_help | not_completed | barrier
export const practiceLogs = sqliteTable("practice_logs", {
  id: id(),
  assignmentId: text("assignment_id"),
  participantId: text("participant_id").notNull(),
  programId: text("program_id").notNull(),
  targetId: text("target_id"),
  date: integer("date", { mode: "timestamp" }).notNull(),
  loggedByUserId: text("logged_by_user_id").notNull(),
  result: text("result").notNull(),
  whatWorkedNote: text("what_worked_note"), // "What Worked" — shared reflection language w/ the Practice Journal
  barrierNote: text("barrier_note"), // "What Got in the Way"
  contextTags: text("context_tags"), // JSON string[]
  confidenceRating: real("confidence_rating"), // 1-5, self-reported
  effortRating: real("effort_rating"),
  notes: text("notes"),
  // Optional human-entered code (e.g. "GSL-024") linking this log to an entry
  // in the physical Grounded Practice Journal — see the journal's "Companion System" page.
  sessionCode: text("session_code"),
  createdAt: now(),
});

/* ------------------------------------------------------------------ */
/* Self monitoring (learner/athlete self tracking)                     */
/* ------------------------------------------------------------------ */

export const selfMonitoringEntries = sqliteTable("self_monitoring_entries", {
  id: id(),
  participantId: text("participant_id").notNull(),
  programId: text("program_id"),
  date: integer("date", { mode: "timestamp" }).notNull(),
  completed: integer("completed", { mode: "boolean" }).notNull().default(false),
  value: real("value"),
  notes: text("notes"),
  createdAt: now(),
});

/* ------------------------------------------------------------------ */
/* Contextual tags (canonical tag list per org)                        */
/* ------------------------------------------------------------------ */

export const contextualTags = sqliteTable("contextual_tags", {
  id: id(),
  orgId: text("org_id").notNull(),
  label: text("label").notNull(),
  category: text("category"), // e.g. "training_context" | "barrier"
});

/* ------------------------------------------------------------------ */
/* Program change tracking / professional decision log                 */
/* ------------------------------------------------------------------ */

export const programChanges = sqliteTable("program_changes", {
  id: id(),
  programId: text("program_id").notNull(),
  date: integer("date", { mode: "timestamp" }).notNull(),
  changeType: text("change_type").notNull(),
  description: text("description").notNull(),
  rationale: text("rationale"),
  expectedOutcome: text("expected_outcome"),
  dataToReview: text("data_to_review"),
  recordedByUserId: text("recorded_by_user_id").notNull(),
  createdAt: now(),
});

/* ------------------------------------------------------------------ */
/* Templates (Program Library)                                         */
/* ------------------------------------------------------------------ */

// type: program | task_analysis | measurement | prompt_hierarchy | fidelity_checklist | mastery_rule | generalization_plan
export const templates = sqliteTable("templates", {
  id: id(),
  orgId: text("org_id").notNull(),
  name: text("name").notNull(),
  type: text("type").notNull(),
  description: text("description"),
  payload: text("payload").notNull(), // JSON
  isOrgWide: integer("is_org_wide", { mode: "boolean" }).notNull().default(true),
  createdByUserId: text("created_by_user_id"),
  createdAt: now(),
});

/* ------------------------------------------------------------------ */
/* AI Drafts (heuristic Program Copilot output)                        */
/* ------------------------------------------------------------------ */

// status: pending | approved | edited | rejected
export const aiDrafts = sqliteTable("ai_drafts", {
  id: id(),
  orgId: text("org_id").notNull(),
  programId: text("program_id"),
  type: text("type").notNull(), // e.g. "program_copilot" | "caregiver_translation" | "progress_summary"
  input: text("input").notNull(), // JSON
  output: text("output").notNull(), // JSON
  status: text("status").notNull().default("pending"),
  createdByUserId: text("created_by_user_id").notNull(),
  createdAt: now(),
});

/* ------------------------------------------------------------------ */
/* Audit log                                                            */
/* ------------------------------------------------------------------ */

export const auditLogs = sqliteTable("audit_logs", {
  id: id(),
  orgId: text("org_id").notNull(),
  userId: text("user_id"),
  action: text("action").notNull(),
  entityType: text("entity_type").notNull(),
  entityId: text("entity_id"),
  metadata: text("metadata"), // JSON
  timestamp: integer("timestamp", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

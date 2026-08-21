// Central terminology dictionary. Same data model, different words per workspace.
// This is one of the app's signature ideas: Clinical / Performance / Education / General
// all run on the same engine but never show the "wrong" vocabulary to the wrong audience.

export type WorkspaceType = "clinical" | "performance" | "education" | "general";

export const WORKSPACE_TYPES: { value: WorkspaceType; label: string; blurb: string }[] = [
  { value: "clinical", label: "Clinical", blurb: "ABA practitioners working with clients" },
  { value: "performance", label: "Performance", blurb: "Athletes, coaches, sports performance" },
  { value: "education", label: "Education", blurb: "Teachers and school-based professionals" },
  { value: "general", label: "General Skill Development", blurb: "Caregiver coaching, habits, professional development" },
];

type LabelSet = {
  participant: string; // Client / Athlete / Student / Participant
  participantPlural: string;
  practitioner: string; // BCBA / Coach / Teacher / Practitioner
  implementer: string; // Behavior Technician / Coach / Teacher / Implementer
  caregiver: string; // Caregiver / Parent
  program: string; // Program / Development Goal / Unit
  target: string; // Target / Skill / Technical Sequence
  trial: string; // Trial / Attempt / Rep
  trialPlural: string;
  session: string; // Session / Practice / Training Session
  sessionPlural: string;
  fidelity: string; // Treatment Fidelity / Coaching Fidelity / Implementation Fidelity
  prompt: string; // Prompt / Cue
  reinforcer: string; // Reinforcer / Feedback
  mastery: string; // Mastery / Performance Standard
  generalization: string; // Generalization / Transfer
  maintenance: string; // Maintenance / Retention
  independent: string; // Independent / Unassisted
};

const CLINICAL: LabelSet = {
  participant: "Client",
  participantPlural: "Clients",
  practitioner: "Practitioner",
  implementer: "Technician",
  caregiver: "Caregiver",
  program: "Program",
  target: "Target",
  trial: "Trial",
  trialPlural: "Trials",
  session: "Session",
  sessionPlural: "Sessions",
  fidelity: "Treatment Fidelity",
  prompt: "Prompt",
  reinforcer: "Reinforcer",
  mastery: "Mastery",
  generalization: "Generalization",
  maintenance: "Maintenance",
  independent: "Independent",
};

const PERFORMANCE: LabelSet = {
  participant: "Athlete",
  participantPlural: "Athletes",
  practitioner: "Consultant",
  implementer: "Coach",
  caregiver: "Support Coach",
  program: "Development Goal",
  target: "Skill",
  trial: "Attempt",
  trialPlural: "Attempts",
  session: "Training Session",
  sessionPlural: "Training Sessions",
  fidelity: "Coaching Fidelity",
  prompt: "Cue",
  reinforcer: "Feedback",
  mastery: "Performance Standard",
  generalization: "Transfer",
  maintenance: "Retention",
  independent: "Unassisted",
};

const EDUCATION: LabelSet = {
  participant: "Student",
  participantPlural: "Students",
  practitioner: "Case Manager",
  implementer: "Teacher",
  caregiver: "Family",
  program: "Program",
  target: "Target Skill",
  trial: "Opportunity",
  trialPlural: "Opportunities",
  session: "Session",
  sessionPlural: "Sessions",
  fidelity: "Implementation Fidelity",
  prompt: "Prompt",
  reinforcer: "Reinforcement",
  mastery: "Mastery",
  generalization: "Generalization",
  maintenance: "Maintenance",
  independent: "Independent",
};

const GENERAL: LabelSet = {
  participant: "Participant",
  participantPlural: "Participants",
  practitioner: "Coach",
  implementer: "Implementer",
  caregiver: "Supporter",
  program: "Skill Program",
  target: "Skill",
  trial: "Practice Rep",
  trialPlural: "Practice Reps",
  session: "Session",
  sessionPlural: "Sessions",
  fidelity: "Implementation Fidelity",
  prompt: "Prompt",
  reinforcer: "Feedback",
  mastery: "Mastery",
  generalization: "Transfer",
  maintenance: "Maintenance",
  independent: "Independent",
};

export const LABELS: Record<WorkspaceType, LabelSet> = {
  clinical: CLINICAL,
  performance: PERFORMANCE,
  education: EDUCATION,
  general: GENERAL,
};

export function getLabels(workspaceType: string | null | undefined): LabelSet {
  return LABELS[(workspaceType as WorkspaceType) || "clinical"] ?? CLINICAL;
}

export const JOURNEY_STAGES = [
  { value: "not_started", label: "Not Started" },
  { value: "baseline", label: "Baseline" },
  { value: "acquisition", label: "Acquisition" },
  { value: "improving", label: "Improving" },
  { value: "generalizing", label: "Generalizing" },
  { value: "mastered", label: "Mastered" },
  { value: "maintenance", label: "Maintenance" },
] as const;

export const TRIAL_RESULTS = [
  { value: "independent", label: "Independent" },
  { value: "prompted", label: "Prompted" },
  { value: "incorrect", label: "Incorrect" },
] as const;

export const MEASUREMENT_TYPES = [
  { value: "independent_prompted_incorrect", label: "Independent / Prompted / Incorrect" },
  { value: "correct_incorrect", label: "Correct / Incorrect" },
  { value: "percentage", label: "Percentage Correct" },
  { value: "frequency", label: "Frequency" },
  { value: "rate", label: "Rate" },
  { value: "duration", label: "Duration" },
  { value: "latency", label: "Latency" },
  { value: "task_analysis", label: "Task Analysis Completion" },
  { value: "rating", label: "Rating Scale" },
  { value: "opportunity", label: "Opportunity-Based" },
  { value: "yes_no", label: "Yes / No" },
  { value: "custom", label: "Custom Numeric Metric" },
] as const;

// Plain-language one-liners here specifically for self-directed users building
// their own program without a practitioner in the room to ask — a coach/BCBA
// already knows what "Chaining" means, but someone building their own
// Development Goal for the first time may not. Kept short on purpose (one
// line, no jargon-on-jargon) since these render inline under every checkbox,
// not tucked behind a help toggle.
//
// Worded to hold up whether the reader is teaching someone else OR teaching
// themselves (a self-directed athlete is often both the coach and the
// learner) — avoid "them"/"the person" phrasing that only makes sense from
// an outside teacher's point of view.
//
// `common: true` marks the procedures shown by default in non-clinical
// workspaces (performance / education / general) — the ones a self-directed
// person is most likely to actually need, so the first thing they see isn't
// a wall of 13 checkboxes. The rest sit behind a "Show more" disclosure.
// Clinical workspaces (BCBAs) always see the full list uncurated, since that
// audience already knows the terminology.
export const TEACHING_PROCEDURES: { name: string; description: string; common?: boolean }[] = [
  { name: "Modeling", description: "See it done correctly first — in person or on video — then try it yourself.", common: true },
  { name: "Prompting", description: "Use a cue or hint to help get it right at first, then rely on it less over time.", common: true },
  { name: "Shaping", description: "Reward closer and closer attempts until the full skill is reached." },
  { name: "Chaining", description: "Break the skill into a sequence of steps and link them together one at a time." },
  { name: "Reinforcement", description: "Follow a correct attempt with something rewarding, so it's more likely to happen again.", common: true },
  { name: "Differential Reinforcement", description: "Reward the specific version of the behavior you want more of, not just any attempt." },
  { name: "Practice / Rehearsal", description: "Repeated, deliberate reps of the skill itself.", common: true },
  { name: "Precision Teaching", description: "Track speed and accuracy closely, and let the data guide what changes next." },
  { name: "Error Correction", description: "Correct mistakes immediately and consistently, right when they happen.", common: true },
  { name: "Stimulus Control Procedures", description: "Practice the skill so it reliably happens in response to the right cue, and not others." },
  { name: "Self-Monitoring", description: "Track and reflect on your own performance as part of learning it." },
  { name: "Fading", description: "Gradually remove supports (cues, prompts, assistance) as independence increases." },
  { name: "Generalization Training", description: "Deliberately practice the skill across different settings, people, or conditions so it transfers." },
];

export const GENERALIZATION_DIMENSIONS = [
  "person",
  "setting",
  "equipment",
  "instruction",
  "partner",
  "environment",
  "time",
  "stimulus",
  "training_condition",
  "opponent",
] as const;

export const TRAINING_CONTEXT_TAGS = [
  "Drilling",
  "Positional Sparring",
  "Live Sparring",
  "Competition",
  "Private Lesson",
  "Class",
  "Open Mat",
  "Solo Practice",
];

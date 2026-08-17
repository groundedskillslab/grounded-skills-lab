/* Seed script — builds the cross-domain demo cases described in the
 * product spec (ABA daily living, school transition, BJJ guard recovery,
 * basketball decision-making) so the app visibly proves it is one engine,
 * not separate products — plus a fifth self-directed case (no separate
 * coach) that demonstrates the merged practitioner+learner capability
 * model. Run with: npm run db:seed
 */
import bcrypt from "bcryptjs";
import { db, sqlite } from "./index";
import {
  organizations,
  users,
  participants,
  participantAssignments,
  domains,
  goals,
  programs,
  programSteps,
  targets,
  promptHierarchies,
  masteryRules,
  generalizationDimensions,
  generalizationProbes,
  maintenancePlans,
  maintenanceChecks,
  sessions,
  trialData,
  fidelityProtocols,
  fidelityItems,
  fidelityObservations,
  assignments,
  practiceLogs,
  selfMonitoringEntries,
  contextualTags,
  programChanges,
  templates,
  auditLogs,
} from "./schema";

const DAY = 24 * 60 * 60 * 1000;
const hash = (pw: string) => bcrypt.hashSync(pw, 10);
const daysAgo = (n: number) => new Date(Date.now() - n * DAY);
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const pick = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)];
const jitter = (v: number, spread: number) => v + (Math.random() * 2 - 1) * spread;

function wipe() {
  const tables = [
    "audit_logs", "ai_drafts", "templates", "program_changes", "contextual_tags",
    "self_monitoring_entries", "practice_logs", "assignments", "fidelity_observations",
    "fidelity_items", "fidelity_protocols", "trial_data", "sessions", "maintenance_checks",
    "maintenance_plans", "generalization_probes", "generalization_dimensions", "mastery_rules",
    "prompt_hierarchies", "targets", "program_steps", "programs", "goals", "domains",
    "participant_assignments", "participants", "users", "organizations",
  ];
  for (const t of tables) sqlite.exec(`DELETE FROM ${t};`);
}

async function main() {
  console.log("Wiping existing data...");
  wipe();

  console.log("Creating organization + users...");
  const [org] = await db
    .insert(organizations)
    .values({ name: "Grounded Skills Lab Demo Org" })
    .returning();

  const PASSWORD = "grounded123";

  const userSeed = [
    { key: "dana", name: "Dana Reyes", email: "dana@groundedskillslab.demo", role: "org_admin", title: "Organization Admin" },
    { key: "priya", name: "Priya Shah", email: "priya@groundedskillslab.demo", role: "practitioner", title: "BCBA" },
    { key: "marcus", name: "Marcus Webb", email: "marcus@groundedskillslab.demo", role: "practitioner", title: "Performance Consultant" },
    { key: "jordan", name: "Jordan Lee", email: "jordan@groundedskillslab.demo", role: "implementer", title: "Behavior Technician" },
    { key: "casey", name: "Casey Nguyen", email: "casey@groundedskillslab.demo", role: "implementer", title: "Classroom Teacher" },
    { key: "ade", name: "Coach Ade Okafor", email: "ade@groundedskillslab.demo", role: "implementer", title: "BJJ Coach" },
    { key: "taylor", name: "Coach Taylor Brooks", email: "taylor@groundedskillslab.demo", role: "implementer", title: "Basketball Skills Coach" },
    { key: "sam", name: "Sam Rivera", email: "sam@groundedskillslab.demo", role: "caregiver", title: "Parent" },
    { key: "alexk", name: "Alex Kim", email: "alexk@groundedskillslab.demo", role: "caregiver", title: "Family" },
    { key: "riley", name: "Riley Chen", email: "riley@groundedskillslab.demo", role: "learner", title: "Athlete" },
    { key: "jamie", name: "Jamie Park", email: "jamie@groundedskillslab.demo", role: "learner", title: "Athlete" },
    // Self-directed: trains alone, with no separate coach/practitioner on the case.
    // Global role stays "learner" — practitioner capability is granted per-case via
    // participantAssignments below, scoped to just this person's own participant record.
    { key: "devon", name: "Devon Ortiz", email: "devon@groundedskillslab.demo", role: "learner", title: "Self-Directed Athlete" },
  ] as const;

  const userRows: Record<string, typeof users.$inferSelect> = {};
  for (const u of userSeed) {
    const [row] = await db
      .insert(users)
      .values({ orgId: org.id, name: u.name, email: u.email, passwordHash: hash(PASSWORD), role: u.role, title: u.title })
      .returning();
    userRows[u.key] = row;
  }
  const U = userRows;

  // Shared prompt hierarchies -----------------------------------------
  const [clinicalPH] = await db
    .insert(promptHierarchies)
    .values({
      orgId: org.id,
      name: "Standard ABA Prompt Hierarchy",
      levels: JSON.stringify(["Independent", "Verbal", "Gestural", "Model", "Partial Physical", "Full Physical"]),
      strategy: "least_to_most",
      isTemplate: true,
    })
    .returning();

  const [perfCuePH] = await db
    .insert(promptHierarchies)
    .values({
      orgId: org.id,
      name: "Coaching Cue Hierarchy",
      levels: JSON.stringify(["Unassisted", "Verbal Cue", "Visual Demo", "Physical Guidance"]),
      strategy: "least_to_most",
      isTemplate: true,
    })
    .returning();

  const [eduPH] = await db
    .insert(promptHierarchies)
    .values({
      orgId: org.id,
      name: "Classroom Prompt Hierarchy",
      levels: JSON.stringify(["Independent", "Visual Cue", "Verbal Reminder", "Gestural", "Direct Instruction"]),
      strategy: "least_to_most",
      isTemplate: true,
    })
    .returning();

  await db.insert(contextualTags).values([
    { orgId: org.id, label: "Home", category: "setting" },
    { orgId: org.id, label: "School", category: "setting" },
    { orgId: org.id, label: "Community", category: "setting" },
    { orgId: org.id, label: "Fatigue", category: "barrier" },
    { orgId: org.id, label: "New Environment", category: "barrier" },
    { orgId: org.id, label: "Distraction", category: "barrier" },
    { orgId: org.id, label: "Schedule Disruption", category: "barrier" },
    { orgId: org.id, label: "Drilling", category: "training_context" },
    { orgId: org.id, label: "Positional Sparring", category: "training_context" },
    { orgId: org.id, label: "Live Sparring", category: "training_context" },
    { orgId: org.id, label: "Competition", category: "training_context" },
    { orgId: org.id, label: "Shooting Drill", category: "training_context" },
    { orgId: org.id, label: "Scrimmage", category: "training_context" },
    { orgId: org.id, label: "Game Simulation", category: "training_context" },
  ]);

  /* ================================================================ */
  /* DEMO 1 — ABA: Independent Tooth Brushing                          */
  /* ================================================================ */
  console.log("Seeding Demo 1 (ABA)...");
  const [p1] = await db
    .insert(participants)
    .values({
      orgId: org.id, displayName: "M.T.", participantCode: "CL-1042", workspaceType: "clinical",
      primaryPractitionerId: U.priya.id,
    })
    .returning();

  await db.insert(participantAssignments).values([
    { participantId: p1.id, userId: U.priya.id, roleOnCase: "practitioner" },
    { participantId: p1.id, userId: U.jordan.id, roleOnCase: "implementer" },
    { participantId: p1.id, userId: U.sam.id, roleOnCase: "caregiver" },
  ]);

  const [d1] = await db.insert(domains).values({ participantId: p1.id, name: "Daily Living Skills", description: "Independence in self-care routines." }).returning();
  const [g1] = await db.insert(goals).values({
    domainId: d1.id, participantId: p1.id, title: "Independent Tooth Brushing",
    broadGoal: "Independently prepare a simple meal.".replace("prepare a simple meal", "brush teeth without adult assistance"),
    successDescription: "M.T. completes the full tooth-brushing routine independently, without physical or verbal prompts, in the home bathroom and other settings.",
    status: "active",
  }).returning();

  const [prog1] = await db.insert(programs).values({
    goalId: g1.id, participantId: p1.id, name: "Tooth Brushing Routine",
    operationalDefinition: "M.T. obtains a toothbrush, applies toothpaste, brushes upper and lower teeth for at least 30 seconds combined, rinses, and returns materials to their storage location, within 5 minutes of the instruction 'time to brush your teeth,' without physical guidance.",
    rationale: "Independent hygiene routines reduce caregiver burden and support school-readiness and peer-typical morning routines.",
    prerequisites: "Can hold a toothbrush; tolerates toothpaste taste/texture; follows 1-step instructions.",
    teachingProcedures: JSON.stringify(["Chaining", "Prompting", "Fading", "Reinforcement", "Error Correction"]),
    teachingProcedureNotes: "Forward chaining with a graduated guidance prompt fading plan across the 6-step task analysis.",
    promptHierarchyId: clinicalPH.id,
    caregiverSummary: "Ask them to begin the tooth brushing routine. Give them a few seconds to try each step independently. Help only as much as necessary, starting with a reminder before touching their hands. Praise independent attempts right away.",
    coachSummary: null,
    journeyStage: "maintenance",
    masteredAt: daysAgo(18),
    createdByUserId: U.priya.id,
  }).returning();

  const steps1 = ["Obtain toothbrush", "Apply toothpaste", "Brush upper teeth", "Brush lower teeth", "Rinse", "Put materials away"];
  const stepRows1: typeof programSteps.$inferSelect[] = [];
  for (let i = 0; i < steps1.length; i++) {
    const [row] = await db.insert(programSteps).values({
      programId: prog1.id, orderIndex: i, text: steps1[i], isCritical: i === 2 || i === 3, groupLabel: "Core Routine",
    }).returning();
    stepRows1.push(row);
  }

  const [target1] = await db.insert(targets).values({
    programId: prog1.id, name: "Tooth Brushing — Full Task Analysis", description: "6-step chained routine.",
    orderIndex: 0, measurementType: "task_analysis", promptHierarchyId: clinicalPH.id,
  }).returning();

  const [mastery1] = await db.insert(masteryRules).values({
    targetId: target1.id, programId: prog1.id,
    description: "All 6 steps completed independently across 2 consecutive sessions.",
    criteria: JSON.stringify({ type: "task_analysis_independent", consecutiveSessions: 2 }),
    autoDetectedAt: daysAgo(19), confirmedByUserId: U.priya.id, confirmedAt: daysAgo(18),
  }).returning();

  // 14 sessions over ~11 weeks: full physical -> independent, then maintenance checks
  const PROMPT_LEVELS = ["Full Physical", "Partial Physical", "Model", "Gestural", "Verbal", "Independent"];
  const totalSessions1 = 14;
  for (let s = 0; s < totalSessions1; s++) {
    const daysBack = (totalSessions1 - s) * 5 + 3;
    const conductor = s % 4 === 3 ? U.sam.id : U.jordan.id; // occasional caregiver-run session
    const [sess] = await db.insert(sessions).values({
      participantId: p1.id, programId: prog1.id, conductedByUserId: conductor,
      date: daysAgo(daysBack), durationMinutes: 8, contextTags: JSON.stringify(["Home", conductor === U.sam.id ? "Caregiver-Run" : "Clinic-Run"]),
      notes: s === totalSessions1 - 1 ? "Full independence maintained; moved to maintenance schedule." : undefined,
    }).returning();

    // prompt level improves with session index — ramps up faster than linear so the
    // last several sessions show real (not just final-session) independence, matching
    // the "2 consecutive independent sessions" mastery rule below.
    const progressFrac = s / (totalSessions1 - 1);
    const levelIndex = clamp(Math.round(progressFrac * 1.45 * (PROMPT_LEVELS.length - 1) + jitter(0, 0.45)), 0, PROMPT_LEVELS.length - 1);
    const stepResults = stepRows1.map((step, i) => {
      const stepLevelIndex = clamp(levelIndex + (i === 2 || i === 3 ? -1 : 0) + Math.round(jitter(0, 0.5)), 0, PROMPT_LEVELS.length - 1);
      const result = stepLevelIndex >= PROMPT_LEVELS.length - 1 ? "independent" : "prompted";
      return { stepId: step.id, result, promptLevel: PROMPT_LEVELS[stepLevelIndex] };
    });
    const overallIndependent = stepResults.every((r) => r.result === "independent");
    await db.insert(trialData).values({
      sessionId: sess.id, targetId: target1.id, timestamp: daysAgo(daysBack), result: overallIndependent ? "independent" : "prompted",
      promptLevel: PROMPT_LEVELS[levelIndex], stepResults: JSON.stringify(stepResults),
      recordedByUserId: conductor,
    });
  }

  // Fidelity protocol + observations
  const [fp1] = await db.insert(fidelityProtocols).values({ programId: prog1.id, name: "Tooth Brushing Teaching Fidelity" }).returning();
  const fidelitySteps1 = [
    "Gain learner attention before starting", "Present the instruction clearly ('time to brush your teeth')",
    "Wait the specified response interval (5 seconds) before prompting", "Provide the prompt level specified in the plan",
    "Deliver reinforcement immediately following independent or successfully prompted steps", "Record the response for each step",
    "Follow the error-correction procedure if a step is missed",
  ];
  const fidelityItemRows1: typeof fidelityItems.$inferSelect[] = [];
  for (let i = 0; i < fidelitySteps1.length; i++) {
    const [row] = await db.insert(fidelityItems).values({ protocolId: fp1.id, orderIndex: i, text: fidelitySteps1[i] }).returning();
    fidelityItemRows1.push(row);
  }
  for (let s = 0; s < 8; s++) {
    const daysBack = (8 - s) * 8 + 4;
    const scores: Record<string, string> = {};
    let correct = 0;
    for (const item of fidelityItemRows1) {
      const ok = Math.random() < clamp(0.75 + s * 0.03, 0.5, 0.98);
      scores[item.id] = ok ? "correct" : "incorrect";
      if (ok) correct++;
    }
    const pct = (correct / fidelityItemRows1.length) * 100;
    await db.insert(fidelityObservations).values({
      protocolId: fp1.id, participantId: p1.id, programId: prog1.id, observedUserId: U.jordan.id,
      observerUserId: U.priya.id, date: daysAgo(daysBack), scores: JSON.stringify(scores), fidelityPercent: pct,
      notes: pct < 80 ? "Reviewed reinforcement timing with implementer." : undefined,
    });
  }

  // Generalization
  const [gd1a] = await db.insert(generalizationDimensions).values({ programId: prog1.id, dimensionType: "person", label: "Caregiver (Sam)" }).returning();
  const [gd1b] = await db.insert(generalizationDimensions).values({ programId: prog1.id, dimensionType: "setting", label: "Grandparents' house" }).returning();
  const [gd1c] = await db.insert(generalizationDimensions).values({ programId: prog1.id, dimensionType: "time", label: "Evening routine (vs. morning-trained)" }).returning();
  await db.insert(generalizationProbes).values([
    { dimensionId: gd1a.id, targetId: target1.id, programId: prog1.id, date: daysAgo(20), result: "met", context: "Home bathroom, evening", recordedByUserId: U.priya.id },
    { dimensionId: gd1b.id, targetId: target1.id, programId: prog1.id, date: daysAgo(14), result: "partial", context: "Needed 1 gestural prompt for 'put materials away'", recordedByUserId: U.priya.id },
    { dimensionId: gd1c.id, targetId: target1.id, programId: prog1.id, date: daysAgo(10), result: "met", context: "Evening routine", recordedByUserId: U.priya.id },
  ]);

  // Maintenance
  const [mp1] = await db.insert(maintenancePlans).values({ programId: prog1.id, schedule: JSON.stringify(["1_week", "2_week", "1_month"]) }).returning();
  await db.insert(maintenanceChecks).values([
    { maintenancePlanId: mp1.id, label: "1 week", dueDate: daysAgo(11), completedDate: daysAgo(11), result: "stable", performanceValue: 100, recordedByUserId: U.priya.id },
    { maintenancePlanId: mp1.id, label: "2 weeks", dueDate: daysAgo(4), completedDate: daysAgo(4), result: "stable", performanceValue: 100, recordedByUserId: U.priya.id },
    { maintenancePlanId: mp1.id, label: "1 month", dueDate: daysAgo(-14), result: "not_yet_checked" },
  ]);

  // Assignment + practice logs (caregiver)
  const [asn1] = await db.insert(assignments).values({
    participantId: p1.id, programId: prog1.id, title: "Practice tooth brushing routine each evening",
    instructions: "Follow the caregiver steps. Praise independent attempts. Note anything that got in the way.",
    frequency: "Once each evening", assignedByUserId: U.priya.id, assignedToUserId: U.sam.id, dueDate: daysAgo(-30), status: "started",
  }).returning();
  for (let i = 0; i < 10; i++) {
    const daysBack = i * 3 + 1;
    const result = pick(["successful", "successful", "successful", "needed_help", "successful"]);
    await db.insert(practiceLogs).values({
      assignmentId: asn1.id, participantId: p1.id, programId: prog1.id, targetId: target1.id, date: daysAgo(daysBack),
      loggedByUserId: U.sam.id, result, contextTags: JSON.stringify(["Home"]),
      notes: result === "needed_help" ? "Was tired before bed, needed a reminder to rinse." : undefined,
    });
  }

  await db.insert(programChanges).values({
    programId: prog1.id, date: daysAgo(45), changeType: "Changed prompt strategy",
    description: "Shifted from full physical guidance to partial physical / model for steps 3 and 4 after 4 sessions of consistent step 1-2 independence.",
    rationale: "Step-level data showed steps 1-2 were independent while 3-4 remained prompt-dependent; reducing prompt level tests readiness.",
    expectedOutcome: "Gradual increase in independent completion of steps 3-4 without loss of accuracy.",
    dataToReview: "Prompt level per step across next 4 sessions.", recordedByUserId: U.priya.id,
  });

  /* ================================================================ */
  /* DEMO 2 — School: Independent Classroom Transitions                */
  /* ================================================================ */
  console.log("Seeding Demo 2 (School)...");
  const [p2] = await db.insert(participants).values({
    orgId: org.id, displayName: "R.K.", participantCode: "ED-0231", workspaceType: "education", primaryPractitionerId: U.priya.id,
  }).returning();
  await db.insert(participantAssignments).values([
    { participantId: p2.id, userId: U.priya.id, roleOnCase: "practitioner" },
    { participantId: p2.id, userId: U.casey.id, roleOnCase: "implementer" },
    { participantId: p2.id, userId: U.alexk.id, roleOnCase: "caregiver" },
  ]);
  const [d2] = await db.insert(domains).values({ participantId: p2.id, name: "Classroom Behavior", description: "Independence during routine transitions." }).returning();
  const [g2] = await db.insert(goals).values({
    domainId: d2.id, participantId: p2.id, title: "Independent Classroom Transitions",
    broadGoal: "Improve transition behavior between classroom activities.",
    successDescription: "R.K. moves from one scheduled activity to the next within 60 seconds of the transition cue, without staff redirection, across settings.",
    status: "active",
  }).returning();
  const [prog2] = await db.insert(programs).values({
    goalId: g2.id, participantId: p2.id, name: "Transition Independence",
    operationalDefinition: "Within 60 seconds of the transition cue (visual timer + verbal 'time to switch'), R.K. stops the current activity, gathers needed materials, and arrives at the next scheduled location without staff physically guiding or repeating the instruction more than once.",
    rationale: "Reduces instructional time lost to transitions and supports inclusion in general-education pacing.",
    prerequisites: "Responds to name; follows 1-step group instructions.",
    teachingProcedures: JSON.stringify(["Prompting", "Visual Supports (Stimulus Control)", "Differential Reinforcement", "Fading"]),
    teachingProcedureNotes: "Visual timer + first/then board, prompt faded from gestural to independent.",
    promptHierarchyId: eduPH.id,
    caregiverSummary: "At home, give a 2-minute warning before switching activities, then a clear 'time to switch' cue. Let them try on their own first. Praise switching without reminders.",
    coachSummary: null,
    journeyStage: "generalizing",
    createdByUserId: U.priya.id,
  }).returning();

  const [target2] = await db.insert(targets).values({
    programId: prog2.id, name: "Transition Opportunities", description: "Each scheduled transition is one opportunity.",
    orderIndex: 0, measurementType: "opportunity", promptHierarchyId: eduPH.id,
  }).returning();
  await db.insert(masteryRules).values({
    targetId: target2.id, programId: prog2.id,
    description: "90% independent across 2 implementers (classroom + specials staff).",
    criteria: JSON.stringify({ type: "independent_across_implementers", threshold: 90, implementerCount: 2 }),
  });

  const staffPool = [U.casey.id, U.priya.id];
  const settingPool = ["Classroom", "Cafeteria", "Gym / Specials"];
  const totalSessions2 = 16;
  for (let s = 0; s < totalSessions2; s++) {
    const daysBack = (totalSessions2 - s) * 3 + 2;
    const staff = staffPool[s % staffPool.length];
    const setting = settingPool[s % settingPool.length];
    const [sess] = await db.insert(sessions).values({
      participantId: p2.id, programId: prog2.id, conductedByUserId: staff, date: daysAgo(daysBack),
      durationMinutes: 20, contextTags: JSON.stringify([setting]),
    }).returning();
    const opportunities = 4 + Math.round(Math.random() * 2);
    const progressFrac = s / (totalSessions2 - 1);
    const independentProb = clamp(0.15 + progressFrac * 0.55 + jitter(0, 0.06), 0.1, 0.85);
    const promptedGivenNotIndependent = 0.55;
    for (let o = 0; o < opportunities; o++) {
      const roll = Math.random();
      const result = roll < independentProb ? "independent" : roll < independentProb + (1 - independentProb) * promptedGivenNotIndependent ? "prompted" : "incorrect";
      await db.insert(trialData).values({
        sessionId: sess.id, targetId: target2.id, timestamp: daysAgo(daysBack), result,
        promptLevel: result === "prompted" ? pick(["Visual Cue", "Verbal Reminder", "Gestural"]) : result === "independent" ? "Independent" : undefined,
        recordedByUserId: staff,
      });
    }
  }

  const [fp2] = await db.insert(fidelityProtocols).values({ programId: prog2.id, name: "Transition Support Fidelity" }).returning();
  const fidelitySteps2 = ["Visual timer set at start of preceding activity", "2-minute warning delivered", "Clear transition cue given once", "Prompt matched to plan (not over-prompted)", "Reinforcement delivered for independent transition", "Data recorded same-day"];
  const fidelityItemRows2: typeof fidelityItems.$inferSelect[] = [];
  for (let i = 0; i < fidelitySteps2.length; i++) {
    const [row] = await db.insert(fidelityItems).values({ protocolId: fp2.id, orderIndex: i, text: fidelitySteps2[i] }).returning();
    fidelityItemRows2.push(row);
  }
  for (let s = 0; s < 6; s++) {
    const daysBack = (6 - s) * 7 + 3;
    const scores: Record<string, string> = {};
    let correct = 0;
    for (const item of fidelityItemRows2) {
      const ok = Math.random() < 0.85;
      scores[item.id] = ok ? "correct" : "incorrect";
      if (ok) correct++;
    }
    await db.insert(fidelityObservations).values({
      protocolId: fp2.id, participantId: p2.id, programId: prog2.id, observedUserId: U.casey.id, observerUserId: U.priya.id,
      date: daysAgo(daysBack), scores: JSON.stringify(scores), fidelityPercent: (correct / fidelityItemRows2.length) * 100,
    });
  }

  const [gd2a] = await db.insert(generalizationDimensions).values({ programId: prog2.id, dimensionType: "setting", label: "Cafeteria" }).returning();
  const [gd2b] = await db.insert(generalizationDimensions).values({ programId: prog2.id, dimensionType: "setting", label: "Gym / Specials" }).returning();
  const [gd2c] = await db.insert(generalizationDimensions).values({ programId: prog2.id, dimensionType: "person", label: "Substitute staff" }).returning();
  await db.insert(generalizationProbes).values([
    { dimensionId: gd2a.id, targetId: target2.id, programId: prog2.id, date: daysAgo(9), result: "met", context: "Lunch transition", recordedByUserId: U.priya.id },
    { dimensionId: gd2b.id, targetId: target2.id, programId: prog2.id, date: daysAgo(7), result: "partial", context: "Needed 1 gestural prompt", recordedByUserId: U.priya.id },
    { dimensionId: gd2c.id, targetId: target2.id, programId: prog2.id, date: daysAgo(3), result: "not_met", context: "Sub unfamiliar with visual timer system", recordedByUserId: U.priya.id },
  ]);

  const [asn2] = await db.insert(assignments).values({
    participantId: p2.id, programId: prog2.id, title: "Run three transition practices during the school day",
    instructions: "Use the visual timer + 2-minute warning. Note which setting and how much prompting was needed.",
    frequency: "3x per school day", assignedByUserId: U.priya.id, assignedToUserId: U.casey.id, dueDate: daysAgo(-14), status: "started",
  }).returning();
  for (let i = 0; i < 6; i++) {
    await db.insert(practiceLogs).values({
      assignmentId: asn2.id, participantId: p2.id, programId: prog2.id, targetId: target2.id, date: daysAgo(i * 2 + 1),
      loggedByUserId: U.casey.id, result: pick(["successful", "successful", "needed_help"]), contextTags: JSON.stringify([pick(settingPool)]),
    });
  }

  /* ================================================================ */
  /* DEMO 3 — BJJ: Side-Control Guard Recovery                         */
  /* ================================================================ */
  console.log("Seeding Demo 3 (BJJ)...");
  const [p3] = await db.insert(participants).values({
    orgId: org.id, displayName: "Riley Chen", participantCode: "PF-0087", workspaceType: "performance", primaryPractitionerId: U.marcus.id,
  }).returning();
  await db.insert(participantAssignments).values([
    { participantId: p3.id, userId: U.marcus.id, roleOnCase: "practitioner" },
    { participantId: p3.id, userId: U.ade.id, roleOnCase: "implementer" },
    { participantId: p3.id, userId: U.riley.id, roleOnCase: "learner" },
  ]);
  const [d3] = await db.insert(domains).values({ participantId: p3.id, name: "Guard Retention", description: "Recovering guard position under pressure." }).returning();
  const [g3] = await db.insert(goals).values({
    domainId: d3.id, participantId: p3.id, title: "Improve Guard Retention",
    broadGoal: "Improve guard retention.",
    successDescription: "Riley recovers a functional guard from bottom side-control against resisting partners across drilling, positional sparring, and live rolling.",
    status: "active",
  }).returning();
  const [prog3] = await db.insert(programs).values({
    goalId: g3.id, participantId: p3.id, name: "Knee-Elbow Recovery",
    operationalDefinition: "From bottom side-control, Riley establishes a frame, creates a hip angle away from pressure, connects near-side knee to elbow, inserts the knee, and recovers a guard (open or half) within 15 seconds, without the partner passing to a dominant pin.",
    rationale: "Guard recovery is a prerequisite for offense from the bottom and a core defensive competency at every belt level.",
    prerequisites: "Basic bridging and shrimping mechanics.",
    teachingProcedures: JSON.stringify(["Modeling", "Chaining", "Practice / Rehearsal", "Differential Reinforcement", "Generalization Training"]),
    teachingProcedureNotes: "Taught as a 5-step chain, drilled positionally before adding resistance.",
    promptHierarchyId: perfCuePH.id,
    coachSummary: "Start from bottom side control. Let Riley attempt the sequence without coaching first. Add the agreed verbal cue only if Riley stalls for more than 3 seconds. Track whether the guard was recovered and how much cueing was needed.",
    caregiverSummary: null,
    journeyStage: "improving",
    createdByUserId: U.marcus.id,
  }).returning();

  const steps3 = ["Establish frame", "Create hip angle", "Connect knee and elbow", "Insert knee", "Recover guard"];
  const stepRows3: typeof programSteps.$inferSelect[] = [];
  for (let i = 0; i < steps3.length; i++) {
    const [row] = await db.insert(programSteps).values({ programId: prog3.id, orderIndex: i, text: steps3[i], isCritical: true, groupLabel: "Technical Sequence" }).returning();
    stepRows3.push(row);
  }
  const [target3] = await db.insert(targets).values({
    programId: prog3.id, name: "Guard Recovery Attempt", description: "One attempt = one side-control escape opportunity.",
    orderIndex: 0, measurementType: "independent_prompted_incorrect", unitLabel: "attempt", promptHierarchyId: perfCuePH.id,
  }).returning();
  await db.insert(masteryRules).values({
    targetId: target3.id, programId: prog3.id,
    description: "10 unassisted successful recoveries across 2 training contexts (drilling + live).",
    criteria: JSON.stringify({ type: "trials_across_environments", correctCount: 10, environmentCount: 2 }),
  });

  const contexts3 = ["Drilling", "Positional Sparring", "Live Sparring"];
  const partners3 = ["Coach Ade", "Teammate A", "Teammate B", "Open Mat Partner"];
  const contextSuccessBase: Record<string, number> = { Drilling: 0.4, "Positional Sparring": 0.28, "Live Sparring": 0.14 };
  const totalSessions3 = 18;
  for (let s = 0; s < totalSessions3; s++) {
    const daysBack = (totalSessions3 - s) * 4 + 2;
    const context = contexts3[s % contexts3.length];
    const partner = pick(partners3);
    const [sess] = await db.insert(sessions).values({
      participantId: p3.id, programId: prog3.id, conductedByUserId: U.ade.id, date: daysAgo(daysBack),
      durationMinutes: 45, contextTags: JSON.stringify([context, partner]),
    }).returning();
    const progressFrac = s / (totalSessions3 - 1);
    const base = contextSuccessBase[context];
    const independentProb = clamp(base + progressFrac * 0.35 + jitter(0, 0.05), 0.08, 0.75);
    const promptedGivenNotIndependent = 0.45;
    const attempts = 5 + Math.round(Math.random() * 4);
    for (let a = 0; a < attempts; a++) {
      const roll = Math.random();
      const result = roll < independentProb ? "independent" : roll < independentProb + (1 - independentProb) * promptedGivenNotIndependent ? "prompted" : "incorrect";
      const t = daysAgo(daysBack);
      const stepResults = stepRows3.map((step) => ({
        stepId: step.id,
        result: Math.random() < independentProb + 0.08 ? "independent" : Math.random() < 0.7 ? "prompted" : "incorrect",
      }));
      await db.insert(trialData).values({
        sessionId: sess.id, targetId: target3.id, timestamp: t, result,
        promptLevel: result === "prompted" ? pick(["Verbal Cue", "Visual Demo"]) : result === "independent" ? "Unassisted" : undefined,
        stepResults: JSON.stringify(stepResults), recordedByUserId: U.ade.id,
      });
    }
  }

  const [fp3] = await db.insert(fidelityProtocols).values({ programId: prog3.id, name: "Technical Sequence Coaching Fidelity" }).returning();
  const fidelitySteps3 = ["Did the athlete establish frame before other movement?", "Was elbow position maintained through the sequence?", "Was hip angle created before knee insertion?", "Was the knee inserted before extending to recover guard?", "Was cueing limited to the agreed hierarchy (no over-coaching)?"];
  const fidelityItemRows3: typeof fidelityItems.$inferSelect[] = [];
  for (let i = 0; i < fidelitySteps3.length; i++) {
    const [row] = await db.insert(fidelityItems).values({ protocolId: fp3.id, orderIndex: i, text: fidelitySteps3[i] }).returning();
    fidelityItemRows3.push(row);
  }
  for (let s = 0; s < 10; s++) {
    const daysBack = (10 - s) * 6 + 2;
    const scores: Record<string, string> = {};
    let correct = 0;
    for (const item of fidelityItemRows3) {
      const ok = Math.random() < clamp(0.7 + s * 0.02, 0.5, 0.97);
      scores[item.id] = ok ? "correct" : "incorrect";
      if (ok) correct++;
    }
    await db.insert(fidelityObservations).values({
      protocolId: fp3.id, participantId: p3.id, programId: prog3.id, observedUserId: U.ade.id, observerUserId: U.marcus.id,
      date: daysAgo(daysBack), scores: JSON.stringify(scores), fidelityPercent: (correct / fidelityItemRows3.length) * 100,
    });
  }

  const [gd3a] = await db.insert(generalizationDimensions).values({ programId: prog3.id, dimensionType: "partner", label: "New training partner" }).returning();
  const [gd3b] = await db.insert(generalizationDimensions).values({ programId: prog3.id, dimensionType: "training_condition", label: "Live resistance" }).returning();
  const [gd3c] = await db.insert(generalizationDimensions).values({ programId: prog3.id, dimensionType: "training_condition", label: "Competition simulation" }).returning();
  await db.insert(generalizationProbes).values([
    { dimensionId: gd3a.id, targetId: target3.id, programId: prog3.id, date: daysAgo(12), result: "met", context: "Recovered guard vs. two new partners", recordedByUserId: U.marcus.id },
    { dimensionId: gd3b.id, targetId: target3.id, programId: prog3.id, date: daysAgo(8), result: "partial", context: "Successful ~40% under full resistance", recordedByUserId: U.marcus.id },
    { dimensionId: gd3c.id, targetId: target3.id, programId: prog3.id, date: daysAgo(2), result: "not_met", context: "Not yet probed under simulated competition pressure/time limits", recordedByUserId: U.marcus.id },
  ]);

  // self monitoring (athlete logs own drilling reps)
  for (let i = 0; i < 20; i++) {
    await db.insert(selfMonitoringEntries).values({
      participantId: p3.id, programId: prog3.id, date: daysAgo(i), completed: Math.random() < 0.75,
      value: Math.round(jitter(15, 6)), notes: undefined,
    });
  }
  const [asn3] = await db.insert(assignments).values({
    participantId: p3.id, programId: prog3.id, title: "Practice 10 guard-recovery repetitions before Thursday",
    instructions: "Drill the 5-step sequence slowly and correctly before adding speed.", frequency: "10 reps, 3x this week",
    assignedByUserId: U.marcus.id, assignedToUserId: U.riley.id, dueDate: daysAgo(-2), status: "completed",
  }).returning();
  await db.insert(practiceLogs).values([
    { assignmentId: asn3.id, participantId: p3.id, programId: prog3.id, targetId: target3.id, date: daysAgo(6), loggedByUserId: U.riley.id, result: "successful", contextTags: JSON.stringify(["Solo Practice"]), confidenceRating: 7, effortRating: 6 },
    { assignmentId: asn3.id, participantId: p3.id, programId: prog3.id, targetId: target3.id, date: daysAgo(4), loggedByUserId: U.riley.id, result: "successful", contextTags: JSON.stringify(["Solo Practice"]), confidenceRating: 8, effortRating: 6 },
    { assignmentId: asn3.id, participantId: p3.id, programId: prog3.id, targetId: target3.id, date: daysAgo(2), loggedByUserId: U.riley.id, result: "needed_help", barrierNote: "Partner used more resistance than expected.", contextTags: JSON.stringify(["Positional Sparring"]), confidenceRating: 5, effortRating: 8 },
  ]);

  await db.insert(programChanges).values({
    programId: prog3.id, date: daysAgo(24), changeType: "Increased resistance", description: "Introduced 50% resistance during positional sparring reps after drilling success exceeded 70%.",
    rationale: "Drilling success plateaued near ceiling; resistance needed to test whether the sequence holds under pressure.",
    expectedOutcome: "Temporary dip in success rate during positional sparring, followed by recovery as the sequence becomes more automatic.",
    dataToReview: "Success rate by training context over the next 6 sessions.", recordedByUserId: U.marcus.id,
  });

  /* ================================================================ */
  /* DEMO 4 — Basketball: Catch-to-Shot Decision Making                */
  /* ================================================================ */
  console.log("Seeding Demo 4 (Basketball)...");
  const [p4] = await db.insert(participants).values({
    orgId: org.id, displayName: "Jamie Park", participantCode: "PF-0142", workspaceType: "performance", primaryPractitionerId: U.marcus.id,
  }).returning();
  await db.insert(participantAssignments).values([
    { participantId: p4.id, userId: U.marcus.id, roleOnCase: "practitioner" },
    { participantId: p4.id, userId: U.taylor.id, roleOnCase: "implementer" },
    { participantId: p4.id, userId: U.jamie.id, roleOnCase: "learner" },
  ]);
  const [d4] = await db.insert(domains).values({ participantId: p4.id, name: "Shot Decision Making", description: "Reading the defense on the catch." }).returning();
  const [g4] = await db.insert(goals).values({
    domainId: d4.id, participantId: p4.id, title: "Improve Catch-to-Shot Decision Making",
    broadGoal: "Improve catch-to-shot decision making.",
    successDescription: "Jamie makes the correct read (shoot / drive / pass) within 0.8 seconds of the catch, across shooting drills, scrimmages, and game simulation, without a coaching cue.",
    status: "active",
  }).returning();
  const [prog4] = await db.insert(programs).values({
    goalId: g4.id, participantId: p4.id, name: "Catch-to-Shot Reads",
    operationalDefinition: "On receiving a pass in a scoring position, Jamie identifies defender closeout speed and help-defense position within 0.8 seconds and selects the correct read (shoot / drive / pass), executing the read within 1.5 seconds of the catch.",
    rationale: "Fast, correct reads increase possession efficiency and are a foundational skill above raw shooting mechanics.",
    prerequisites: "Consistent catch-and-shoot mechanics off the pass.",
    teachingProcedures: JSON.stringify(["Modeling", "Practice / Rehearsal", "Differential Reinforcement", "Precision Teaching", "Generalization Training"]),
    teachingProcedureNotes: "Reads taught via closeout-speed drills, progressing from shooting drill to scrimmage to game simulation.",
    promptHierarchyId: perfCuePH.id,
    coachSummary: "Feed the pass and let Jamie read the defender without coaching first. Add the agreed cue only if Jamie hesitates past 2 seconds or asks for help. Record the read, whether it was correct, and how the shot/drive/pass turned out.",
    caregiverSummary: null,
    journeyStage: "acquisition",
    createdByUserId: U.marcus.id,
  }).returning();

  const [target4] = await db.insert(targets).values({
    programId: prog4.id, name: "Catch-to-Shot Read", description: "One target = one catch in a scoring-decision situation.",
    orderIndex: 0, measurementType: "rating", unitLabel: "decision quality (1-5)", promptHierarchyId: perfCuePH.id,
  }).returning();
  await db.insert(masteryRules).values({
    targetId: target4.id, programId: prog4.id,
    description: "80% correct reads across 3 consecutive training sessions, including at least one scrimmage/game-simulation session.",
    criteria: JSON.stringify({ type: "percentage_consecutive", threshold: 80, consecutiveSessions: 3 }),
  });

  const contexts4 = ["Shooting Drill", "Scrimmage", "Game Simulation"];
  const contextSuccessBase4: Record<string, number> = { "Shooting Drill": 0.5, Scrimmage: 0.38, "Game Simulation": 0.3 };
  const totalSessions4 = 15;
  for (let s = 0; s < totalSessions4; s++) {
    const daysBack = (totalSessions4 - s) * 4 + 1;
    const context = contexts4[s % contexts4.length];
    const [sess] = await db.insert(sessions).values({
      participantId: p4.id, programId: prog4.id, conductedByUserId: U.taylor.id, date: daysAgo(daysBack),
      durationMinutes: 40, contextTags: JSON.stringify([context]),
    }).returning();
    const progressFrac = s / (totalSessions4 - 1);
    const base = contextSuccessBase4[context];
    const successProb = clamp(base + progressFrac * 0.4 + jitter(0, 0.06), 0.15, 0.93);
    const reps = 8 + Math.round(Math.random() * 6);
    for (let r = 0; r < reps; r++) {
      const roll = Math.random();
      const correct = roll < successProb;
      const result = correct ? "correct" : Math.random() < 0.5 ? "prompted" : "incorrect";
      const latencyMs = Math.round(jitter(correct ? 650 : 1100, 200));
      await db.insert(trialData).values({
        sessionId: sess.id, targetId: target4.id, timestamp: daysAgo(daysBack), result,
        promptLevel: result === "prompted" ? "Verbal Cue" : correct ? "Unassisted" : undefined,
        value: latencyMs, notes: undefined, recordedByUserId: U.taylor.id,
      });
    }
  }

  const [fp4] = await db.insert(fidelityProtocols).values({ programId: prog4.id, name: "Read-Drill Coaching Fidelity" }).returning();
  const fidelitySteps4 = ["Closeout speed/angle varied per plan before the pass", "Pass delivered on time and on target", "Coach withheld cue until agreed hesitation threshold", "Correct/incorrect read recorded immediately", "Feedback delivered after the rep, not during"];
  const fidelityItemRows4: typeof fidelityItems.$inferSelect[] = [];
  for (let i = 0; i < fidelitySteps4.length; i++) {
    const [row] = await db.insert(fidelityItems).values({ protocolId: fp4.id, orderIndex: i, text: fidelitySteps4[i] }).returning();
    fidelityItemRows4.push(row);
  }
  for (let s = 0; s < 8; s++) {
    const daysBack = (8 - s) * 6 + 1;
    const scores: Record<string, string> = {};
    let correct = 0;
    for (const item of fidelityItemRows4) {
      const ok = Math.random() < 0.82;
      scores[item.id] = ok ? "correct" : "incorrect";
      if (ok) correct++;
    }
    await db.insert(fidelityObservations).values({
      protocolId: fp4.id, participantId: p4.id, programId: prog4.id, observedUserId: U.taylor.id, observerUserId: U.marcus.id,
      date: daysAgo(daysBack), scores: JSON.stringify(scores), fidelityPercent: (correct / fidelityItemRows4.length) * 100,
    });
  }

  const [gd4a] = await db.insert(generalizationDimensions).values({ programId: prog4.id, dimensionType: "opponent", label: "Length/athleticism of defender" }).returning();
  const [gd4b] = await db.insert(generalizationDimensions).values({ programId: prog4.id, dimensionType: "training_condition", label: "Game Simulation (shot clock, score pressure)" }).returning();
  await db.insert(generalizationProbes).values([
    { dimensionId: gd4a.id, targetId: target4.id, programId: prog4.id, date: daysAgo(9), result: "partial", context: "Longer defenders forced later/rushed reads", recordedByUserId: U.marcus.id },
    { dimensionId: gd4b.id, targetId: target4.id, programId: prog4.id, date: daysAgo(3), result: "not_met", context: "Correct-read rate dropped under simulated shot-clock pressure", recordedByUserId: U.marcus.id },
  ]);

  for (let i = 0; i < 18; i++) {
    await db.insert(selfMonitoringEntries).values({
      participantId: p4.id, programId: prog4.id, date: daysAgo(i), completed: Math.random() < 0.7,
      value: Math.round(jitter(30, 8)),
    });
  }
  const [asn4] = await db.insert(assignments).values({
    participantId: p4.id, programId: prog4.id, title: "50 catch-and-read reps before next session",
    instructions: "Have a partner vary closeout speed. Call out shoot/drive/pass out loud before moving.",
    frequency: "Before next training session", assignedByUserId: U.marcus.id, assignedToUserId: U.jamie.id, dueDate: daysAgo(-3), status: "started",
  }).returning();
  await db.insert(practiceLogs).values([
    { assignmentId: asn4.id, participantId: p4.id, programId: prog4.id, targetId: target4.id, date: daysAgo(5), loggedByUserId: U.jamie.id, result: "successful", contextTags: JSON.stringify(["Solo Practice"]), confidenceRating: 6, effortRating: 5 },
    { assignmentId: asn4.id, participantId: p4.id, programId: prog4.id, targetId: target4.id, date: daysAgo(2), loggedByUserId: U.jamie.id, result: "successful", contextTags: JSON.stringify(["Solo Practice"]), confidenceRating: 7, effortRating: 5 },
  ]);

  /* ================================================================ */
  /* DEMO 5 — Self-Directed: Devon trains alone, no separate coach     */
  /* Demonstrates the merged practitioner+learner capability model —   */
  /* one participantAssignments row per capability, both held by Devon */
  /* on their own case, without making Devon a global "practitioner".  */
  /* ================================================================ */
  console.log("Seeding Demo 5 (Self-Directed)...");
  const [p5] = await db.insert(participants).values({
    orgId: org.id, displayName: "Devon Ortiz", participantCode: "PF-0210", workspaceType: "performance", primaryPractitionerId: U.devon.id,
  }).returning();
  await db.insert(participantAssignments).values([
    { participantId: p5.id, userId: U.devon.id, roleOnCase: "practitioner" },
    { participantId: p5.id, userId: U.devon.id, roleOnCase: "learner" },
  ]);
  const [d5] = await db.insert(domains).values({ participantId: p5.id, name: "Solo Striking Conditioning", description: "Independent technical work between gym sessions." }).returning();
  const [g5] = await db.insert(goals).values({
    domainId: d5.id, participantId: p5.id, title: "Improve Jab-Cross-Slip Combination",
    broadGoal: "Improve jab-cross-slip combination.",
    successDescription: "Devon executes a clean jab-cross-slip sequence against the bag with correct footwork and head movement, without needing to review the checklist first.",
    status: "active",
  }).returning();
  const [prog5] = await db.insert(programs).values({
    goalId: g5.id, participantId: p5.id, name: "Jab-Cross-Slip Combo",
    operationalDefinition: "From a neutral stance, Devon throws a jab, follows with a cross, and slips the return path (imagined counter) by rotating the head off the centerline, resetting to guard within 2 seconds — without pausing to check a step list.",
    rationale: "This combination is the base building block for every combo Devon is learning this cycle; drilling it alone keeps gym time free for live coaching feedback.",
    prerequisites: "Comfortable neutral stance and basic guard.",
    teachingProcedures: JSON.stringify(["Chaining", "Practice / Rehearsal", "Self-Monitoring", "Differential Reinforcement"]),
    teachingProcedureNotes: "Self-taught from a coach-provided step list; Devon self-scores each round against the checklist below.",
    promptHierarchyId: perfCuePH.id,
    coachSummary: "No coach on this case — Devon runs and scores every round solo. Checklist below is what 'correct' means for self-scoring.",
    caregiverSummary: null,
    journeyStage: "acquisition",
    createdByUserId: U.devon.id,
  }).returning();

  const steps5 = ["Set neutral stance", "Throw jab, return to guard", "Throw cross, rotate hip", "Slip off centerline", "Reset to guard"];
  const stepRows5: typeof programSteps.$inferSelect[] = [];
  for (let i = 0; i < steps5.length; i++) {
    const [row] = await db.insert(programSteps).values({ programId: prog5.id, orderIndex: i, text: steps5[i], isCritical: i === 3, groupLabel: "Technical Sequence" }).returning();
    stepRows5.push(row);
  }
  const [target5] = await db.insert(targets).values({
    programId: prog5.id, name: "Combo Round", description: "One target = one 3-minute solo round on the bag.",
    orderIndex: 0, measurementType: "independent_prompted_incorrect", unitLabel: "round", promptHierarchyId: perfCuePH.id,
  }).returning();
  await db.insert(masteryRules).values({
    targetId: target5.id, programId: prog5.id,
    description: "8 self-scored independent rounds across 2 training contexts (bag work + mitts) without checklist review.",
    criteria: JSON.stringify({ type: "trials_across_environments", correctCount: 8, environmentCount: 2 }),
  });

  const contexts5 = ["Bag Work", "Mitts (Solo Setup)"];
  const totalSessions5 = 9;
  for (let s = 0; s < totalSessions5; s++) {
    const daysBack = (totalSessions5 - s) * 3 + 1;
    const context = contexts5[s % contexts5.length];
    const [sess] = await db.insert(sessions).values({
      participantId: p5.id, programId: prog5.id, conductedByUserId: U.devon.id, date: daysAgo(daysBack),
      durationMinutes: 25, contextTags: JSON.stringify([context, "Solo Practice"]),
    }).returning();
    const progressFrac = s / (totalSessions5 - 1);
    const independentProb = clamp(0.35 + progressFrac * 0.45 + jitter(0, 0.05), 0.2, 0.9);
    const rounds = 4 + Math.round(Math.random() * 2);
    for (let r = 0; r < rounds; r++) {
      const roll = Math.random();
      const result = roll < independentProb ? "independent" : roll < independentProb + 0.5 ? "prompted" : "incorrect";
      const stepResults = stepRows5.map((step) => ({
        stepId: step.id,
        result: Math.random() < independentProb + 0.1 ? "independent" : Math.random() < 0.6 ? "prompted" : "incorrect",
      }));
      await db.insert(trialData).values({
        sessionId: sess.id, targetId: target5.id, timestamp: daysAgo(daysBack), result,
        promptLevel: result === "prompted" ? "Checklist Review" : result === "independent" ? "Unassisted" : undefined,
        stepResults: JSON.stringify(stepResults), recordedByUserId: U.devon.id,
      });
    }
  }

  const [asn5] = await db.insert(assignments).values({
    participantId: p5.id, programId: prog5.id, title: "6 solo rounds before Saturday's open mat",
    instructions: "Film one round and compare against the checklist afterward — don't check it mid-round.",
    frequency: "6 rounds this week", assignedByUserId: U.devon.id, assignedToUserId: U.devon.id, dueDate: daysAgo(-2), status: "started",
  }).returning();
  await db.insert(practiceLogs).values([
    { assignmentId: asn5.id, participantId: p5.id, programId: prog5.id, targetId: target5.id, date: daysAgo(4), loggedByUserId: U.devon.id, result: "successful", contextTags: JSON.stringify(["Solo Practice", "Bag Work"]), confidenceRating: 6, effortRating: 5 },
    { assignmentId: asn5.id, participantId: p5.id, programId: prog5.id, targetId: target5.id, date: daysAgo(1), loggedByUserId: U.devon.id, result: "needed_help", barrierNote: "Kept peeking at the checklist mid-round.", contextTags: JSON.stringify(["Solo Practice"]), confidenceRating: 5, effortRating: 7 },
  ]);

  await db.insert(programChanges).values({
    programId: prog5.id, date: daysAgo(10), changeType: "Added self-scoring checklist", description: "Introduced a written checklist so rounds could be scored without a coach present.",
    rationale: "No coach attends solo sessions; self-scoring needed an objective reference to stay honest about independent vs. prompted attempts.",
    expectedOutcome: "More consistent self-scoring and an early read on whether checklist-dependence is fading.",
    dataToReview: "Independent vs. prompted rate over the next 5 solo sessions.", recordedByUserId: U.devon.id,
  });

  /* ================================================================ */
  /* Templates + Audit trail                                            */
  /* ================================================================ */
  console.log("Seeding templates + audit log...");
  await db.insert(templates).values([
    {
      orgId: org.id, name: "Chained Daily-Living Skill (Task Analysis)", type: "program", isOrgWide: true, createdByUserId: U.priya.id,
      description: "Starter template for any multi-step self-care or daily-living routine.",
      payload: JSON.stringify({ measurementType: "task_analysis", teachingProcedures: ["Chaining", "Prompting", "Fading", "Reinforcement"], promptHierarchy: ["Independent", "Verbal", "Gestural", "Model", "Partial Physical", "Full Physical"] }),
    },
    {
      orgId: org.id, name: "Opportunity-Based Classroom Skill", type: "program", isOrgWide: true, createdByUserId: U.priya.id,
      description: "For routines measured each time a natural opportunity occurs (transitions, greetings, etc).",
      payload: JSON.stringify({ measurementType: "opportunity", teachingProcedures: ["Prompting", "Differential Reinforcement", "Fading"] }),
    },
    {
      orgId: org.id, name: "Technical Sequence (Sport Skill)", type: "program", isOrgWide: true, createdByUserId: U.marcus.id,
      description: "For a multi-step technical movement drilled toward live/competition transfer.",
      payload: JSON.stringify({ measurementType: "independent_prompted_incorrect", teachingProcedures: ["Modeling", "Chaining", "Practice / Rehearsal", "Generalization Training"], promptHierarchy: ["Unassisted", "Verbal Cue", "Visual Demo", "Physical Guidance"] }),
    },
    {
      orgId: org.id, name: "Standard Implementation Fidelity Checklist", type: "fidelity_checklist", isOrgWide: true, createdByUserId: U.priya.id,
      description: "General-purpose 7-item fidelity checklist adaptable to most teaching procedures.",
      payload: JSON.stringify({ items: fidelitySteps1 }),
    },
  ]);

  await db.insert(auditLogs).values([
    { orgId: org.id, userId: U.priya.id, action: "program_created", entityType: "program", entityId: prog1.id, metadata: JSON.stringify({ name: prog1.name }) },
    { orgId: org.id, userId: U.priya.id, action: "mastery_confirmed", entityType: "program", entityId: prog1.id, metadata: JSON.stringify({ target: target1.name }) },
    { orgId: org.id, userId: U.marcus.id, action: "program_created", entityType: "program", entityId: prog3.id, metadata: JSON.stringify({ name: prog3.name }) },
    { orgId: org.id, userId: U.marcus.id, action: "program_changed", entityType: "program", entityId: prog3.id, metadata: JSON.stringify({ changeType: "Increased resistance" }) },
    { orgId: org.id, userId: U.dana.id, action: "user_created", entityType: "user", entityId: U.jordan.id, metadata: JSON.stringify({ name: U.jordan.name }) },
    { orgId: org.id, userId: U.devon.id, action: "program_created", entityType: "program", entityId: prog5.id, metadata: JSON.stringify({ name: prog5.name }) },
  ]);

  console.log("\nSeed complete.");
  console.log("Organization:", org.name);
  console.log("\nDemo logins (password for all: grounded123):");
  for (const u of userSeed) console.log(`  ${u.role.padEnd(12)} ${u.name.padEnd(20)} ${u.email}`);
}

main()
  .then(() => {
    console.log("\nDone.");
    process.exit(0);
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });

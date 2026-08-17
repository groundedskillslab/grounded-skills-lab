# Grounded Skills Lab

Behavior science for building better skills. A skill-development operating system built around the loop: **Define → Teach → Practice → Measure → Analyze → Adjust → Generalize → Maintain.**

One data model, four vocabularies — the same engine that runs an ABA tooth-brushing program also runs a BJJ guard-recovery program, a classroom transition plan, and a basketball decision-making drill. Switching "workspace type" on a participant relabels the whole UI (Client → Athlete, Trial → Attempt, Treatment Fidelity → Coaching Fidelity, etc.) without touching the underlying data.

## Quick start

```bash
npm install
npm run db:push   # create the SQLite schema (data/grounded.db)
npm run db:seed   # populate five cross-domain demo cases
npm run dev        # http://localhost:3000
```

Requires Node 20+. Uses SQLite via `better-sqlite3` — no external database or services to configure.

### Demo logins

Every demo account uses the password **`grounded123`**.

| Role | Name | Email |
|---|---|---|
| Org Admin | Dana Reyes | dana@groundedskillslab.demo |
| Practitioner (BCBA, clinical + education) | Priya Shah | priya@groundedskillslab.demo |
| Practitioner (Performance consultant) | Marcus Webb | marcus@groundedskillslab.demo |
| Implementer (Behavior Technician) | Jordan Lee | jordan@groundedskillslab.demo |
| Implementer (Teacher) | Casey Nguyen | casey@groundedskillslab.demo |
| Implementer (BJJ Coach) | Coach Ade Okafor | ade@groundedskillslab.demo |
| Implementer (Basketball Coach) | Coach Taylor Brooks | taylor@groundedskillslab.demo |
| Caregiver | Sam Rivera | sam@groundedskillslab.demo |
| Caregiver / Family | Alex Kim | alexk@groundedskillslab.demo |
| Athlete / Learner | Riley Chen | riley@groundedskillslab.demo |
| Athlete / Learner | Jamie Park | jamie@groundedskillslab.demo |
| Self-Directed Athlete | Devon Ortiz | devon@groundedskillslab.demo |

The login screen has one-click buttons for all of these.

Devon is a special case worth trying: their global role is "learner," but on their own participant record they also hold a "practitioner" capability — so unlike Riley or Jamie, Devon can build and edit their own program (see "Permission model" in the architecture doc). This is the merged practitioner+learner pattern for someone training themselves with no separate coach.

### Demo data

`npm run db:seed` wipes and rebuilds five cross-domain cases so you can see the same engine at work everywhere:

1. **ABA (Clinical)** — M.T., independent tooth brushing: 6-step task analysis, prompt fading from full-physical to independent across 14 sessions, treatment fidelity observations, a generalization matrix (caregiver, new setting, time-of-day), a 3-stage maintenance plan, and caregiver practice logs.
2. **School (Education)** — R.K., independent classroom transitions: opportunity-based data across multiple staff and settings (classroom / cafeteria / gym), a generalization matrix, and an implementation-fidelity checklist.
3. **BJJ (Performance)** — Riley Chen, side-control guard recovery: a 5-step technical sequence, cue-level tracking across drilling / positional sparring / live sparring / different partners, coaching fidelity, transfer probes, and athlete self-logged practice.
4. **Basketball (Performance)** — Jamie Park, catch-to-shot decision making: read accuracy and latency across shooting drills / scrimmage / game simulation, coaching fidelity, and transfer probes.
5. **Self-Directed (Performance)** — Devon Ortiz, jab-cross-slip striking combo: solo bag/mitt rounds Devon both runs and is scored on, no separate coach on the case — demonstrates the merged practitioner+learner permission model.

## What's built

This build covers Phase 1 (core data-collection loop) and the Phase 2 differentiators, plus a working (rule-based, not LLM) Insight Engine from Phase 3:

- Auth + 5 roles (Org Admin, Practitioner, Implementer, Caregiver, Athlete/Learner) with participant-level access control
- Four workspace vocabularies (Clinical / Performance / Education / General) sharing one schema
- Participants, domains, goals, programs, task analyses, targets
- Program Builder: operational definition, rationale, prerequisites, task analysis (add/reorder/mark-critical), teaching procedures, configurable prompt hierarchies, measurement types, mastery criteria, generalization dimensions, maintenance schedules, caregiver/coach plain-language translation
- Session Mode: rapid trial entry (tap-per-trial, prompt-hierarchy-aware, task-analysis step walkthrough, numeric/rating entry for performance metrics), running summary
- Treatment/Coaching/Implementation Fidelity: checklist builder, scored observations, auto-calculated %, trend over time
- Generalization matrix and Maintenance schedule/check tracking, with automatic return-to-teaching signal on decline
- Mastery detection (5 rule types) that flags "criterion appears met" — a human always confirms
- Practice Mode: a dramatically simpler caregiver/coach/athlete screen (Today's Skill / How to Do It / What Counts as Success / big buttons)
- Assignments with status tracking (assigned/started/completed/missed)
- Analytics: performance vs. independence trend, prompt-level distribution, success-by-context, fidelity trend, generalization/maintenance summaries, an Insight Engine that surfaces descriptive "Observed Data Pattern" text (never a treatment recommendation)
- Case review board (Progressing / Stable / Needs Review / Insufficient Data) computed from real signals (performance trend, fidelity, prompt dependence, generalization gaps, practice adherence)
- Professional Decision Log (program-change tracking with rationale/expected outcome/what to review)
- Program Library (org-wide templates)
- Organization admin: team list, audit log
- Data-editing integrity: trial records are immutable inserts (never silently overwritten); audit log on key actions

## What's not built yet

Deliberately out of scope for this pass (flagged in the original spec as Phase 3/4, or explicitly excluded):

- Conversational AI Program Copilot and AI-drafted content (the schema has an `ai_drafts` table ready for it, but there's no LLM wired in — the Insight Engine here is deterministic/statistical, not generative)
- Skill Map (visual prerequisite graph)
- Global search
- PDF/formatted progress reports, data export, account/data deletion UI
- Multi-organization management, deeper permission editing UI
- Billing, scheduling, EHR, and everything else explicitly excluded in the product brief

## Architecture

- **Next.js 16 (App Router) + TypeScript + Tailwind v4**, React Server Components with Server Actions for all mutations (progressive-enhancement `<form action={...}>`, no client-side fetch plumbing needed)
- **SQLite via Drizzle ORM** (`better-sqlite3`) — see `src/db/schema.ts` for the full relational model (organizations, users, participants, domains/goals/programs/targets, prompt hierarchies, mastery rules, generalization dimensions/probes, maintenance plans/checks, sessions/trial data, fidelity protocols/items/observations, assignments/practice logs, program changes, templates, audit log)
- **NextAuth v5 (Credentials + JWT)** — `auth.config.ts` is the edge-safe base used by `middleware.ts`; `auth.ts` adds the database-backed `authorize()` and is only ever imported from server components/route handlers
- **Recharts** for trend lines, plain CSS bar lists for comparisons — palette and interaction choices follow a validated colorblind-safe categorical/status palette (see `src/lib/chartColors.ts`)
- Terminology lives in one place: `src/lib/labels.ts` maps `workspaceType` → the whole vocabulary used across every screen

## Scripts

```bash
npm run dev        # start dev server
npm run build       # production build
npm run start        # run the production build
npm run db:push      # push schema changes to SQLite
npm run db:seed      # wipe + reseed demo data
```

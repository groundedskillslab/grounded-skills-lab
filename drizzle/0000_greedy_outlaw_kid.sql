CREATE TABLE "ai_drafts" (
	"id" text PRIMARY KEY NOT NULL,
	"org_id" text NOT NULL,
	"program_id" text,
	"type" text NOT NULL,
	"input" text NOT NULL,
	"output" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_by_user_id" text NOT NULL,
	"created_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "assignments" (
	"id" text PRIMARY KEY NOT NULL,
	"participant_id" text NOT NULL,
	"program_id" text,
	"title" text NOT NULL,
	"instructions" text,
	"frequency" text,
	"assigned_by_user_id" text NOT NULL,
	"assigned_to_user_id" text,
	"due_date" timestamp,
	"status" text DEFAULT 'assigned' NOT NULL,
	"created_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" text PRIMARY KEY NOT NULL,
	"org_id" text NOT NULL,
	"user_id" text,
	"action" text NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" text,
	"metadata" text,
	"timestamp" timestamp
);
--> statement-breakpoint
CREATE TABLE "contextual_tags" (
	"id" text PRIMARY KEY NOT NULL,
	"org_id" text NOT NULL,
	"label" text NOT NULL,
	"category" text
);
--> statement-breakpoint
CREATE TABLE "domains" (
	"id" text PRIMARY KEY NOT NULL,
	"participant_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"created_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "fidelity_items" (
	"id" text PRIMARY KEY NOT NULL,
	"protocol_id" text NOT NULL,
	"order_index" integer NOT NULL,
	"text" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fidelity_observations" (
	"id" text PRIMARY KEY NOT NULL,
	"protocol_id" text NOT NULL,
	"participant_id" text NOT NULL,
	"program_id" text NOT NULL,
	"session_id" text,
	"observed_user_id" text,
	"observer_user_id" text NOT NULL,
	"date" timestamp NOT NULL,
	"scores" text NOT NULL,
	"fidelity_percent" real NOT NULL,
	"notes" text,
	"created_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "fidelity_protocols" (
	"id" text PRIMARY KEY NOT NULL,
	"program_id" text NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "generalization_dimensions" (
	"id" text PRIMARY KEY NOT NULL,
	"program_id" text NOT NULL,
	"dimension_type" text NOT NULL,
	"label" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "generalization_probes" (
	"id" text PRIMARY KEY NOT NULL,
	"dimension_id" text NOT NULL,
	"target_id" text,
	"program_id" text NOT NULL,
	"date" timestamp NOT NULL,
	"result" text NOT NULL,
	"context" text,
	"notes" text,
	"recorded_by_user_id" text
);
--> statement-breakpoint
CREATE TABLE "goals" (
	"id" text PRIMARY KEY NOT NULL,
	"domain_id" text NOT NULL,
	"participant_id" text NOT NULL,
	"title" text NOT NULL,
	"broad_goal" text NOT NULL,
	"success_description" text,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "maintenance_checks" (
	"id" text PRIMARY KEY NOT NULL,
	"maintenance_plan_id" text NOT NULL,
	"label" text NOT NULL,
	"due_date" timestamp NOT NULL,
	"completed_date" timestamp,
	"result" text DEFAULT 'not_yet_checked' NOT NULL,
	"performance_value" real,
	"notes" text,
	"recorded_by_user_id" text
);
--> statement-breakpoint
CREATE TABLE "maintenance_plans" (
	"id" text PRIMARY KEY NOT NULL,
	"program_id" text NOT NULL,
	"schedule" text NOT NULL,
	"created_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "mastery_rules" (
	"id" text PRIMARY KEY NOT NULL,
	"target_id" text,
	"program_id" text,
	"description" text NOT NULL,
	"criteria" text NOT NULL,
	"auto_detected_at" timestamp,
	"confirmed_by_user_id" text,
	"confirmed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "organizations" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "participant_assignments" (
	"id" text PRIMARY KEY NOT NULL,
	"participant_id" text NOT NULL,
	"user_id" text NOT NULL,
	"role_on_case" text NOT NULL,
	"created_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "participants" (
	"id" text PRIMARY KEY NOT NULL,
	"org_id" text NOT NULL,
	"display_name" text NOT NULL,
	"participant_code" text NOT NULL,
	"workspace_type" text NOT NULL,
	"primary_practitioner_id" text,
	"archived" boolean DEFAULT false NOT NULL,
	"created_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "practice_logs" (
	"id" text PRIMARY KEY NOT NULL,
	"assignment_id" text,
	"participant_id" text NOT NULL,
	"program_id" text NOT NULL,
	"target_id" text,
	"date" timestamp NOT NULL,
	"logged_by_user_id" text NOT NULL,
	"result" text NOT NULL,
	"what_worked_note" text,
	"barrier_note" text,
	"context_tags" text,
	"confidence_rating" real,
	"effort_rating" real,
	"notes" text,
	"session_code" text,
	"created_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "program_changes" (
	"id" text PRIMARY KEY NOT NULL,
	"program_id" text NOT NULL,
	"date" timestamp NOT NULL,
	"change_type" text NOT NULL,
	"description" text NOT NULL,
	"rationale" text,
	"expected_outcome" text,
	"data_to_review" text,
	"recorded_by_user_id" text NOT NULL,
	"created_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "program_steps" (
	"id" text PRIMARY KEY NOT NULL,
	"program_id" text NOT NULL,
	"order_index" integer NOT NULL,
	"text" text NOT NULL,
	"group_label" text,
	"is_critical" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "programs" (
	"id" text PRIMARY KEY NOT NULL,
	"goal_id" text NOT NULL,
	"participant_id" text NOT NULL,
	"name" text NOT NULL,
	"operational_definition" text,
	"rationale" text,
	"prerequisites" text,
	"teaching_procedures" text,
	"teaching_procedure_notes" text,
	"prompt_hierarchy_id" text,
	"caregiver_summary" text,
	"coach_summary" text,
	"journey_stage" text DEFAULT 'not_started' NOT NULL,
	"mastered_at" timestamp,
	"archived" boolean DEFAULT false NOT NULL,
	"created_by_user_id" text,
	"created_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "prompt_hierarchies" (
	"id" text PRIMARY KEY NOT NULL,
	"org_id" text NOT NULL,
	"name" text NOT NULL,
	"levels" text NOT NULL,
	"strategy" text DEFAULT 'least_to_most' NOT NULL,
	"is_template" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "self_monitoring_entries" (
	"id" text PRIMARY KEY NOT NULL,
	"participant_id" text NOT NULL,
	"program_id" text,
	"date" timestamp NOT NULL,
	"completed" boolean DEFAULT false NOT NULL,
	"value" real,
	"notes" text,
	"created_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"participant_id" text NOT NULL,
	"program_id" text,
	"conducted_by_user_id" text NOT NULL,
	"date" timestamp NOT NULL,
	"duration_minutes" real,
	"context_tags" text,
	"notes" text,
	"ai_summary" text,
	"session_code" text,
	"created_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "targets" (
	"id" text PRIMARY KEY NOT NULL,
	"program_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"order_index" integer DEFAULT 0 NOT NULL,
	"measurement_type" text NOT NULL,
	"unit_label" text,
	"prompt_hierarchy_id" text,
	"archived" boolean DEFAULT false NOT NULL,
	"created_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "templates" (
	"id" text PRIMARY KEY NOT NULL,
	"org_id" text NOT NULL,
	"name" text NOT NULL,
	"type" text NOT NULL,
	"description" text,
	"payload" text NOT NULL,
	"is_org_wide" boolean DEFAULT true NOT NULL,
	"created_by_user_id" text,
	"created_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "trial_data" (
	"id" text PRIMARY KEY NOT NULL,
	"session_id" text NOT NULL,
	"target_id" text NOT NULL,
	"timestamp" timestamp NOT NULL,
	"result" text NOT NULL,
	"prompt_level" text,
	"value" real,
	"step_results" text,
	"notes" text,
	"recorded_by_user_id" text NOT NULL,
	"edited_from_id" text,
	"edit_reason" text,
	"created_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"org_id" text NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"role" text NOT NULL,
	"title" text,
	"created_at" timestamp,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);

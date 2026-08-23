CREATE TABLE "beta_signups" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"skill_focus" text,
	"describes_you" text NOT NULL,
	"interested_in" text NOT NULL,
	"note" text,
	"created_at" timestamp
);

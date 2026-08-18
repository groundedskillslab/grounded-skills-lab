import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "./schema";

// Supabase PostgreSQL — the canonical database (local SQLite was retired
// 2026-08-18 when the Postgres migration started; see the architecture
// doc's pre-deployment checklist). DATABASE_URL should point at the
// Session Pooler connection string everywhere — local dev AND Vercel's
// production deploy. Confirmed 2026-08-18: for this specific Supabase
// project, both the Direct connection and the Transaction Pooler default
// to IPv6-only, which broke Vercel's build; only the Session Pooler is
// IPv4-safe here. See .env.example and the architecture doc for the
// full story (this contradicts general Supabase docs, which usually
// point production traffic at the Transaction Pooler instead).
//
// Note this role bypasses Row Level Security (see supabase/rls-policies.sql)
// — all real authorization happens here in application code
// (requireUser() + lib/rbac.ts), not at the database layer.
declare global {
  // eslint-disable-next-line no-var
  var __pgClient: ReturnType<typeof postgres> | undefined;
}

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error(
    "DATABASE_URL is not set. Copy .env.example to .env.local and fill in your Supabase connection string (Session Pooler, for a persistent local connection)."
  );
}

const client = global.__pgClient ?? postgres(connectionString, { prepare: false });
if (process.env.NODE_ENV !== "production") global.__pgClient = client;

export const db = drizzle(client, { schema });

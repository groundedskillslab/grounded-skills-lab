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

// max: 1 — each Vercel serverless instance holds at most one physical
// connection to the Session Pooler. Without this, postgres.js defaults to
// up to 10 connections per client instance; against the pooler's hard cap
// of 15 total, as few as 2-3 concurrent requests (e.g. one /people page
// load, which fires a parallel query per participant card) exhaust the
// pool and every other request fails with EMAXCONNSESSION until something
// frees up. idle_timeout releases a connection back to the pool quickly
// once a request finishes, instead of holding it open indefinitely.
const client = global.__pgClient ?? postgres(connectionString, { prepare: false, max: 1, idle_timeout: 20 });
if (process.env.NODE_ENV !== "production") global.__pgClient = client;

export const db = drizzle(client, { schema });

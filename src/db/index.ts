import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "./schema";

// Supabase PostgreSQL — the canonical database (local SQLite was retired
// 2026-08-18 when the Postgres migration started; see the architecture
// doc's pre-deployment checklist). DATABASE_URL should point at the
// Session Pooler connection string for anything that needs a persistent
// connection (local dev, migrations); Vercel's production deploy should
// use the Transaction Pooler string instead (see .env.example).
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

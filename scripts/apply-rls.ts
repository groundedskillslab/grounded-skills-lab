/* Applies supabase/rls-policies.sql against DATABASE_URL. Safe to re-run
 * — every statement in that file is idempotent. Must run somewhere with
 * direct Postgres access (this repo's cloud sandbox could not reach the
 * database — outbound TCP to the Supabase pooler is blocked there — so
 * this is meant to run on your own machine, same as `npm run db:push`).
 *
 * Run with: npm run rls:apply
 */
import { readFileSync } from "fs";
import { join } from "path";
import postgres from "postgres";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set. Copy .env.example to .env.local and fill in your Supabase connection string.");
}

// max: 1 pins this script to a single physical connection. rls-policies.sql
// is one big multi-statement file sent via sql.unsafe() — Postgres runs a
// multi-statement batch like that as an implicit transaction (its first
// response is literally a 'BEGIN' command tag), and postgres.js refuses to
// run that over an ordinary pooled connection (error: UNSAFE_TRANSACTION)
// because a later statement could otherwise be routed to a different
// physical connection, silently breaking the transaction. With max: 1
// there's only ever one connection, so that risk doesn't exist and the
// guard doesn't fire.
const sql = postgres(connectionString, { prepare: false, max: 1 });
const filePath = join(__dirname, "..", "supabase", "rls-policies.sql");

async function main() {
  console.log(`Applying ${filePath} ...`);
  const raw = readFileSync(filePath, "utf-8");
  await sql.unsafe(raw);
  console.log("Done. Run `npm run rls:verify` next to confirm the policies actually enforce what lib/rbac.ts expects.");
  await sql.end();
}

main().catch(async (err) => {
  console.error("Failed to apply RLS policies:");
  console.error(err);
  await sql.end();
  process.exit(1);
});

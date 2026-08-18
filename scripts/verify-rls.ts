/* Verifies supabase/rls-policies.sql actually enforces what lib/rbac.ts
 * says it should — not by re-reading the policy SQL, but by connecting
 * as each real user in the database, impersonating them the same way
 * Supabase's PostgREST layer would (SET ROLE authenticated + a JWT claim
 * providing auth.uid()), and comparing what RLS actually lets them see
 * against an independently-computed expectation.
 *
 * Must run somewhere with direct Postgres access (this repo's cloud
 * sandbox could not reach the database at all — outbound TCP to the
 * Supabase pooler is blocked by its network allowlist — so this is
 * meant to run on your own machine, same as `npm run db:push`).
 *
 * Run with: npm run rls:verify
 */
import postgres from "postgres";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set. Copy .env.example to .env.local and fill in your Supabase connection string.");
}

const sql = postgres(connectionString, { prepare: false });

type Check = { label: string; pass: boolean; detail?: string };
const results: Check[] = [];

function record(label: string, pass: boolean, detail?: string) {
  results.push({ label, pass, detail });
  console.log(`${pass ? "✓" : "✗"} ${label}${detail ? " — " + detail : ""}`);
}

// Runs `fn` inside a transaction impersonating the given app-level user
// (by their linked Supabase Auth id), then rolls back — so nothing this
// script does can leave test data behind, including on the WRITE checks
// further down.
async function asUser<T>(authUserId: string, fn: (tx: postgres.TransactionSql) => Promise<T>): Promise<T> {
  return sql.begin(async (tx) => {
    await tx`select set_config('request.jwt.claims', ${JSON.stringify({ sub: authUserId, role: "authenticated" })}, true)`;
    await tx`set local role authenticated`;
    const result = await fn(tx);
    // Force rollback regardless of outcome — this is a read-only /
    // throwaway-write verification run, never a real mutation.
    throw { __forceRollback: true, result };
  }).catch((e) => {
    if (e && e.__forceRollback) return e.result as T;
    throw e;
  });
}

async function main() {
  console.log("== Checking connection & role ==");
  const [{ current_user: currentUser }] = await sql`select current_user`;
  console.log(`Connected as: ${currentUser} (should bypass RLS — this is the app's own privileged role)`);

  const users = await sql<{ id: string; org_id: string; role: string; auth_user_id: string | null; email: string }[]>`
    select id, org_id, role, auth_user_id, email from users where auth_user_id is not null
  `;

  if (users.length === 0) {
    console.log("No users with a linked Supabase Auth account found — nothing to verify. Run npm run auth:link first.");
    await sql.end();
    return;
  }

  console.log(`\n== Verifying participant visibility for ${users.length} linked user(s) ==`);

  for (const u of users) {
    const isFullAccess = u.role === "org_admin" || u.role === "practitioner";

    const expected = isFullAccess
      ? await sql<{ id: string }[]>`select id from participants where org_id = ${u.org_id}`
      : await sql<{ id: string }[]>`
          select distinct p.id from participants p
          join participant_assignments pa on pa.participant_id = p.id
          where p.org_id = ${u.org_id} and pa.user_id = ${u.id}
        `;
    const expectedIds = new Set(expected.map((r) => r.id));

    const actual = await asUser(u.auth_user_id!, (tx) => tx<{ id: string }[]>`select id from participants`);
    const actualIds = new Set(actual.map((r) => r.id));

    const missing = [...expectedIds].filter((id) => !actualIds.has(id));
    const extra = [...actualIds].filter((id) => !expectedIds.has(id));
    const pass = missing.length === 0 && extra.length === 0;

    record(
      `${u.email} (${u.role}) sees exactly the right ${expectedIds.size} participant(s)`,
      pass,
      pass ? undefined : `missing=[${missing.join(",")}] extra=[${extra.join(",")}]`
    );
  }

  console.log("\n== Spot-checking write permissions ==");

  // Find one caregiver-only user (has ONLY a "caregiver" capability
  // somewhere, no practitioner/implementer/full-access) and confirm they
  // cannot insert a session — matches canRunSessions() excluding caregivers.
  const caregivers = await sql<{ id: string; auth_user_id: string; participant_id: string }[]>`
    select u.id, u.auth_user_id, pa.participant_id
    from users u
    join participant_assignments pa on pa.user_id = u.id and pa.role_on_case = 'caregiver'
    where u.role not in ('org_admin', 'practitioner')
      and u.auth_user_id is not null
      and not exists (
        select 1 from participant_assignments pa2
        where pa2.user_id = u.id and pa2.role_on_case in ('practitioner', 'implementer')
      )
    limit 1
  `;

  if (caregivers.length > 0) {
    const c = caregivers[0];
    let blocked = false;
    try {
      await asUser(c.auth_user_id, (tx) =>
        tx`insert into sessions (participant_id, conducted_by_user_id, date) values (${c.participant_id}, ${c.id}, now())`
      );
    } catch {
      blocked = true;
    }
    record("A caregiver-only user is blocked from inserting a session", blocked);
  } else {
    console.log("(skipped: no caregiver-only demo user found to test with)");
  }

  // Find one implementer/practitioner with a participant and confirm they
  // CAN insert a session for it (checked via savepoint rollback).
  const runners = await sql<{ id: string; auth_user_id: string; participant_id: string }[]>`
    select u.id, u.auth_user_id, pa.participant_id
    from users u
    join participant_assignments pa on pa.user_id = u.id and pa.role_on_case in ('practitioner', 'implementer')
    where u.role not in ('org_admin', 'practitioner') and u.auth_user_id is not null
    limit 1
  `;

  if (runners.length > 0) {
    const r = runners[0];
    let allowed = false;
    try {
      await asUser(r.auth_user_id, (tx) =>
        tx`insert into sessions (participant_id, conducted_by_user_id, date) values (${r.participant_id}, ${r.id}, now())`
      );
      allowed = true;
    } catch {
      allowed = false;
    }
    record("A practitioner/implementer-capability user can insert a session for their participant", allowed);
  } else {
    console.log("(skipped: no non-full-access practitioner/implementer demo user found to test with)");
  }

  console.log("\n=== Summary ===");
  const failed = results.filter((r) => !r.pass);
  console.log(`${results.length - failed.length}/${results.length} checks passed.`);
  if (failed.length > 0) {
    console.log("\nFailed checks:");
    failed.forEach((f) => console.log(`  ✗ ${f.label}${f.detail ? " — " + f.detail : ""}`));
    process.exitCode = 1;
  }

  await sql.end();
}

main().catch(async (err) => {
  console.error(err);
  await sql.end();
  process.exit(1);
});

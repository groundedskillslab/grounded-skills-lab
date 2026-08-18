/* One-time-per-reseed script: creates a Supabase Auth account (email +
 * shared demo password) for every app-level `users` row that doesn't have
 * one yet, and links it via `users.authUserId`. Run after `npm run db:seed`
 * (which only creates the app-level profile rows, not login credentials).
 *
 * Idempotent — safe to re-run after a reseed. If a Supabase Auth account
 * for an email already exists (e.g. from a previous run), it reuses that
 * account and just re-links it, rather than erroring.
 *
 * Needs SUPABASE_SERVICE_ROLE_KEY in .env.local — this is the admin key,
 * never expose it to the browser or commit it. Run with: npm run auth:link
 */
import { createClient } from "@supabase/supabase-js";
import { eq, isNull } from "drizzle-orm";
import { db } from "../src/db";
import { users } from "../src/db/schema";
import { DEMO_PASSWORD } from "../src/lib/demoAuth";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error(
    "NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env.local. " +
      "Get the service role key from Supabase: Project Settings -> API -> service_role secret."
  );
}

// Admin client — bypasses RLS, server-only, never import this pattern into
// client-facing code (src/lib/supabase/client.ts is the browser-safe one).
const admin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function findExistingAuthUserId(email: string): Promise<string | null> {
  // Admin API has no "get user by email" endpoint, so page through and match.
  let page = 1;
  for (;;) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    const match = data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
    if (match) return match.id;
    if (data.users.length < 200) return null; // last page
    page += 1;
  }
}

async function main() {
  const unlinked = await db.select().from(users).where(isNull(users.authUserId));

  if (unlinked.length === 0) {
    console.log("Every user already has a linked Supabase Auth account. Nothing to do.");
    return;
  }

  console.log(`Linking ${unlinked.length} user(s) to Supabase Auth...`);

  for (const user of unlinked) {
    let authUserId: string | null = null;

    const { data, error } = await admin.auth.admin.createUser({
      email: user.email,
      password: DEMO_PASSWORD,
      email_confirm: true, // demo accounts — skip the verification email
    });

    if (error) {
      // Most likely cause on a re-run: the auth account already exists
      // from a prior link, but this app-level row was recreated by a
      // fresh `db:seed` and lost its authUserId. Look it up and reuse it.
      if (error.code === "email_exists" || /already registered|already exists/i.test(error.message)) {
        authUserId = await findExistingAuthUserId(user.email);
        if (!authUserId) {
          console.error(`  ✗ ${user.email}: reported as existing but couldn't find it via listUsers — skipping`);
          continue;
        }
        console.log(`  ↻ ${user.email}: reusing existing Supabase Auth account`);
      } else {
        console.error(`  ✗ ${user.email}: ${error.message}`);
        continue;
      }
    } else {
      authUserId = data.user.id;
      console.log(`  ✓ ${user.email}: created Supabase Auth account`);
    }

    await db.update(users).set({ authUserId }).where(eq(users.id, user.id));
  }

  console.log("Done.");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });

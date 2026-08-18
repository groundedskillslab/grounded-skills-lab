import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { users } from "@/db/schema";
import { createClient } from "@/lib/supabase/server";

// The shape every call site expects — unchanged from the NextAuth era, so
// none of the ~20 pages/actions calling requireUser() needed to change.
export type AppUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  orgId: string;
  title?: string;
};

export async function requireUser(): Promise<AppUser> {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) redirect("/login");

  const [appUser] = await db.select().from(users).where(eq(users.authUserId, authUser.id)).limit(1);

  // Signed in with Supabase but no matching app-level profile — shouldn't
  // happen outside of a broken seed/link run, but fail safe rather than
  // letting downstream code work with an undefined user.
  if (!appUser) redirect("/login");

  return {
    id: appUser.id,
    name: appUser.name,
    email: appUser.email,
    role: appUser.role,
    orgId: appUser.orgId,
    title: appUser.title ?? undefined,
  };
}

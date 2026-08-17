import type { NextAuthConfig } from "next-auth";

// Edge-safe base config (no database access) shared between the full
// auth.ts (used in server components / route handlers) and middleware.ts
// (which must stay free of Node-only native modules like better-sqlite3).
export const authConfig: NextAuthConfig = {
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  trustHost: true,
  providers: [],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = (user as any).id;
        token.role = (user as any).role;
        token.orgId = (user as any).orgId;
        token.title = (user as any).title;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
        (session.user as any).orgId = token.orgId;
        (session.user as any).title = token.title;
      }
      return session;
    },
  },
};

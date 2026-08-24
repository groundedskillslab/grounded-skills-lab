import { db } from "@/db";
import { betaSignups } from "@/db/schema";
import { desc } from "drizzle-orm";
import { Card, SectionHeader, Pill } from "@/components/ui";

export const dynamic = "force-dynamic";

// Deliberately outside the (app) route group — that layout calls
// requireUser() and renders the product's own org-scoped nav, neither of
// which applies here. This page is gated entirely by middleware.ts's
// ADMIN_PASSWORD Basic Auth check instead (see adminAccessOk there), so it
// doesn't need — and shouldn't assume — a signed-in product account.
export default async function BetaSignupsAdminPage() {
  const rows = await db.select().from(betaSignups).orderBy(desc(betaSignups.createdAt));

  return (
    <div className="min-h-screen bg-plane">
      <div className="max-w-[1200px] mx-auto px-6 py-10">
        <SectionHeader
          title="Beta signups"
          subtitle={`${rows.length} ${rows.length === 1 ? "person has" : "people have"} requested beta access.`}
          action={
            <a
              href="/admin/beta-signups/export"
              className="inline-flex items-center gap-2 font-heading font-semibold text-sm bg-ink text-white rounded-lg px-4 py-2.5 hover:opacity-90 transition"
            >
              Download CSV
            </a>
          }
        />

        {rows.length === 0 ? (
          <Card>
            <p className="text-sm text-ink-secondary">No signups yet — they&rsquo;ll show up here as soon as someone submits the beta form.</p>
          </Card>
        ) : (
          <Card className="!p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gridline text-left text-xs uppercase tracking-wide text-ink-muted">
                    <th className="px-4 py-3 font-medium">Name</th>
                    <th className="px-4 py-3 font-medium">Email</th>
                    <th className="px-4 py-3 font-medium">Describes them</th>
                    <th className="px-4 py-3 font-medium">Interested in</th>
                    <th className="px-4 py-3 font-medium">Skill focus</th>
                    <th className="px-4 py-3 font-medium">Note</th>
                    <th className="px-4 py-3 font-medium">Signed up</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.id} className="border-b border-gridline last:border-0 align-top">
                      <td className="px-4 py-3 font-medium whitespace-nowrap">{row.name}</td>
                      <td className="px-4 py-3">
                        <a href={`mailto:${row.email}`} className="text-brand-ink underline">
                          {row.email}
                        </a>
                      </td>
                      <td className="px-4 py-3">
                        <Pill tone="brand">{row.describesYou}</Pill>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">{row.interestedIn}</td>
                      <td className="px-4 py-3 text-ink-secondary max-w-[220px]">{row.skillFocus || "—"}</td>
                      <td className="px-4 py-3 text-ink-secondary max-w-[280px]">{row.note || "—"}</td>
                      <td className="px-4 py-3 text-ink-muted whitespace-nowrap">
                        {row.createdAt
                          ? row.createdAt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                          : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

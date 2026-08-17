import { requireUser } from "@/lib/session";
import { listUsers, listAuditLogs, listParticipants, getUser } from "@/lib/data";
import { isOrgAdmin, ROLE_LABELS } from "@/lib/rbac";
import { Card, SectionHeader, Pill, EmptyState } from "@/components/ui";
import { redirect } from "next/navigation";
import { format } from "date-fns";

export const dynamic = "force-dynamic";

export default async function OrganizationPage() {
  const user = await requireUser();
  if (!isOrgAdmin(user.role)) redirect("/home");

  const [users, auditLogs, participants] = await Promise.all([
    listUsers(user.orgId),
    listAuditLogs(user.orgId, 50),
    listParticipants(user.orgId, user.id, user.role),
  ]);

  const usersById = new Map(users.map((u) => [u.id, u]));

  return (
    <div className="space-y-8">
      <SectionHeader title="Organization" subtitle="Accounts, permissions, and an audit trail of what's changed." />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <div className="text-xs uppercase tracking-wide text-ink-muted mb-2">Team Members</div>
          <div className="text-3xl font-medium tabular">{users.length}</div>
        </Card>
        <Card>
          <div className="text-xs uppercase tracking-wide text-ink-muted mb-2">Participants</div>
          <div className="text-3xl font-medium tabular">{participants.length}</div>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <SectionHeader title="Team" />
          <ul className="divide-y divide-gridline">
            {users.map((u) => (
              <li key={u.id} className="py-2.5 flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium">{u.name}</div>
                  <div className="text-xs text-ink-muted">{u.email}</div>
                </div>
                <Pill tone="neutral">{ROLE_LABELS[u.role as keyof typeof ROLE_LABELS]}</Pill>
              </li>
            ))}
          </ul>
        </Card>

        <Card>
          <SectionHeader title="Audit Log" subtitle="Program changes, mastery confirmations, and permission changes." />
          {auditLogs.length === 0 ? (
            <EmptyState title="No activity recorded yet" />
          ) : (
            <ul className="divide-y divide-gridline max-h-[480px] overflow-y-auto">
              {auditLogs.map((log) => (
                <li key={log.id} className="py-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm">{log.action.replace(/_/g, " ")}</span>
                    <span className="text-xs text-ink-muted">{format(new Date(log.timestamp!), "MMM d, h:mm a")}</span>
                  </div>
                  <div className="text-xs text-ink-muted">
                    {log.userId ? usersById.get(log.userId)?.name || "Unknown user" : "System"} · {log.entityType}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}

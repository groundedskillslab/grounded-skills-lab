import { requireUser } from "@/lib/session";
import { listParticipants, getParticipantSessions, getProgram } from "@/lib/data";
import { isFullAccessRole, hasRunSessionsCapabilityAnywhere } from "@/lib/rbac";
import { Card, SectionHeader, LinkButton, EmptyState, Pill } from "@/components/ui";
import Link from "next/link";
import { format } from "date-fns";

export const dynamic = "force-dynamic";

export default async function SessionsPage() {
  const user = await requireUser();
  const participants = await listParticipants(user.orgId, user.id, user.role);

  const all = (
    await Promise.all(
      participants.map(async (p) => {
        const sessions = await getParticipantSessions(p.id, 10);
        return sessions.map((s) => ({ session: s, participant: p }));
      })
    )
  )
    .flat()
    .sort((a, b) => new Date(b.session.date).getTime() - new Date(a.session.date).getTime())
    .slice(0, 30);

  const withProgram = await Promise.all(
    all.map(async (row) => ({ ...row, program: row.session.programId ? await getProgram(row.session.programId) : null }))
  );

  const canStartAny = isFullAccessRole(user.role) || (await hasRunSessionsCapabilityAnywhere(user.id));

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Sessions"
        subtitle="Rapid data collection, optimized for the moment you're in front of a participant."
        action={canStartAny ? <LinkButton href="/sessions/new">Start Session</LinkButton> : undefined}
      />
      <Card>
        {withProgram.length === 0 ? (
          <EmptyState title="No sessions yet" body="Start your first session to begin collecting data." />
        ) : (
          <ul className="divide-y divide-gridline">
            {withProgram.map(({ session, participant, program }) => (
              <li key={session.id} className="py-3 flex items-center justify-between">
                <div>
                  <Link href={`/sessions/${session.id}`} className="font-medium text-sm hover:underline">
                    {program?.name || "Unassigned session"}
                  </Link>
                  <div className="text-xs text-ink-muted">
                    {participant.displayName} · {format(new Date(session.date), "MMM d, yyyy")}
                    {session.sessionCode && <> · <span className="font-mono">{session.sessionCode}</span></>}
                  </div>
                </div>
                {session.contextTags && JSON.parse(session.contextTags).length > 0 && (
                  <Pill tone="neutral">{JSON.parse(session.contextTags)[0]}</Pill>
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

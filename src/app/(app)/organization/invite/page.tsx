import { requireUser } from "@/lib/session";
import { isOrgAdmin } from "@/lib/rbac";
import { listParticipants } from "@/lib/data";
import { Card, SectionHeader } from "@/components/ui";
import { InviteForm } from "@/components/InviteForm";
import { inviteTeamMember } from "@/actions/team";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function InviteTeamMemberPage() {
  const user = await requireUser();
  if (!isOrgAdmin(user.role)) redirect("/organization");

  const participants = await listParticipants(user.orgId, user.id, user.role);

  return (
    <div className="max-w-lg mx-auto">
      <SectionHeader
        title="Invite Someone"
        subtitle="They'll get an email with a link to set their own password and sign in."
      />
      <Card>
        <InviteForm
          action={inviteTeamMember}
          participants={participants.map((p) => ({ id: p.id, displayName: p.displayName, participantCode: p.participantCode }))}
        />
      </Card>
    </div>
  );
}

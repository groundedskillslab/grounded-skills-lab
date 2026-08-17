"use server";

import { requireUser } from "@/lib/session";
import { db } from "@/db";
import { participants, participantAssignments, domains } from "@/db/schema";
import { isFullAccessRole } from "@/lib/rbac";
import { logAudit } from "@/lib/audit";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export async function createParticipant(formData: FormData) {
  const user = await requireUser();
  if (!isFullAccessRole(user.role)) throw new Error("Not authorized to create participants.");

  const displayName = String(formData.get("displayName") || "").trim();
  const participantCode = String(formData.get("participantCode") || "").trim();
  const workspaceType = String(formData.get("workspaceType") || "clinical");
  const domainName = String(formData.get("domainName") || "").trim();

  if (!displayName || !participantCode) throw new Error("Name and ID are required.");

  const [participant] = await db
    .insert(participants)
    .values({ orgId: user.orgId, displayName, participantCode, workspaceType, primaryPractitionerId: user.id })
    .returning();

  await db.insert(participantAssignments).values({ participantId: participant.id, userId: user.id, roleOnCase: "practitioner" });

  if (domainName) {
    await db.insert(domains).values({ participantId: participant.id, name: domainName });
  }

  await logAudit({ orgId: user.orgId, userId: user.id, action: "participant_created", entityType: "participant", entityId: participant.id, metadata: { displayName } });

  revalidatePath("/people");
  redirect(`/people/${participant.id}`);
}

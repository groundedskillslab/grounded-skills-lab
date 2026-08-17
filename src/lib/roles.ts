// Pure constants — safe to import from client components.
export type Role = "org_admin" | "practitioner" | "implementer" | "caregiver" | "learner";

export const ROLE_LABELS: Record<Role, string> = {
  org_admin: "Organization Admin",
  practitioner: "Practitioner",
  implementer: "Implementer",
  caregiver: "Caregiver",
  learner: "Athlete / Learner",
};

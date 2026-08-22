import { requireUser } from "@/lib/session";
import { getSelfDirectedParticipant } from "@/lib/data";
import { Nav } from "@/components/Nav";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();

  // Same signal SimpleHome already uses to greet a self-directed user as
  // "training yourself" rather than listing them among other participants —
  // reused here so the nav's "People" label matches that framing instead of
  // contradicting it.
  const soloSelfDirected = user.role === "learner" && !!(await getSelfDirectedParticipant(user.id));

  return (
    <div className="flex flex-col min-h-screen">
      <Nav user={user} soloSelfDirected={soloSelfDirected} />
      <main className="flex-1 max-w-[1400px] w-full mx-auto px-4 sm:px-6 py-8">{children}</main>
    </div>
  );
}

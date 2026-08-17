import { requireUser } from "@/lib/session";
import { Nav } from "@/components/Nav";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();

  return (
    <div className="flex flex-col min-h-screen">
      <Nav user={user} />
      <main className="flex-1 max-w-[1400px] w-full mx-auto px-4 sm:px-6 py-8">{children}</main>
    </div>
  );
}

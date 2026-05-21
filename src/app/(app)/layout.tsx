import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { NavLinks } from "@/components/nav-links";
import { logout } from "@/lib/actions/auth";
import { OrphanedTimerChecker } from "@/components/timer/orphaned-timer-checker";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen flex flex-col">
      <OrphanedTimerChecker />
      <header className="border-b px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <span className="font-semibold text-sm">Accountability</span>
          <NavLinks />
        </div>
        <form action={logout}>
          <button
            type="submit"
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Abmelden
          </button>
        </form>
      </header>
      <main className="flex-1 p-4 md:p-6 max-w-4xl mx-auto w-full">
        {children}
      </main>
    </div>
  );
}

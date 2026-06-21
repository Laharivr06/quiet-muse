import { createFileRoute, Outlet, redirect, Link, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { Feather, Calendar, Heart, Archive, Trash2, Settings, FileText, BookOpen, LogOut } from "lucide-react";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" });
    return { user: data.user };
  },
  component: AuthLayout,
});

function AuthLayout() {
  const navigate = useNavigate();

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/" });
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 px-4 py-6 md:grid-cols-[220px_1fr] md:px-8 md:py-10">
        <aside className="md:sticky md:top-10 md:self-start">
          <Link to="/journal" className="block font-serif text-3xl italic text-foreground">
            Sanctuary
          </Link>
          <nav className="mt-8 flex flex-row gap-2 overflow-x-auto md:flex-col md:gap-1">
            <NavItem to="/journal" icon={<BookOpen className="h-4 w-4" />} label="Journal" />
            <NavItem to="/write" icon={<Feather className="h-4 w-4" />} label="Write" />
            <NavItem to="/drafts" icon={<FileText className="h-4 w-4" />} label="Drafts" />
            <NavItem to="/calendar" icon={<Calendar className="h-4 w-4" />} label="Calendar" />
            <NavItem to="/favorites" icon={<Heart className="h-4 w-4" />} label="Favorites" />
            <NavItem to="/archive" icon={<Archive className="h-4 w-4" />} label="Archive" />
            <NavItem to="/trash" icon={<Trash2 className="h-4 w-4" />} label="Trash" />
            <NavItem to="/settings" icon={<Settings className="h-4 w-4" />} label="Settings" />
          </nav>
          <button
            onClick={signOut}
            className="mt-8 inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground"
          >
            <LogOut className="h-3.5 w-3.5" /> Sign out
          </button>
        </aside>
        <main className="min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function NavItem({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) {
  return (
    <Link
      to={to}
      className="flex items-center gap-3 whitespace-nowrap rounded-md px-3 py-2 text-sm text-muted-foreground transition hover:bg-secondary hover:text-foreground [&.active]:bg-secondary [&.active]:text-foreground"
      activeProps={{ className: "active" }}
    >
      <span>{icon}</span>
      <span>{label}</span>
    </Link>
  );
}

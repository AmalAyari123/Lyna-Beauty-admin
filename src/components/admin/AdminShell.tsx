import { Link, useNavigate } from "@tanstack/react-router";
import { CalendarDays, LayoutDashboard, LogOut, Menu, Scissors, Users, X } from "lucide-react";
import { useState, type ReactNode } from "react";
import logo from "@/assets/logo-lyna.jpg";
import { Button } from "@/components/ui/button";
import { setAdminAuthenticated } from "@/lib/admin-auth";

const links = [
  { to: "/admin/dashboard" as const, label: "Dashboard", icon: LayoutDashboard },
  { to: "/admin/rendez-vous" as const, label: "Rendez-vous", icon: CalendarDays },
  { to: "/admin/prestations" as const, label: "Prestations", icon: Scissors },
  { to: "/admin/employees" as const, label: "Employées", icon: Users },
];

export function AdminShell({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  async function logout() {
    setAdminAuthenticated(false);
    await navigate({ to: "/admin", replace: true });
  }

  return (
    <div className="min-h-screen bg-background md:grid md:grid-cols-[248px_1fr]">
      {open && <div className="fixed inset-0 z-30 bg-foreground/30 md:hidden" onClick={() => setOpen(false)} />}
      <aside className={`fixed inset-y-0 left-0 z-40 flex w-[248px] flex-col border-r border-gold/30 bg-card transition-transform md:sticky md:top-0 md:h-screen ${open ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}>
        <div className="flex items-center gap-3 border-b border-gold/25 px-5 py-5">
          <img src={logo} alt="Lyna Beauty" className="size-12 rounded-full object-cover ring-1 ring-gold/50" />
          <div className="min-w-0">
            <p className="text-gilded font-display text-xl font-semibold">Lyna Beauty</p>
            <p className="text-xs text-muted-foreground">Administration</p>
          </div>
          <Button variant="ghost" size="icon" className="ml-auto md:hidden" onClick={() => setOpen(false)} aria-label="Fermer le menu"><X /></Button>
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {links.map(({ to, label, icon: Icon }) => (
            <Link key={to} to={to} onClick={() => setOpen(false)} activeProps={{ className: "bg-secondary text-secondary-foreground" }} className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary/70 hover:text-foreground">
              <Icon className="size-4" />{label}
            </Link>
          ))}
        </nav>
        <div className="border-t border-gold/25 p-3">
          <Button variant="ghost" className="w-full justify-start text-muted-foreground" onClick={logout}><LogOut />Déconnexion</Button>
        </div>
      </aside>
      <main className="min-w-0">
        <header className="sticky top-0 z-20 flex h-16 items-center border-b border-gold/25 bg-background/95 px-4 backdrop-blur md:px-8">
          <Button variant="ghost" size="icon" className="mr-3 md:hidden" onClick={() => setOpen(true)} aria-label="Ouvrir le menu"><Menu /></Button>
          <div>
            <h1 className="font-display text-2xl font-semibold leading-tight">{title}</h1>
            <p className="hidden text-xs text-muted-foreground sm:block">{subtitle}</p>
          </div>
          <Button variant="outline" size="sm" className="ml-auto" onClick={logout}><LogOut />Déconnexion</Button>
        </header>
        <div className="p-4 md:p-8">{children}</div>
      </main>
    </div>
  );
}
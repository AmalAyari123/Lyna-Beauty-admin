import { createFileRoute, Link } from "@tanstack/react-router";
import { CalendarCheck, CalendarRange, CircleDollarSign, LoaderCircle } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { fetchReservations, formatMoney, shortTime, type Reservation } from "@/lib/admin-client";
import { requireAdmin } from "@/lib/admin-route";

export const Route = createFileRoute("/admin/dashboard")({
  ssr: false,
  beforeLoad: requireAdmin,
  head: () => ({ meta: [
    { title: "Dashboard — Administration Lyna Beauty" },
    { name: "description", content: "Vue d’ensemble des rendez-vous et du chiffre d’affaires Lyna Beauty." },
    { property: "og:title", content: "Dashboard — Administration Lyna Beauty" },
    { property: "og:description", content: "Vue d’ensemble des rendez-vous et du chiffre d’affaires Lyna Beauty." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: DashboardPage,
});

function localISO(date = new Date()) { return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`; }

function DashboardPage() {
  const [items, setItems] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  useEffect(() => { fetchReservations().then(setItems).catch(() => setError(true)).finally(() => setLoading(false)); }, []);
  const today = localISO();
  const weekEndDate = new Date(); weekEndDate.setDate(weekEndDate.getDate() + 6);
  const weekEnd = localISO(weekEndDate);
  const todayItems = useMemo(() => items.filter((x) => x.date === today), [items, today]);
  const weekItems = useMemo(() => items.filter((x) => x.date >= today && x.date <= weekEnd), [items, today, weekEnd]);
  const cards = [
    { label: "Rendez-vous aujourd'hui", value: String(todayItems.length), icon: CalendarCheck },
    { label: "Rendez-vous cette semaine", value: String(weekItems.length), icon: CalendarRange },
    { label: "Chiffre d'affaires du jour", value: formatMoney(todayItems.reduce((s, x) => s + Number(x.total_price), 0)), icon: CircleDollarSign },
    { label: "Chiffre d'affaires semaine", value: formatMoney(weekItems.reduce((s, x) => s + Number(x.total_price), 0)), icon: CircleDollarSign },
  ];
  return (
    <AdminShell title="Dashboard" subtitle="Votre activité en un coup d'œil">
      {error && <p className="mb-5 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">Impossible de charger les données. Vérifiez les autorisations de la base.</p>}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(({ label, value, icon: Icon }) => <article key={label} className="rounded-lg border border-gold/25 bg-card p-5 shadow-sm"><div className="flex items-start justify-between"><p className="text-sm text-muted-foreground">{label}</p><span className="rounded-md bg-secondary p-2 text-primary"><Icon className="size-4" /></span></div><p className="mt-4 text-2xl font-semibold tabular-nums">{loading ? "—" : value}</p></article>)}
      </div>
      <section className="mt-7 rounded-lg border border-gold/25 bg-card">
        <div className="flex items-center justify-between border-b border-gold/20 px-5 py-4"><div><h2 className="font-display text-xl font-semibold">Prochains rendez-vous aujourd'hui</h2><p className="text-xs text-muted-foreground">Triés par heure de début</p></div><Button asChild variant="outline" size="sm"><Link to="/admin/rendez-vous">Voir tout</Link></Button></div>
        {loading ? <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground"><LoaderCircle className="animate-spin" />Chargement…</div> : todayItems.length === 0 ? <p className="py-16 text-center text-sm text-muted-foreground">Aucun rendez-vous prévu aujourd'hui.</p> : <Table><TableHeader><TableRow><TableHead>Heure</TableHead><TableHead>Cliente</TableHead><TableHead>Employée</TableHead><TableHead>Prestations</TableHead><TableHead className="text-right">Total</TableHead></TableRow></TableHeader><TableBody>{todayItems.map((r) => <TableRow key={r.id}><TableCell className="font-medium tabular-nums">{shortTime(r.start_time)} – {shortTime(r.end_time)}</TableCell><TableCell>{r.first_name} {r.last_name}</TableCell><TableCell>{r.employees?.name ?? "—"}</TableCell><TableCell><div className="flex flex-wrap gap-1">{r.reservation_prestations.map((p) => <span key={p.prestation_id} className="rounded-sm bg-secondary px-2 py-1 text-xs">{p.prestations?.name}</span>)}</div></TableCell><TableCell className="text-right font-medium">{formatMoney(Number(r.total_price))}</TableCell></TableRow>)}</TableBody></Table>}
      </section>
    </AdminShell>
  );
}
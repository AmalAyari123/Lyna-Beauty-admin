import { createFileRoute } from "@tanstack/react-router";
import { ArrowUpDown, LoaderCircle, Pencil, Search, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { AdminShell } from "@/components/admin/AdminShell";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { adminClient, calculateEndTime, fetchEmployees, fetchPrestations, fetchReservations, formatAdminDate, formatMoney, shortTime, type Employee, type Prestation, type Reservation } from "@/lib/admin-client";
import { requireAdmin } from "@/lib/admin-route";

export const Route = createFileRoute("/admin/rendez-vous")({
  ssr: false,
  beforeLoad: requireAdmin,
  head: () => ({ meta: [
    { title: "Rendez-vous — Administration Lyna Beauty" },
    { name: "description", content: "Recherche, modification et annulation des rendez-vous Lyna Beauty." },
    { property: "og:title", content: "Rendez-vous — Administration Lyna Beauty" },
    { property: "og:description", content: "Recherche, modification et annulation des rendez-vous Lyna Beauty." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: AppointmentsPage,
});

type DateFilter = "today" | "week" | "all";
type SortKey = "date" | "time" | "name";

function iso(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function AppointmentsPage() {
  const [items, setItems] = useState<Reservation[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [services, setServices] = useState<Prestation[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [dateFilter, setDateFilter] = useState<DateFilter>("all");
  const [employeeFilter, setEmployeeFilter] = useState("all");
  const [sort, setSort] = useState<SortKey>("date");
  const [editing, setEditing] = useState<Reservation | null>(null);
  const [deleting, setDeleting] = useState<Reservation | null>(null);
  const [form, setForm] = useState({ date: "", start: "", employeeId: "", serviceIds: [] as string[] });
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const [reservations, employeeRows, serviceRows] = await Promise.all([fetchReservations(), fetchEmployees(), fetchPrestations()]);
      setItems(reservations); setEmployees(employeeRows); setServices(serviceRows);
    } catch { toast.error("Impossible de charger les rendez-vous."); }
    finally { setLoading(false); }
  }
  useEffect(() => { void load(); }, []);

  const filtered = useMemo(() => {
    const today = iso(); const endDate = new Date(); endDate.setDate(endDate.getDate() + 6); const weekEnd = iso(endDate);
    return items.filter((r) => {
      const name = `${r.first_name} ${r.last_name}`.toLocaleLowerCase("fr");
      const matchesDate = dateFilter === "all" || (dateFilter === "today" ? r.date === today : r.date >= today && r.date <= weekEnd);
      return name.includes(query.toLocaleLowerCase("fr")) && matchesDate && (employeeFilter === "all" || r.employee_id === employeeFilter);
    }).sort((a, b) => sort === "name" ? `${a.last_name}${a.first_name}`.localeCompare(`${b.last_name}${b.first_name}`, "fr") : sort === "time" ? a.start_time.localeCompare(b.start_time) : `${a.date}${a.start_time}`.localeCompare(`${b.date}${b.start_time}`));
  }, [items, query, dateFilter, employeeFilter, sort]);

  function openEdit(item: Reservation) {
    setEditing(item);
    setForm({ date: item.date, start: shortTime(item.start_time), employeeId: item.employee_id, serviceIds: item.reservation_prestations.map((p) => p.prestation_id) });
  }

  function toggleService(id: string) {
    setForm((old) => ({ ...old, serviceIds: old.serviceIds.includes(id) ? old.serviceIds.filter((x) => x !== id) : [...old.serviceIds, id] }));
  }

  async function save() {
    if (!editing || !form.date || !form.start || !form.employeeId || form.serviceIds.length === 0) { toast.error("Complétez la date, l'heure, l'employée et les prestations."); return; }
    const selected = services.filter((s) => form.serviceIds.includes(s.id));
    const duration = selected.reduce((sum, service) => sum + Number(service.duration), 0);
    const price = selected.reduce((sum, service) => sum + Number(service.price), 0);
    setSaving(true);
    const { error } = await adminClient.from("reservations").update({ date: form.date, start_time: `${form.start}:00`, end_time: calculateEndTime(form.start, duration), employee_id: form.employeeId, total_duration: duration, total_price: price }).eq("id", editing.id);
    if (!error) {
      const removed = await adminClient.from("reservation_prestations").delete().eq("reservation_id", editing.id);
      if (!removed.error) {
        const inserted = await adminClient.from("reservation_prestations").insert(form.serviceIds.map((prestation_id) => ({ reservation_id: editing.id, prestation_id })));
        if (inserted.error) { toast.error("Les prestations n'ont pas pu être mises à jour."); setSaving(false); return; }
      }
    }
    setSaving(false);
    if (error) {
      toast.error(error.message.toLocaleLowerCase().includes("overlap") ? "Ce créneau est déjà occupé pour cette employée, veuillez choisir un autre horaire." : "Le rendez-vous n'a pas pu être modifié.");
      return;
    }
    toast.success("Rendez-vous modifié."); setEditing(null); await load();
  }

  async function remove() {
    if (!deleting) return;
    const junction = await adminClient.from("reservation_prestations").delete().eq("reservation_id", deleting.id);
    const result = junction.error ? junction : await adminClient.from("reservations").delete().eq("id", deleting.id);
    if (result.error) toast.error("Le rendez-vous n'a pas pu être annulé.");
    else { toast.success("Rendez-vous annulé."); setDeleting(null); await load(); }
  }

  return <AdminShell title="Rendez-vous" subtitle="Consultez et gérez toutes les réservations">
    <div className="mb-5 grid gap-3 lg:grid-cols-[minmax(220px,1fr)_180px_210px_auto]">
      <div className="relative"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input className="pl-9" placeholder="Rechercher par nom…" value={query} onChange={(e) => setQuery(e.target.value)} /></div>
      <Select value={dateFilter} onValueChange={(v) => setDateFilter(v as DateFilter)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="today">Aujourd'hui</SelectItem><SelectItem value="week">Cette semaine</SelectItem><SelectItem value="all">Toutes les dates</SelectItem></SelectContent></Select>
      <Select value={employeeFilter} onValueChange={setEmployeeFilter}><SelectTrigger><SelectValue placeholder="Toutes les employées" /></SelectTrigger><SelectContent><SelectItem value="all">Toutes les employées</SelectItem>{employees.map((e) => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}</SelectContent></Select>
      <Button variant="outline" onClick={() => setSort(sort === "date" ? "time" : sort === "time" ? "name" : "date")}><ArrowUpDown />Trier : {sort === "date" ? "date" : sort === "time" ? "heure" : "nom"}</Button>
    </div>
    <section className="rounded-lg border border-gold/25 bg-card">
      {loading ? <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground"><LoaderCircle className="animate-spin" />Chargement…</div> : filtered.length === 0 ? <p className="py-16 text-center text-sm text-muted-foreground">Aucun rendez-vous ne correspond aux filtres.</p> :
      <Table><TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Heure</TableHead><TableHead>Cliente</TableHead><TableHead>Employée</TableHead><TableHead>Prestations</TableHead><TableHead>Durée</TableHead><TableHead>Prix</TableHead><TableHead>Contact</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader><TableBody>{filtered.map((r) => <TableRow key={r.id}><TableCell className="whitespace-nowrap">{formatAdminDate(r.date)}</TableCell><TableCell className="whitespace-nowrap tabular-nums">{shortTime(r.start_time)} – {shortTime(r.end_time)}</TableCell><TableCell className="font-medium">{r.first_name} {r.last_name}</TableCell><TableCell>{r.employees?.name ?? "—"}</TableCell><TableCell><div className="flex min-w-36 flex-wrap gap-1">{r.reservation_prestations.map((p) => <span key={p.prestation_id} className="rounded-sm bg-secondary px-2 py-1 text-xs">{p.prestations?.name ?? "Prestation"}</span>)}</div></TableCell><TableCell>{r.total_duration} min</TableCell><TableCell>{formatMoney(Number(r.total_price))}</TableCell><TableCell><div className="min-w-36 text-xs"><p>{r.email || "—"}</p><p className="mt-1 text-muted-foreground">{r.phone || "—"}</p></div></TableCell><TableCell><div className="flex justify-end gap-1"><Button size="icon" variant="ghost" aria-label="Modifier" onClick={() => openEdit(r)}><Pencil /></Button><Button size="icon" variant="ghost" className="text-destructive" aria-label="Annuler" onClick={() => setDeleting(r)}><Trash2 /></Button></div></TableCell></TableRow>)}</TableBody></Table>}
    </section>
    <Dialog open={editing !== null} onOpenChange={(open) => !open && setEditing(null)}><DialogContent className="max-w-xl"><DialogHeader><DialogTitle>Modifier le rendez-vous</DialogTitle><DialogDescription>La durée, le prix et l'heure de fin sont recalculés automatiquement.</DialogDescription></DialogHeader><div className="grid gap-4 sm:grid-cols-2"><div className="space-y-1.5"><Label htmlFor="appointment-date">Date</Label><Input id="appointment-date" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></div><div className="space-y-1.5"><Label htmlFor="appointment-time">Heure de début</Label><Input id="appointment-time" type="time" value={form.start} onChange={(e) => setForm({ ...form, start: e.target.value })} /></div><div className="space-y-1.5 sm:col-span-2"><Label>Employée</Label><Select value={form.employeeId} onValueChange={(employeeId) => setForm({ ...form, employeeId })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{employees.filter((e) => e.active || e.id === form.employeeId).map((e) => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}</SelectContent></Select></div><fieldset className="space-y-2 sm:col-span-2"><legend className="mb-2 text-sm font-medium">Prestations</legend><div className="grid gap-2 sm:grid-cols-2">{services.map((s) => <label key={s.id} className={`flex cursor-pointer items-center justify-between rounded-md border p-3 text-sm ${form.serviceIds.includes(s.id) ? "border-gold bg-secondary" : "border-input"}`}><span><span className="font-medium">{s.name}</span><span className="block text-xs text-muted-foreground">{s.duration} min · {formatMoney(Number(s.price))}</span></span><input type="checkbox" className="size-4 accent-primary" checked={form.serviceIds.includes(s.id)} onChange={() => toggleService(s.id)} /></label>)}</div></fieldset></div><DialogFooter><Button variant="outline" onClick={() => setEditing(null)}>Annuler</Button><Button disabled={saving} onClick={() => void save()}>{saving ? "Enregistrement…" : "Enregistrer"}</Button></DialogFooter></DialogContent></Dialog>
    <Dialog open={deleting !== null} onOpenChange={(open) => !open && setDeleting(null)}><DialogContent><DialogHeader><DialogTitle>Annuler ce rendez-vous ?</DialogTitle><DialogDescription>Le rendez-vous de {deleting?.first_name} {deleting?.last_name} sera supprimé définitivement.</DialogDescription></DialogHeader><DialogFooter><Button variant="outline" onClick={() => setDeleting(null)}>Garder</Button><Button variant="destructive" onClick={() => void remove()}>Oui, annuler</Button></DialogFooter></DialogContent></Dialog>
  </AdminShell>;
}
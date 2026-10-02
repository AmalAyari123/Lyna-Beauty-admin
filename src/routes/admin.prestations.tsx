import { createFileRoute } from "@tanstack/react-router";
import { ArrowUpDown, LoaderCircle, Pencil, Plus, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { AdminShell } from "@/components/admin/AdminShell";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { adminClient, fetchPrestations, formatMoney, type Prestation } from "@/lib/admin-client";
import { requireAdmin } from "@/lib/admin-route";

export const Route = createFileRoute("/admin/prestations")({
  ssr: false, beforeLoad: requireAdmin,
  head: () => ({ meta: [
    { title: "Prestations — Administration Lyna Beauty" },
    { name: "description", content: "Gestion du catalogue de prestations Lyna Beauty." },
    { property: "og:title", content: "Prestations — Administration Lyna Beauty" },
    { property: "og:description", content: "Gestion du catalogue de prestations Lyna Beauty." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" },
  ] }), component: PrestationsPage,
});

type FormState = { name: string; duration: string; price: string };
const emptyForm: FormState = { name: "", duration: "60", price: "" };

function PrestationsPage() {
  const [items, setItems] = useState<Prestation[]>([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState<"name" | "price">("name");
  const [editing, setEditing] = useState<Prestation | "new" | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [deleting, setDeleting] = useState<{ item: Prestation; count: number } | null>(null);
  const [saving, setSaving] = useState(false);
  async function load() { setLoading(true); try { setItems(await fetchPrestations()); } catch { toast.error("Impossible de charger les prestations."); } finally { setLoading(false); } }
  useEffect(() => { void load(); }, []);
  const sorted = useMemo(() => [...items].sort((a, b) => sort === "name" ? a.name.localeCompare(b.name, "fr") : Number(a.price) - Number(b.price)), [items, sort]);
  function openEdit(item: Prestation | "new") { setEditing(item); setForm(item === "new" ? emptyForm : { name: item.name, duration: String(item.duration), price: String(item.price) }); }
  async function save() {
    const duration = Number(form.duration); const price = Number(form.price);
    if (!form.name.trim() || duration <= 0 || price < 0 || Number.isNaN(duration) || Number.isNaN(price)) { toast.error("Vérifiez le nom, la durée et le prix."); return; }
    setSaving(true);
    const payload = { name: form.name.trim(), duration, price };
    const result = editing === "new" ? await adminClient.from("prestations").insert(payload) : await adminClient.from("prestations").update(payload).eq("id", editing?.id ?? "");
    setSaving(false);
    if (result.error) { toast.error("La prestation n'a pas pu être enregistrée."); return; }
    toast.success(editing === "new" ? "Prestation ajoutée." : "Prestation modifiée."); setEditing(null); await load();
  }
  async function askDelete(item: Prestation) {
    const { count } = await adminClient.from("reservation_prestations").select("id", { count: "exact", head: true }).eq("prestation_id", item.id);
    setDeleting({ item, count: count ?? 0 });
  }
  async function remove() {
    if (!deleting) return;
    const { error } = await adminClient.from("prestations").delete().eq("id", deleting.item.id);
    if (error) toast.error("Suppression impossible. Cette prestation peut être liée à des rendez-vous.");
    else { toast.success("Prestation supprimée."); setDeleting(null); await load(); }
  }
  return <AdminShell title="Prestations" subtitle="Gérez les services, durées et tarifs">
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3"><p className="text-sm text-muted-foreground">{items.length} prestation{items.length > 1 ? "s" : ""}</p><div className="flex gap-2"><Button variant="outline" onClick={() => setSort(sort === "name" ? "price" : "name")}><ArrowUpDown />Trier par {sort === "name" ? "prix" : "nom"}</Button><Button onClick={() => openEdit("new")}><Plus />Ajouter une prestation</Button></div></div>
    <section className="rounded-lg border border-gold/25 bg-card">{loading ? <Loading /> : sorted.length === 0 ? <Empty text="Aucune prestation enregistrée." /> : <Table><TableHeader><TableRow><TableHead>Nom</TableHead><TableHead>Durée</TableHead><TableHead>Prix</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader><TableBody>{sorted.map((p) => <TableRow key={p.id}><TableCell className="font-medium">{p.name}</TableCell><TableCell>{p.duration} min</TableCell><TableCell>{formatMoney(Number(p.price))}</TableCell><TableCell><div className="flex justify-end gap-1"><Button size="icon" variant="ghost" aria-label={`Modifier ${p.name}`} onClick={() => openEdit(p)}><Pencil /></Button><Button size="icon" variant="ghost" className="text-destructive" aria-label={`Supprimer ${p.name}`} onClick={() => void askDelete(p)}><Trash2 /></Button></div></TableCell></TableRow>)}</TableBody></Table>}</section>
    <Dialog open={editing !== null} onOpenChange={(o) => !o && setEditing(null)}><DialogContent><DialogHeader><DialogTitle>{editing === "new" ? "Ajouter une prestation" : "Modifier la prestation"}</DialogTitle><DialogDescription>Renseignez les informations visibles dans le catalogue.</DialogDescription></DialogHeader><div className="grid gap-4 sm:grid-cols-2"><div className="space-y-1.5 sm:col-span-2"><Label htmlFor="service-name">Nom</Label><Input id="service-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div><div className="space-y-1.5"><Label htmlFor="service-duration">Durée (minutes)</Label><Input id="service-duration" type="number" min="5" step="5" value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} /></div><div className="space-y-1.5"><Label htmlFor="service-price">Prix (DT)</Label><Input id="service-price" type="number" min="0" step="0.5" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} /></div></div><DialogFooter><Button variant="outline" onClick={() => setEditing(null)}>Annuler</Button><Button onClick={() => void save()} disabled={saving}>{saving ? "Enregistrement…" : "Enregistrer"}</Button></DialogFooter></DialogContent></Dialog>
    <Dialog open={deleting !== null} onOpenChange={(o) => !o && setDeleting(null)}><DialogContent><DialogHeader><DialogTitle>Supprimer cette prestation ?</DialogTitle><DialogDescription>{deleting?.count ? `Cette prestation est utilisée dans ${deleting.count} rendez-vous. La supprimer ne les affectera pas rétroactivement mais elle ne sera plus proposée aux futurs clients.` : "Cette action est définitive."}</DialogDescription></DialogHeader><DialogFooter><Button variant="outline" onClick={() => setDeleting(null)}>Garder</Button><Button variant="destructive" onClick={() => void remove()}>Supprimer</Button></DialogFooter></DialogContent></Dialog>
  </AdminShell>;
}

function Loading() { return <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground"><LoaderCircle className="size-4 animate-spin" />Chargement…</div>; }
function Empty({ text }: { text: string }) { return <p className="py-16 text-center text-sm text-muted-foreground">{text}</p>; }
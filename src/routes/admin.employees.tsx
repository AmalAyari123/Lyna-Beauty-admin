import { createFileRoute } from "@tanstack/react-router";
import { LoaderCircle, Pencil, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AdminShell } from "@/components/admin/AdminShell";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { adminClient, fetchEmployees, type Employee } from "@/lib/admin-client";
import { requireAdmin } from "@/lib/admin-route";

export const Route = createFileRoute("/admin/employees")({
  ssr: false, beforeLoad: requireAdmin,
  head: () => ({ meta: [
    { title: "Employées — Administration Lyna Beauty" }, { name: "description", content: "Gestion de l’équipe Lyna Beauty." },
    { property: "og:title", content: "Employées — Administration Lyna Beauty" }, { property: "og:description", content: "Gestion de l’équipe Lyna Beauty." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" },
  ] }), component: EmployeesPage,
});

function EmployeesPage() {
  const [items, setItems] = useState<Employee[]>([]); const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Employee | "new" | null>(null); const [name, setName] = useState("");
  const [deleting, setDeleting] = useState<Employee | null>(null); const [saving, setSaving] = useState(false);
  async function load() { setLoading(true); try { setItems(await fetchEmployees()); } catch { toast.error("Impossible de charger les employées."); } finally { setLoading(false); } }
  useEffect(() => { void load(); }, []);
  function open(item: Employee | "new") { setEditing(item); setName(item === "new" ? "" : item.name); }
  async function save() { if (!name.trim()) { toast.error("Indiquez le nom de l'employée."); return; } setSaving(true); const result = editing === "new" ? await adminClient.from("employees").insert({ name: name.trim(), active: true }) : await adminClient.from("employees").update({ name: name.trim() }).eq("id", editing?.id ?? ""); setSaving(false); if (result.error) toast.error("Enregistrement impossible."); else { toast.success(editing === "new" ? "Employée ajoutée." : "Nom modifié."); setEditing(null); await load(); } }
  async function toggle(item: Employee, active: boolean) { setItems((all) => all.map((x) => x.id === item.id ? { ...x, active } : x)); const { error } = await adminClient.from("employees").update({ active }).eq("id", item.id); if (error) { toast.error("Le statut n'a pas pu être modifié."); await load(); } else toast.success(active ? "Employée activée." : "Employée désactivée."); }
  async function remove() { if (!deleting) return; const { error } = await adminClient.from("employees").delete().eq("id", deleting.id); if (error) toast.error("Suppression impossible. Cette employée peut avoir des rendez-vous associés."); else { toast.success("Employée supprimée."); setDeleting(null); await load(); } }
  return <AdminShell title="Employées" subtitle="Gérez l’équipe et les disponibilités">
    <div className="mb-5 flex items-center justify-between gap-3"><p className="text-sm text-muted-foreground">{items.filter((x) => x.active).length} active{items.filter((x) => x.active).length > 1 ? "s" : ""}</p><Button onClick={() => open("new")}><Plus />Ajouter une employée</Button></div>
    <section className="rounded-lg border border-gold/25 bg-card">{loading ? <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground"><LoaderCircle className="animate-spin" />Chargement…</div> : items.length === 0 ? <p className="py-16 text-center text-sm text-muted-foreground">Aucune employée enregistrée.</p> : <Table><TableHeader><TableRow><TableHead>Nom</TableHead><TableHead>Statut</TableHead><TableHead>Disponibilité</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader><TableBody>{items.map((e) => <TableRow key={e.id}><TableCell className="font-medium">{e.name}</TableCell><TableCell><span className={`rounded-sm px-2 py-1 text-xs font-medium ${e.active ? "bg-available text-available-foreground" : "bg-muted text-muted-foreground"}`}>{e.active ? "Active" : "Inactive"}</span></TableCell><TableCell><Switch checked={e.active} onCheckedChange={(v) => void toggle(e, v)} aria-label={`${e.active ? "Désactiver" : "Activer"} ${e.name}`} /></TableCell><TableCell><div className="flex justify-end gap-1"><Button size="icon" variant="ghost" aria-label={`Modifier ${e.name}`} onClick={() => open(e)}><Pencil /></Button><Button size="icon" variant="ghost" className="text-destructive" aria-label={`Supprimer ${e.name}`} onClick={() => setDeleting(e)}><Trash2 /></Button></div></TableCell></TableRow>)}</TableBody></Table>}</section>
    <Dialog open={editing !== null} onOpenChange={(o) => !o && setEditing(null)}><DialogContent><DialogHeader><DialogTitle>{editing === "new" ? "Ajouter une employée" : "Modifier l'employée"}</DialogTitle><DialogDescription>Le nom sera utilisé dans les rendez-vous et les disponibilités.</DialogDescription></DialogHeader><div className="space-y-1.5"><Label htmlFor="employee-name">Nom</Label><Input id="employee-name" value={name} onChange={(e) => setName(e.target.value)} /></div><DialogFooter><Button variant="outline" onClick={() => setEditing(null)}>Annuler</Button><Button onClick={() => void save()} disabled={saving}>{saving ? "Enregistrement…" : "Enregistrer"}</Button></DialogFooter></DialogContent></Dialog>
    <Dialog open={deleting !== null} onOpenChange={(o) => !o && setDeleting(null)}><DialogContent><DialogHeader><DialogTitle>Supprimer {deleting?.name} ?</DialogTitle><DialogDescription>Cette action est définitive. Si des rendez-vous sont associés, la suppression sera refusée.</DialogDescription></DialogHeader><DialogFooter><Button variant="outline" onClick={() => setDeleting(null)}>Garder</Button><Button variant="destructive" onClick={() => void remove()}>Supprimer</Button></DialogFooter></DialogContent></Dialog>
  </AdminShell>;
}
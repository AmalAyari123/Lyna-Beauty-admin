import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { BrandHeader } from "@/components/BrandHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { formatLongDate, slotLabel } from "@/lib/booking";

type Appt = {
  id: string;
  slot_date: string;
  slot_hour: number;
  full_name: string;
  note: string | null;
};

export const Route = createFileRoute("/mon-rendez-vous")({
  head: () => ({
    meta: [
      { title: "Annuler mon rendez-vous — Nails & Lashes by Lyna Beauty" },
      {
        name: "description",
        content:
          "Retrouvez et annulez votre rendez-vous avec votre numéro de téléphone ou votre email, puis fixez une autre date.",
      },
      { property: "og:title", content: "Annuler mon rendez-vous — Nails & Lashes by Lyna Beauty" },
      {
        property: "og:description",
        content: "Annulez votre rendez-vous en toute confidentialité et fixez une autre date.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ManagePage,
});

function ManagePage() {
  const [contact, setContact] = useState("");
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<Appt[]>([]);
  const [toCancel, setToCancel] = useState<Appt | null>(null);
  const [justCancelled, setJustCancelled] = useState(false);

  async function search(value = contact) {
    if (value.trim().length < 4) {
      toast.error("Entrez votre téléphone ou votre email.");
      return;
    }
    setLoading(true);
    const { data, error } = await supabase.rpc("find_my_appointments", { p_contact: value });
    setLoading(false);
    setSearched(true);
    if (error) {
      toast.error("Recherche impossible pour le moment.");
      return;
    }
    setItems((data as Appt[] | null) ?? []);
  }

  async function cancel() {
    if (!toCancel) return;
    const { data, error } = await supabase.rpc("cancel_appointment", {
      p_id: toCancel.id,
      p_contact: contact,
    });
    setToCancel(null);
    if (error || data === false) {
      toast.error("L'annulation a échoué.");
      return;
    }
    toast.success("Votre rendez-vous a été annulé.");
    setJustCancelled(true);
    void search();
  }

  return (
    <div className="mx-auto min-h-screen w-full max-w-2xl px-4 pb-16">
      <BrandHeader />

      <section className="card-soft rounded-3xl p-5 sm:p-6">
        <h2 className="font-display text-2xl">Annuler mon rendez-vous</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Saisissez le téléphone ou l'email utilisé lors de la réservation.
        </p>

        <form
          className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end"
          onSubmit={(e) => {
            e.preventDefault();
            void search();
          }}
        >
          <div className="flex-1 space-y-1.5">
            <Label htmlFor="contact">Téléphone ou email</Label>
            <Input
              id="contact"
              value={contact}
              maxLength={255}
              onChange={(e) => setContact(e.target.value)}
              placeholder="06 12 34 56 78"
            />
          </div>
          <Button type="submit" className="rounded-full sm:w-40" disabled={loading}>
            {loading ? "Recherche…" : "Rechercher"}
          </Button>
        </form>

        {justCancelled && (
          <div className="mt-6 rounded-2xl border border-gold/45 bg-available px-4 py-4 text-center">
            <p className="text-gilded font-display text-xl">Rendez-vous annulé</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Vous pouvez fixer une autre date dès maintenant.
            </p>
            <Button asChild className="mt-3 rounded-full">
              <Link to="/">Réserver une nouvelle date</Link>
            </Button>
          </div>
        )}

        {searched && items.length === 0 && !loading && (
          <p className="mt-6 rounded-2xl bg-muted px-4 py-3 text-sm text-muted-foreground">
            Aucun rendez-vous à venir trouvé avec ce contact.
          </p>
        )}

        <div className="mt-6 space-y-3">
          {items.map((a) => (
            <div
              key={a.id}
              className="rounded-2xl border border-gold/40 bg-available p-4 text-available-foreground"
            >
              <p className="font-display text-lg capitalize">{formatLongDate(a.slot_date)}</p>
              <p className="text-sm tabular-nums">{slotLabel(a.slot_hour)}</p>
              <p className="mt-1 text-sm text-muted-foreground">{a.full_name}</p>
              {a.note && <p className="mt-1 text-sm text-muted-foreground italic">{a.note}</p>}
              <Button
                variant="outline"
                className="mt-3 w-full rounded-full border-destructive/40 text-destructive hover:bg-destructive/10"
                onClick={() => setToCancel(a)}
              >
                Annuler mon rendez-vous
              </Button>
            </div>
          ))}
        </div>
      </section>

      <AlertDialog open={toCancel !== null} onOpenChange={(o) => !o && setToCancel(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display text-xl">Êtes-vous sûr ?</AlertDialogTitle>
            <AlertDialogDescription>
              {toCancel && (
                <span className="capitalize">
                  {formatLongDate(toCancel.slot_date)} · {slotLabel(toCancel.slot_hour)}
                </span>
              )}{" "}
              — ce créneau redeviendra disponible pour d'autres clientes.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-full">Garder</AlertDialogCancel>
            <AlertDialogAction
              className="rounded-full bg-destructive text-destructive-foreground"
              onClick={cancel}
            >
              Oui, annuler
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

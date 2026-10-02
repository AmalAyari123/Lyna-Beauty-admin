import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { type Reservation, type ReservationUpdate, SERVICES } from "@/lib/reservations";

interface EditReservationDialogProps {
  reservation: Reservation | null;
  onClose: () => void;
  saving: boolean;
  onSave: (id: string, values: ReservationUpdate) => void;
}

export function EditReservationDialog({ reservation, onClose, saving, onSave }: EditReservationDialogProps) {
  const [values, setValues] = useState<ReservationUpdate | null>(null);

  useEffect(() => {
    if (reservation) {
      setValues({
        date: reservation.date,
        time: reservation.time,
        last_name: reservation.last_name,
        first_name: reservation.first_name,
        service: reservation.service,
        duration: reservation.duration,
        email: reservation.email,
        phone: reservation.phone,
      });
    } else {
      setValues(null);
    }
  }, [reservation]);

  if (!reservation || !values) return null;

  return (
    <Dialog open={!!reservation} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Modifier le rendez-vous</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Date</Label>
              <Input type="date" value={values.date} onChange={(e) => setValues({ ...values, date: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Heure</Label>
              <Input type="time" value={values.time} onChange={(e) => setValues({ ...values, time: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nom</Label>
              <Input value={values.last_name} onChange={(e) => setValues({ ...values, last_name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Prénom</Label>
              <Input value={values.first_name} onChange={(e) => setValues({ ...values, first_name: e.target.value })} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Prestation</Label>
            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
              value={values.service}
              onChange={(e) => setValues({ ...values, service: e.target.value })}
            >
              {SERVICES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label>Durée (min)</Label>
            <Input type="number" value={values.duration} onChange={(e) => setValues({ ...values, duration: Number(e.target.value) })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" value={values.email || ""} onChange={(e) => setValues({ ...values, email: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Téléphone</Label>
              <Input value={values.phone || ""} onChange={(e) => setValues({ ...values, phone: e.target.value })} />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>Annuler</Button>
          <Button onClick={() => onSave(reservation.id, values)} disabled={saving}>
            {saving ? "Enregistrement..." : "Enregistrer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

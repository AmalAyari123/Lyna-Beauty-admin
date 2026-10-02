export const SLOT_HOURS = [10, 11, 12, 13, 14, 15, 16, 17, 18, 19];

export const SERVICES = [
  "Remplissage mains",
  "Vernis pieds + soin",
  "Cils à cils",
  "Vernis pieds",
  "Vernis permanent main",
  "Autre prestation",
];

export function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function fromISODate(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y!, (m ?? 1) - 1, d ?? 1);
}

export function formatLongDate(s: string): string {
  return fromISODate(s).toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function slotLabel(hour: number): string {
  return `${hour}h00 – ${hour + 1}h00`;
}

export function isPastSlot(isoDate: string, hour: number): boolean {
  const d = fromISODate(isoDate);
  d.setHours(hour, 0, 0, 0);
  return d.getTime() < Date.now();
}

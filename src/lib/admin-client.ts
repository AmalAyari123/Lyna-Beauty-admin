import { createClient } from "@supabase/supabase-js";

const ADMIN_URL = "https://ppnqulrqowsaxvsdxoqc.supabase.co";
const ADMIN_PUBLISHABLE_KEY = "sb_publishable_e2giCalNyEryfRVO8JaWTw_kq6nOyuj";

export const adminClient = createClient(ADMIN_URL, ADMIN_PUBLISHABLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

export type Prestation = {
  id: string;
  name: string;
  duration: number;
  price: number;
  created_at?: string;
};

export type Employee = {
  id: string;
  name: string;
  active: boolean;
  created_at?: string;
};

export type ReservationPrestation = {
  prestation_id: string;
  prestations: Prestation | null;
};

export type Reservation = {
  id: string;
  first_name: string;
  last_name: string;
  date: string;
  start_time: string;
  end_time: string;
  employee_id: string;
  total_duration: number;
  total_price: number;
  email: string | null;
  phone: string | null;
  created_at?: string;
  employees: Employee | null;
  reservation_prestations: ReservationPrestation[];
};

export async function fetchReservations(): Promise<Reservation[]> {
  const { data, error } = await adminClient
    .from("reservations")
    .select("id,first_name,last_name,date,start_time,end_time,employee_id,total_duration,total_price,email,phone,created_at,employees(id,name,active),reservation_prestations(prestation_id,prestations(id,name,duration,price))")
    .order("date", { ascending: true })
    .order("start_time", { ascending: true });
  if (error) throw error;
  return (data ?? []) as unknown as Reservation[];
}

export async function fetchPrestations(): Promise<Prestation[]> {
  const { data, error } = await adminClient.from("prestations").select("id,name,duration,price,created_at");
  if (error) throw error;
  return (data ?? []) as Prestation[];
}

export async function fetchEmployees(): Promise<Employee[]> {
  const { data, error } = await adminClient.from("employees").select("id,name,active,created_at").order("name");
  if (error) throw error;
  return (data ?? []) as Employee[];
}

export function formatMoney(value: number): string {
  return new Intl.NumberFormat("fr-TN", { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(value) + " DT";
}

export function formatAdminDate(date: string): string {
  return new Date(`${date}T12:00:00`).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
}

export function shortTime(value: string): string {
  return value.slice(0, 5);
}

export function calculateEndTime(start: string, duration: number): string {
  const [hours = 0, minutes = 0] = start.split(":").map(Number);
  const total = hours * 60 + minutes + duration;
  return `${String(Math.floor(total / 60) % 24).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}:00`;
}
import { redirect } from "@tanstack/react-router";
import { isAdminAuthenticated } from "@/lib/admin-auth";

export function requireAdmin() {
  if (!isAdminAuthenticated()) throw redirect({ to: "/admin" });
}
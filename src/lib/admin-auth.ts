export const ADMIN_STORAGE_KEY = "lyna-admin-authenticated";

export function isAdminAuthenticated(): boolean {
  return typeof window !== "undefined" && window.localStorage.getItem(ADMIN_STORAGE_KEY) === "true";
}

export function setAdminAuthenticated(value: boolean): void {
  if (typeof window === "undefined") return;
  if (value) window.localStorage.setItem(ADMIN_STORAGE_KEY, "true");
  else window.localStorage.removeItem(ADMIN_STORAGE_KEY);
}
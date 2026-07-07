import type { AppUser } from "@/types";

const STORAGE_KEY = "current_user";

export function getCurrentUser(): AppUser | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const user = JSON.parse(raw) as AppUser;
    if (!user?.id || !user?.email) return null;
    return user;
  } catch {
    return null;
  }
}

export function setCurrentUser(user: AppUser): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
}

export function clearCurrentUser(): void {
  localStorage.removeItem(STORAGE_KEY);
}

import { createClient } from "@/utils/supabase/client";
import type { AppUser } from "@/types";

export async function fetchUserByEmail(email: string): Promise<AppUser | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("users")
    .select("id, name, email")
    .eq("email", email)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw error;
  }

  return data;
}

export async function fetchLoginUsers(): Promise<AppUser[]> {
  const supabase = createClient();
  const emails = ["alice@test.com", "bob@test.com"];
  const { data, error } = await supabase
    .from("users")
    .select("id, name, email")
    .in("email", emails);

  if (error) throw error;
  return data ?? [];
}

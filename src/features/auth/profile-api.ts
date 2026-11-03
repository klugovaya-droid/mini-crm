import { mapDbError } from "@/lib/db-errors";
import { getSupabaseClient } from "@/lib/supabase";
import type { Profile } from "@/types/domain";

export async function listWorkers(): Promise<Profile[]> {
  const { data, error } = await getSupabaseClient()
    .from("profiles")
    .select("*")
    .eq("role", "worker")
    .order("full_name");

  if (error) throw new Error(mapDbError(error));
  return data;
}

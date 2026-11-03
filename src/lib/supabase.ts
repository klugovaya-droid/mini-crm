import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import { hasSupabaseEnv, readSupabaseEnv } from "@/lib/env";

export function createSupabaseClient(
  url: string,
  anonKey: string,
): ReturnType<typeof createClient<Database>> {
  return createClient<Database>(url, anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
}

let browserClient: ReturnType<typeof createSupabaseClient> | null = null;

export function getSupabaseClient(): ReturnType<typeof createSupabaseClient> {
  if (!browserClient) {
    if (!hasSupabaseEnv()) {
      throw new Error("Supabase environment variables are not configured.");
    }
    const env = readSupabaseEnv();
    browserClient = createSupabaseClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);
  }
  return browserClient;
}

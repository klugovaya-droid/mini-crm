import { z } from "zod";

const envSchema = z.object({
  VITE_SUPABASE_URL: z.string().url(),
  VITE_SUPABASE_ANON_KEY: z.string().min(1),
});

export type SupabaseEnv = z.infer<typeof envSchema>;

export function readSupabaseEnv(
  source: Record<string, string | boolean | undefined> = import.meta.env,
): SupabaseEnv {
  const parsed = envSchema.safeParse({
    VITE_SUPABASE_URL: source.VITE_SUPABASE_URL,
    VITE_SUPABASE_ANON_KEY: source.VITE_SUPABASE_ANON_KEY,
  });

  if (!parsed.success) {
    throw new Error(
      "Не настроены VITE_SUPABASE_URL и VITE_SUPABASE_ANON_KEY. Проверьте .env.local.",
    );
  }

  return parsed.data;
}

export function hasSupabaseEnv(
  source: Record<string, string | boolean | undefined> = import.meta.env,
): boolean {
  return Boolean(source.VITE_SUPABASE_URL && source.VITE_SUPABASE_ANON_KEY);
}

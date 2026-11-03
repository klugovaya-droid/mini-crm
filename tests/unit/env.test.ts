import { describe, expect, it } from "vitest";
import { hasSupabaseEnv, readSupabaseEnv } from "@/lib/env";

describe("readSupabaseEnv", () => {
  it("parses a valid environment", () => {
    const env = readSupabaseEnv({
      VITE_SUPABASE_URL: "http://127.0.0.1:54321",
      VITE_SUPABASE_ANON_KEY: "anon-key",
    });

    expect(env.VITE_SUPABASE_URL).toBe("http://127.0.0.1:54321");
  });

  it("rejects an incomplete environment", () => {
    expect(() =>
      readSupabaseEnv({
        VITE_SUPABASE_URL: "http://127.0.0.1:54321",
      }),
    ).toThrow(/VITE_SUPABASE_URL/);
  });

  it("detects missing variables", () => {
    expect(hasSupabaseEnv({})).toBe(false);
  });
});

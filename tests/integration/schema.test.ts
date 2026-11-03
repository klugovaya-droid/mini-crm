import { createClient } from "@supabase/supabase-js";
import { describe, expect, it } from "vitest";
import type { Database } from "@/lib/database.types";

const url = process.env.VITE_SUPABASE_URL;
const anonKey = process.env.VITE_SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const password = process.env.DEMO_PASSWORD ?? "Demo1234!";

if (!url || !anonKey || !serviceRoleKey) {
  throw new Error("Local Supabase env is missing. Run `npm run db:start && npm run env:local`.");
}

const admin = createClient<Database>(url, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});
const anon = createClient<Database>(url, anonKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

describe("schema and seed", () => {
  it("creates the domain tables", async () => {
    for (const table of ["profiles", "projects", "tasks", "task_status_history"] as const) {
      const { error } = await admin.from(table).select("*").limit(1);
      expect(error, table).toBeNull();
    }
  });

  it("seeds one manager and two workers", async () => {
    const { data, error } = await admin.from("profiles").select("role").order("role");
    expect(error).toBeNull();
    expect(data).toHaveLength(3);
    expect(data?.filter((profile) => profile.role === "manager")).toHaveLength(1);
    expect(data?.filter((profile) => profile.role === "worker")).toHaveLength(2);
  });

  it("allows seeded users to sign in", async () => {
    const { data, error } = await anon.auth.signInWithPassword({
      email: "manager@demo.local",
      password,
    });

    expect(error).toBeNull();
    expect(data.session).not.toBeNull();
    await anon.auth.signOut();
  });
});

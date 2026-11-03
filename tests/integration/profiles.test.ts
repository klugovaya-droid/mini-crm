import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { afterEach, describe, expect, it } from "vitest";
import type { Database } from "@/lib/database.types";

const url = process.env.VITE_SUPABASE_URL!;
const anonKey = process.env.VITE_SUPABASE_ANON_KEY!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const password = process.env.DEMO_PASSWORD ?? "Demo1234!";

const admin = createClient<Database>(url, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const clients: SupabaseClient<Database>[] = [];

async function signIn(email: string): Promise<SupabaseClient<Database>> {
  const client = createClient<Database>(url, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  clients.push(client);
  const { error } = await client.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return client;
}

afterEach(async () => {
  await Promise.all(clients.splice(0).map((client) => client.auth.signOut()));
});

describe("profiles RLS", () => {
  it("lets a manager see every profile", async () => {
    const client = await signIn("manager@demo.local");
    const { data, error } = await client.from("profiles").select("id, role");

    expect(error).toBeNull();
    expect(data).toHaveLength(3);
  });

  it("lets a worker see only self and managers", async () => {
    const client = await signIn("worker1@demo.local");
    const { data, error } = await client.from("profiles").select("id, role");

    expect(error).toBeNull();
    expect(data).toHaveLength(2);
    expect(data?.some((profile) => profile.role === "manager")).toBe(true);
  });

  it("does not let a worker promote themselves", async () => {
    const client = await signIn("worker1@demo.local");
    const { data: own } = await client
      .from("profiles")
      .select("id")
      .eq("id", (await client.auth.getUser()).data.user!.id)
      .single();

    const { error } = await client
      .from("profiles")
      .update({ role: "manager" })
      .eq("id", own!.id);

    expect(error).not.toBeNull();
  });

  it("rejects public sign-ups", async () => {
    const client = createClient<Database>(url, anonKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { error } = await client.auth.signUp({
      email: `signup-${Date.now()}@demo.local`,
      password: "Demo1234!",
    });

    expect(error).not.toBeNull();
  });

  it("creates a profile when an auth user is created", async () => {
    const email = `trigger-${Date.now()}@demo.local`;
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: "Тестовый пользователь" },
      app_metadata: { role: "manager" },
    });
    expect(error).toBeNull();
    expect(data.user).not.toBeNull();
    const userId = data.user!.id;

    const { data: profile, error: profileError } = await admin
      .from("profiles")
      .select("full_name, role")
      .eq("id", userId)
      .single();

    expect(profileError).toBeNull();
    expect(profile).toMatchObject({ full_name: "Тестовый пользователь", role: "worker" });

    await admin.auth.admin.deleteUser(userId);
  });
});

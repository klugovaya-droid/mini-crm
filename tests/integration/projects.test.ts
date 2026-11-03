import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { afterAll, afterEach, describe, expect, it } from "vitest";
import type { Database } from "@/lib/database.types";

const url = process.env.VITE_SUPABASE_URL!;
const anonKey = process.env.VITE_SUPABASE_ANON_KEY!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const password = process.env.DEMO_PASSWORD ?? "Demo1234!";

const admin = createClient<Database>(url, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const clients: SupabaseClient<Database>[] = [];
const createdProjectIds: string[] = [];
const createdTaskIds: string[] = [];

async function signIn(email: string): Promise<SupabaseClient<Database>> {
  const client = createClient<Database>(url, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  clients.push(client);
  const { error } = await client.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return client;
}

async function userId(email: string): Promise<string> {
  const { data, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (error) throw error;
  const user = data.users.find((item) => item.email === email);
  if (!user) throw new Error(`User ${email} not found`);
  return user.id;
}

afterEach(async () => {
  await Promise.all(clients.splice(0).map((client) => client.auth.signOut()));
});

afterAll(async () => {
  for (const taskId of createdTaskIds.splice(0)) {
    await admin.from("tasks").delete().eq("id", taskId);
  }
  for (const projectId of createdProjectIds.splice(0)) {
    await admin.from("projects").delete().eq("id", projectId);
  }
});

describe("projects RLS", () => {
  it("shows seeded projects to a manager", async () => {
    const manager = await signIn("manager@demo.local");
    const { data, error } = await manager.from("projects").select("id, name");

    expect(error).toBeNull();
    expect(data).toHaveLength(3);
  });

  it("shows no projects to a worker without tasks", async () => {
    const worker = await signIn("worker1@demo.local");
    const { data, error } = await worker.from("projects").select("id");

    expect(error).toBeNull();
    expect(data).toEqual([]);
  });

  it("does not let a worker create a project", async () => {
    const worker = await signIn("worker1@demo.local");
    const workerId = await userId("worker1@demo.local");

    const { error } = await worker.from("projects").insert({
      name: "Запрещённый объект",
      address: "Нигде",
      created_by: workerId,
    });

    expect(error).not.toBeNull();
  });

  it("does not let a worker update a project", async () => {
    const manager = await signIn("manager@demo.local");
    const { data: project } = await manager.from("projects").select("id").limit(1).single();
    const worker = await signIn("worker1@demo.local");

    const { data, error } = await worker
      .from("projects")
      .update({ name: "Взлом" })
      .eq("id", project!.id)
      .select("id");

    expect(error).toBeNull();
    expect(data).toEqual([]);

    const { data: unchanged } = await manager
      .from("projects")
      .select("name")
      .eq("id", project!.id)
      .single();
    expect(unchanged?.name).not.toBe("Взлом");
  });

  it("lets a manager create, edit and archive a project", async () => {
    const manager = await signIn("manager@demo.local");
    const managerId = await userId("manager@demo.local");
    const name = `Тестовый объект ${Date.now()}`;

    const { data: created, error: createError } = await manager
      .from("projects")
      .insert({ name, address: "Тестовый адрес", created_by: managerId })
      .select("id, name, deleted_at")
      .single();
    expect(createError).toBeNull();
    createdProjectIds.push(created!.id);

    const { data: updated, error: updateError } = await manager
      .from("projects")
      .update({ name: `${name} (изм.)` })
      .eq("id", created!.id)
      .select("id, name")
      .single();
    expect(updateError).toBeNull();
    expect(updated?.name).toBe(`${name} (изм.)`);

    const { error: archiveError } = await manager
      .from("projects")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", created!.id);
    expect(archiveError).toBeNull();

    const { data: visible } = await manager
      .from("projects")
      .select("id")
      .eq("id", created!.id)
      .is("deleted_at", null)
      .maybeSingle();
    expect(visible).toBeNull();
  });

  it("shows a project to a worker with an active task there", async () => {
    const managerId = await userId("manager@demo.local");
    const worker1Id = await userId("worker1@demo.local");
    const name = `Объект с задачей ${Date.now()}`;

    const { data: project, error: projectError } = await admin
      .from("projects")
      .insert({ name, address: "Адрес", created_by: managerId })
      .select("id")
      .single();
    expect(projectError).toBeNull();
    createdProjectIds.push(project!.id);

    const { data: task, error: taskError } = await admin
      .from("tasks")
      .insert({
        project_id: project!.id,
        title: "Задача для worker1",
        assignee_id: worker1Id,
        author_id: managerId,
      })
      .select("id")
      .single();
    expect(taskError).toBeNull();
    createdTaskIds.push(task!.id);

    const worker1 = await signIn("worker1@demo.local");
    const { data: visible, error } = await worker1
      .from("projects")
      .select("id")
      .eq("id", project!.id);
    expect(error).toBeNull();
    expect(visible).toEqual([{ id: project!.id }]);

    const worker2 = await signIn("worker2@demo.local");
    const { data: hidden } = await worker2
      .from("projects")
      .select("id")
      .eq("id", project!.id);
    expect(hidden).toEqual([]);

    await admin
      .from("projects")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", project!.id);

    const { data: archived } = await worker1
      .from("projects")
      .select("id")
      .eq("id", project!.id);
    expect(archived).toEqual([]);
  });
});

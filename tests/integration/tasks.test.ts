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
const createdTaskIds: string[] = [];
const createdProjectIds: string[] = [];

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

async function createProject(name: string): Promise<string> {
  const managerId = await userId("manager@demo.local");
  const { data, error } = await admin
    .from("projects")
    .insert({ name, address: "Тестовый адрес", created_by: managerId })
    .select("id")
    .single();
  if (error) throw error;
  createdProjectIds.push(data.id);
  return data.id;
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

describe("tasks RLS", () => {
  it("shows all seeded tasks to a manager", async () => {
    const manager = await signIn("manager@demo.local");
    const { data, error } = await manager.from("tasks").select("id");

    expect(error).toBeNull();
    expect(data).toHaveLength(6);
  });

  it("shows only assigned tasks to each worker", async () => {
    const worker1 = await signIn("worker1@demo.local");
    const { data: tasks1, error: error1 } = await worker1.from("tasks").select("id");
    expect(error1).toBeNull();
    expect(tasks1).toHaveLength(3);

    const worker2 = await signIn("worker2@demo.local");
    const { data: tasks2, error: error2 } = await worker2.from("tasks").select("id");
    expect(error2).toBeNull();
    expect(tasks2).toHaveLength(3);

    const ids1 = new Set(tasks1!.map((task) => task.id));
    expect(tasks2!.some((task) => ids1.has(task.id))).toBe(false);
  });

  it("does not let a worker create or edit a task", async () => {
    const worker = await signIn("worker1@demo.local");
    const workerId = await userId("worker1@demo.local");
    const manager = await signIn("manager@demo.local");
    const { data: project } = await manager.from("projects").select("id").limit(1).single();
    const { data: task } = await manager.from("tasks").select("id").limit(1).single();

    const createResult = await worker.from("tasks").insert({
      project_id: project!.id,
      title: "Запрещённая задача",
      assignee_id: workerId,
      author_id: workerId,
    });
    expect(createResult.error).not.toBeNull();

    const updateResult = await worker
      .from("tasks")
      .update({ title: "Взлом" })
      .eq("id", task!.id)
      .select("id");
    expect(updateResult.data).toEqual([]);

    const statusResult = await worker
      .from("tasks")
      .update({ status: "accepted" })
      .eq("id", task!.id)
      .select("id");
    expect(statusResult.error).not.toBeNull();
  });

  it("rejects an assignee who is not a worker", async () => {
    const manager = await signIn("manager@demo.local");
    const managerId = await userId("manager@demo.local");
    const { data: project } = await manager.from("projects").select("id").limit(1).single();

    const { error } = await manager.from("tasks").insert({
      project_id: project!.id,
      title: "Задача на руководителя",
      assignee_id: managerId,
      author_id: managerId,
    });

    expect(error).not.toBeNull();
  });

  it("rejects a non-new initial status", async () => {
    const manager = await signIn("manager@demo.local");
    const workerId = await userId("worker1@demo.local");
    const { data: project } = await manager.from("projects").select("id").limit(1).single();

    const { error } = await manager.from("tasks").insert({
      project_id: project!.id,
      title: "Сразу принята",
      status: "accepted",
      assignee_id: workerId,
      author_id: (await userId("manager@demo.local")),
    });

    expect(error).not.toBeNull();
  });

  it("lets a manager create, edit and archive a task", async () => {
    const manager = await signIn("manager@demo.local");
    const managerId = await userId("manager@demo.local");
    const workerId = await userId("worker1@demo.local");
    const { data: project } = await manager.from("projects").select("id").limit(1).single();

    const { data: created, error: createError } = await manager
      .from("tasks")
      .insert({
        project_id: project!.id,
        title: `Тестовая задача ${Date.now()}`,
        description: "Описание",
        assignee_id: workerId,
        author_id: managerId,
      })
      .select("id, status")
      .single();
    expect(createError).toBeNull();
    expect(created?.status).toBe("new");
    createdTaskIds.push(created!.id);

    const { data: updated, error: updateError } = await manager
      .from("tasks")
      .update({ title: "Тестовая задача (изм.)" })
      .eq("id", created!.id)
      .select("id, title")
      .single();
    expect(updateError).toBeNull();
    expect(updated?.title).toBe("Тестовая задача (изм.)");

    const { error: archiveError } = await manager
      .from("tasks")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", created!.id);
    expect(archiveError).toBeNull();

    const { data: visible } = await manager
      .from("tasks")
      .select("id")
      .eq("id", created!.id)
      .is("deleted_at", null)
      .maybeSingle();
    expect(visible).toBeNull();
  });

  it("hides tasks of an archived project from a worker", async () => {
    const managerId = await userId("manager@demo.local");
    const workerId = await userId("worker1@demo.local");
    const projectId = await createProject(`Архивный объект ${Date.now()}`);

    const { data: task, error } = await admin
      .from("tasks")
      .insert({
        project_id: projectId,
        title: "Задача в архиве",
        assignee_id: workerId,
        author_id: managerId,
      })
      .select("id")
      .single();
    expect(error).toBeNull();
    createdTaskIds.push(task!.id);

    const worker = await signIn("worker1@demo.local");
    const { data: before } = await worker.from("tasks").select("id").eq("id", task!.id);
    expect(before).toEqual([{ id: task!.id }]);

    await admin
      .from("projects")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", projectId);

    const { data: after } = await worker.from("tasks").select("id").eq("id", task!.id);
    expect(after).toEqual([]);
  });
});

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { afterAll, afterEach, describe, expect, it } from "vitest";
import type { Database } from "@/lib/database.types";
import type { TaskStatus } from "@/types/domain";

const url = process.env.VITE_SUPABASE_URL!;
const anonKey = process.env.VITE_SUPABASE_ANON_KEY!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const password = process.env.DEMO_PASSWORD ?? "Demo1234!";

const admin = createClient<Database>(url, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});
const anon = createClient<Database>(url, anonKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const clients: SupabaseClient<Database>[] = [];
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

async function seededProjectId(manager: SupabaseClient<Database>): Promise<string> {
  const { data, error } = await manager
    .from("projects")
    .select("id")
    .eq("name", "ЖК «Северный»")
    .single();
  if (error) throw error;
  return data.id;
}

async function createTask(
  manager: SupabaseClient<Database>,
  assigneeEmail = "worker1@demo.local",
): Promise<{ id: string; managerId: string; workerId: string }> {
  const managerId = await userId("manager@demo.local");
  const workerId = await userId(assigneeEmail);
  const projectId = await seededProjectId(manager);

  const { data, error } = await manager
    .from("tasks")
    .insert({
      project_id: projectId,
      title: `Workflow ${Date.now()} ${Math.random().toString(16).slice(2)}`,
      description: "Тестовая задача",
      assignee_id: workerId,
      author_id: managerId,
    })
    .select("id")
    .single();

  if (error) throw error;
  createdTaskIds.push(data.id);
  return { id: data.id, managerId, workerId };
}

async function statusOf(taskId: string): Promise<TaskStatus> {
  const { data, error } = await admin.from("tasks").select("status").eq("id", taskId).single();
  if (error) throw error;
  return data.status;
}

afterEach(async () => {
  await Promise.all(clients.splice(0).map((client) => client.auth.signOut()));
});

afterAll(async () => {
  const timestamp = new Date().toISOString();
  for (const taskId of createdTaskIds.splice(0)) {
    await admin.from("tasks").update({ deleted_at: timestamp }).eq("id", taskId);
  }
});

describe("workflow", () => {
  it("writes a creation history row", async () => {
    const manager = await signIn("manager@demo.local");
    const { id, managerId } = await createTask(manager);

    const { data, error } = await admin
      .from("task_status_history")
      .select("from_status, to_status, changed_by, comment")
      .eq("task_id", id);

    expect(error).toBeNull();
    expect(data).toEqual([
      {
        from_status: null,
        to_status: "new",
        changed_by: managerId,
        comment: null,
      },
    ]);
  });

  it("passes the full allowed workflow and stores history", async () => {
    const manager = await signIn("manager@demo.local");
    const worker1 = await signIn("worker1@demo.local");
    const { id, managerId, workerId } = await createTask(manager);

    const start = await worker1.rpc("transition_task", {
      p_task_id: id,
      p_to_status: "in_progress",
    });
    expect(start.error).toBeNull();
    expect(await statusOf(id)).toBe("in_progress");

    const review = await worker1.rpc("transition_task", {
      p_task_id: id,
      p_to_status: "on_review",
    });
    expect(review.error).toBeNull();

    const noComment = await manager.rpc("transition_task", {
      p_task_id: id,
      p_to_status: "rework",
    });
    expect(noComment.error).not.toBeNull();

    const rework = await manager.rpc("transition_task", {
      p_task_id: id,
      p_to_status: "rework",
      p_comment: "Добавьте фотоотчёт.",
    });
    expect(rework.error).toBeNull();
    expect(await statusOf(id)).toBe("rework");

    const resume = await worker1.rpc("transition_task", {
      p_task_id: id,
      p_to_status: "in_progress",
    });
    expect(resume.error).toBeNull();

    const reviewAgain = await worker1.rpc("transition_task", {
      p_task_id: id,
      p_to_status: "on_review",
    });
    expect(reviewAgain.error).toBeNull();

    const accepted = await manager.rpc("transition_task", {
      p_task_id: id,
      p_to_status: "accepted",
    });
    expect(accepted.error).toBeNull();
    expect(await statusOf(id)).toBe("accepted");

    const { data: history, error } = await admin
      .from("task_status_history")
      .select("from_status, to_status, changed_by, comment")
      .eq("task_id", id)
      .order("created_at");

    expect(error).toBeNull();
    expect(history).toHaveLength(7);
    expect(history?.map((entry) => entry.to_status)).toEqual([
      "new",
      "in_progress",
      "on_review",
      "rework",
      "in_progress",
      "on_review",
      "accepted",
    ]);
    expect(history?.[3].comment).toBe("Добавьте фотоотчёт.");
    expect(history?.[0].changed_by).toBe(managerId);
    expect(history?.[1].changed_by).toBe(workerId);
  });

  it("blocks invalid transitions and wrong actors", async () => {
    const manager = await signIn("manager@demo.local");
    const worker1 = await signIn("worker1@demo.local");
    const worker2 = await signIn("worker2@demo.local");
    const { id } = await createTask(manager);

    const managerStart = await manager.rpc("transition_task", {
      p_task_id: id,
      p_to_status: "in_progress",
    });
    expect(managerStart.error).not.toBeNull();

    const skipReview = await worker1.rpc("transition_task", {
      p_task_id: id,
      p_to_status: "on_review",
    });
    expect(skipReview.error).not.toBeNull();

    const otherWorker = await worker2.rpc("transition_task", {
      p_task_id: id,
      p_to_status: "in_progress",
    });
    expect(otherWorker.error).not.toBeNull();

    await worker1.rpc("transition_task", { p_task_id: id, p_to_status: "in_progress" });
    await worker1.rpc("transition_task", { p_task_id: id, p_to_status: "on_review" });

    const workerAccept = await worker1.rpc("transition_task", {
      p_task_id: id,
      p_to_status: "accepted",
    });
    expect(workerAccept.error).not.toBeNull();

    const whitespaceComment = await manager.rpc("transition_task", {
      p_task_id: id,
      p_to_status: "rework",
      p_comment: "   ",
    });
    expect(whitespaceComment.error).not.toBeNull();
  });

  it("does not allow direct status updates", async () => {
    const manager = await signIn("manager@demo.local");
    const { id } = await createTask(manager);

    const directClient = await manager
      .from("tasks")
      .update({ status: "accepted" })
      .eq("id", id);
    expect(directClient.error).not.toBeNull();

    const directAdmin = await admin
      .from("tasks")
      .update({ status: "accepted" })
      .eq("id", id);
    expect(directAdmin.error).not.toBeNull();

    const authorChange = await admin
      .from("tasks")
      .update({ author_id: (await userId("worker1@demo.local")) })
      .eq("id", id);
    expect(authorChange.error).not.toBeNull();
  });

  it("makes history append-only for every role", async () => {
    const manager = await signIn("manager@demo.local");
    const { id } = await createTask(manager);
    const { data: history } = await admin
      .from("task_status_history")
      .select("id")
      .eq("task_id", id)
      .single();

    const historyId = history!.id;

    const clientUpdate = await manager
      .from("task_status_history")
      .update({ comment: "взлом" })
      .eq("id", historyId);
    expect(clientUpdate.error).not.toBeNull();

    const clientDelete = await manager
      .from("task_status_history")
      .delete()
      .eq("id", historyId);
    expect(clientDelete.error).not.toBeNull();

    const clientInsert = await manager.from("task_status_history").insert({
      task_id: id,
      changed_by: (await userId("manager@demo.local")),
      from_status: "new",
      to_status: "accepted",
    });
    expect(clientInsert.error).not.toBeNull();

    const adminUpdate = await admin
      .from("task_status_history")
      .update({ comment: "взлом" })
      .eq("id", historyId);
    expect(adminUpdate.error).not.toBeNull();

    const adminDelete = await admin
      .from("task_status_history")
      .delete()
      .eq("id", historyId);
    expect(adminDelete.error).not.toBeNull();

    const adminInsert = await admin.from("task_status_history").insert({
      task_id: id,
      changed_by: (await userId("manager@demo.local")),
      from_status: "new",
      to_status: "accepted",
    });
    expect(adminInsert.error).not.toBeNull();
  });

  it("shows history only to the manager and the assigned worker", async () => {
    const manager = await signIn("manager@demo.local");
    const worker1 = await signIn("worker1@demo.local");
    const worker2 = await signIn("worker2@demo.local");
    const { id } = await createTask(manager);

    const { data: managerRows } = await manager
      .from("task_status_history")
      .select("id")
      .eq("task_id", id);
    expect(managerRows?.length).toBe(1);

    const { data: worker1Rows } = await worker1
      .from("task_status_history")
      .select("id")
      .eq("task_id", id);
    expect(worker1Rows?.length).toBe(1);

    const { data: worker2Rows } = await worker2
      .from("task_status_history")
      .select("id")
      .eq("task_id", id);
    expect(worker2Rows).toEqual([]);
  });

  it("rejects transitions for archived tasks and projects", async () => {
    const manager = await signIn("manager@demo.local");
    const worker1 = await signIn("worker1@demo.local");
    const { id } = await createTask(manager);

    await admin
      .from("tasks")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", id);

    const archivedTask = await worker1.rpc("transition_task", {
      p_task_id: id,
      p_to_status: "in_progress",
    });
    expect(archivedTask.error).not.toBeNull();

    const managerId = await userId("manager@demo.local");
    const workerId = await userId("worker1@demo.local");
    const { data: project } = await admin
      .from("projects")
      .insert({
        name: `Архив workflow ${Date.now()}`,
        address: "Тестовый адрес",
        created_by: managerId,
      })
      .select("id")
      .single();
    const { data: secondTask } = await admin
      .from("tasks")
      .insert({
        project_id: project!.id,
        title: `Задача в архиве ${Date.now()}`,
        assignee_id: workerId,
        author_id: managerId,
      })
      .select("id")
      .single();

    await admin
      .from("tasks")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", secondTask!.id);
    await admin
      .from("projects")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", project!.id);

    const archivedProject = await worker1.rpc("transition_task", {
      p_task_id: secondTask!.id,
      p_to_status: "in_progress",
    });
    expect(archivedProject.error).not.toBeNull();
  });

  it("does not expose the transition RPC to anon", async () => {
    const { error } = await anon.rpc("transition_task", {
      p_task_id: "00000000-0000-4000-8000-000000000000",
      p_to_status: "in_progress",
    });
    expect(error).not.toBeNull();
  });
});

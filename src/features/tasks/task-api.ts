import { mapDbError } from "@/lib/db-errors";
import { getSupabaseClient } from "@/lib/supabase";
import type { TaskWithPeople } from "@/types/domain";

const taskSelect =
  "*, assignee:profiles!tasks_assignee_id_fkey(id, full_name), author:profiles!tasks_author_id_fkey(id, full_name), project:projects!tasks_project_id_fkey(id, name, address)";

export interface TaskInput {
  project_id: string;
  title: string;
  description: string;
  assignee_id: string;
}

export async function listProjectTasks(projectId: string): Promise<TaskWithPeople[]> {
  const { data, error } = await getSupabaseClient()
    .from("tasks")
    .select(taskSelect)
    .eq("project_id", projectId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (error) throw new Error(mapDbError(error));
  return (data ?? []) as unknown as TaskWithPeople[];
}

export async function listMyTasks(userId: string): Promise<TaskWithPeople[]> {
  const { data, error } = await getSupabaseClient()
    .from("tasks")
    .select(taskSelect)
    .eq("assignee_id", userId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (error) throw new Error(mapDbError(error));
  return (data ?? []) as unknown as TaskWithPeople[];
}

export async function getTask(id: string): Promise<TaskWithPeople | null> {
  const { data, error } = await getSupabaseClient()
    .from("tasks")
    .select(taskSelect)
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) throw new Error(mapDbError(error));
  return (data as unknown as TaskWithPeople | null) ?? null;
}

export async function createTask(input: TaskInput, authorId: string): Promise<TaskWithPeople> {
  const { data, error } = await getSupabaseClient()
    .from("tasks")
    .insert({ ...input, author_id: authorId })
    .select(taskSelect)
    .single();

  if (error) throw new Error(mapDbError(error));
  return data as unknown as TaskWithPeople;
}

export async function updateTask(id: string, input: TaskInput): Promise<TaskWithPeople> {
  const { data, error } = await getSupabaseClient()
    .from("tasks")
    .update(input)
    .eq("id", id)
    .is("deleted_at", null)
    .select(taskSelect)
    .single();

  if (error) throw new Error(mapDbError(error));
  return data as unknown as TaskWithPeople;
}

export async function archiveTask(id: string): Promise<void> {
  const { error } = await getSupabaseClient()
    .from("tasks")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)
    .is("deleted_at", null);

  if (error) throw new Error(mapDbError(error));
}

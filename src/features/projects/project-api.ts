import { mapDbError } from "@/lib/db-errors";
import { getSupabaseClient } from "@/lib/supabase";
import type { Project } from "@/types/domain";

export interface ProjectInput {
  name: string;
  address: string;
}

export async function listProjects(): Promise<Project[]> {
  const { data, error } = await getSupabaseClient()
    .from("projects")
    .select("*")
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (error) throw new Error(mapDbError(error));
  return data;
}

export async function getProject(id: string): Promise<Project | null> {
  const { data, error } = await getSupabaseClient()
    .from("projects")
    .select("*")
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) throw new Error(mapDbError(error));
  return data;
}

export async function createProject(input: ProjectInput, createdBy: string): Promise<Project> {
  const { data, error } = await getSupabaseClient()
    .from("projects")
    .insert({ name: input.name, address: input.address, created_by: createdBy })
    .select("*")
    .single();

  if (error) throw new Error(mapDbError(error));
  return data;
}

export async function updateProject(id: string, input: ProjectInput): Promise<Project> {
  const { data, error } = await getSupabaseClient()
    .from("projects")
    .update({ name: input.name, address: input.address })
    .eq("id", id)
    .is("deleted_at", null)
    .select("*")
    .single();

  if (error) throw new Error(mapDbError(error));
  return data;
}

export async function archiveProject(id: string): Promise<void> {
  const { error } = await getSupabaseClient()
    .from("projects")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)
    .is("deleted_at", null);

  if (error) throw new Error(mapDbError(error));
}

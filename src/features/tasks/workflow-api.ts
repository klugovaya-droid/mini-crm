import { mapDbError } from "@/lib/db-errors";
import { getSupabaseClient } from "@/lib/supabase";
import type { HistoryEntryWithPerson, TaskStatus } from "@/types/domain";

export async function transitionTask(
  taskId: string,
  toStatus: TaskStatus,
  comment?: string,
): Promise<void> {
  const args = comment
    ? { p_task_id: taskId, p_to_status: toStatus, p_comment: comment }
    : { p_task_id: taskId, p_to_status: toStatus };

  const { error } = await getSupabaseClient().rpc("transition_task", args);
  if (error) throw new Error(mapDbError(error));
}

export async function listTaskHistory(taskId: string): Promise<HistoryEntryWithPerson[]> {
  const { data, error } = await getSupabaseClient()
    .from("task_status_history")
    .select(
      "*, changed_by_profile:profiles!task_status_history_changed_by_fkey(id, full_name)",
    )
    .eq("task_id", taskId)
    .order("created_at", { ascending: true });

  if (error) throw new Error(mapDbError(error));
  return (data ?? []) as unknown as HistoryEntryWithPerson[];
}

import type { AppRole, Profile, Task, TaskStatus } from "@/types/domain";

export interface TaskAction {
  to: TaskStatus;
  label: string;
  commentRequired?: boolean;
}

type TaskPermissionInput = Pick<Task, "status" | "assignee_id" | "deleted_at">;
type ProfilePermissionInput = Pick<Profile, "id" | "role">;

export function canTransition(
  profile: ProfilePermissionInput,
  task: TaskPermissionInput,
  to: TaskStatus,
): boolean {
  if (task.deleted_at) return false;

  if (profile.role === "worker") {
    if (task.assignee_id !== profile.id) return false;
    return (
      (task.status === "new" && to === "in_progress") ||
      (task.status === "in_progress" && to === "on_review") ||
      (task.status === "rework" && to === "in_progress")
    );
  }

  if (profile.role === "manager") {
    return task.status === "on_review" && (to === "accepted" || to === "rework");
  }

  return false;
}

export function availableActions(
  profile: ProfilePermissionInput,
  task: TaskPermissionInput,
): TaskAction[] {
  const actions: TaskAction[] = [];

  if (canTransition(profile, task, "in_progress")) {
    actions.push({
      to: "in_progress",
      label: task.status === "rework" ? "Продолжить работу" : "Взять в работу",
    });
  }
  if (canTransition(profile, task, "on_review")) {
    actions.push({ to: "on_review", label: "Отправить на проверку" });
  }
  if (canTransition(profile, task, "accepted")) {
    actions.push({ to: "accepted", label: "Принять" });
  }
  if (canTransition(profile, task, "rework")) {
    actions.push({
      to: "rework",
      label: "Вернуть на доработку",
      commentRequired: true,
    });
  }

  return actions;
}

export function canManageTasks(role: AppRole): boolean {
  return role === "manager";
}

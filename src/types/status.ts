import type { AppRole, TaskStatus } from "@/types/domain";

export const taskStatusLabels: Record<TaskStatus, string> = {
  new: "Новая",
  in_progress: "В работе",
  on_review: "На проверке",
  accepted: "Принята",
  rework: "На доработке",
};

export const taskStatusOrder: TaskStatus[] = [
  "new",
  "in_progress",
  "on_review",
  "rework",
  "accepted",
];

export const roleLabels: Record<AppRole, string> = {
  manager: "Руководитель",
  worker: "Исполнитель",
};

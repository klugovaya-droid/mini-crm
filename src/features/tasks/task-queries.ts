import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/features/auth/auth-context";
import {
  archiveTask,
  createTask,
  getTask,
  listMyTasks,
  listProjectTasks,
  updateTask,
  type TaskInput,
} from "@/features/tasks/task-api";
import { listTaskHistory, transitionTask } from "@/features/tasks/workflow-api";
import type { TaskStatus, TaskWithPeople } from "@/types/domain";

export const taskKeys = {
  project: (projectId: string) => ["project-tasks", projectId] as const,
  mine: (userId: string) => ["my-tasks", userId] as const,
  detail: (id: string) => ["task", id] as const,
  history: (id: string) => ["task-history", id] as const,
};

function invalidateTaskLists(
  queryClient: ReturnType<typeof useQueryClient>,
  task: TaskWithPeople,
) {
  void queryClient.invalidateQueries({ queryKey: taskKeys.project(task.project_id) });
  void queryClient.invalidateQueries({ queryKey: ["my-tasks"] });
}

export function useProjectTasks(projectId: string | undefined) {
  return useQuery({
    queryKey: taskKeys.project(projectId ?? ""),
    queryFn: () => listProjectTasks(projectId!),
    enabled: Boolean(projectId),
  });
}

export function useMyTasks() {
  const { profile } = useAuth();
  return useQuery({
    queryKey: taskKeys.mine(profile?.id ?? ""),
    queryFn: () => listMyTasks(profile!.id),
    enabled: Boolean(profile),
  });
}

export function useTask(id: string | undefined) {
  return useQuery({
    queryKey: taskKeys.detail(id ?? ""),
    queryFn: () => getTask(id!),
    enabled: Boolean(id),
  });
}

export function useTaskHistory(taskId: string | undefined) {
  return useQuery({
    queryKey: taskKeys.history(taskId ?? ""),
    queryFn: () => listTaskHistory(taskId!),
    enabled: Boolean(taskId),
  });
}

export function useTransitionTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      taskId,
      to,
      comment,
    }: {
      taskId: string;
      to: TaskStatus;
      comment?: string;
    }) => transitionTask(taskId, to, comment),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: taskKeys.detail(variables.taskId) });
      void queryClient.invalidateQueries({ queryKey: taskKeys.history(variables.taskId) });
      void queryClient.invalidateQueries({ queryKey: ["project-tasks"] });
      void queryClient.invalidateQueries({ queryKey: ["my-tasks"] });
    },
  });
}

export function useCreateTask() {
  const { profile } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: TaskInput) => {
      if (!profile) throw new Error("Профиль не загружен.");
      return createTask(input, profile.id);
    },
    onSuccess: (task) => {
      queryClient.setQueryData(taskKeys.detail(task.id), task);
      invalidateTaskLists(queryClient, task);
    },
  });
}

export function useUpdateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: TaskInput }) => updateTask(id, input),
    onSuccess: (task) => {
      queryClient.setQueryData(taskKeys.detail(task.id), task);
      invalidateTaskLists(queryClient, task);
    },
  });
}

export function useArchiveTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (task: TaskWithPeople) => archiveTask(task.id),
    onSuccess: (_data, task) => {
      queryClient.removeQueries({ queryKey: taskKeys.detail(task.id) });
      invalidateTaskLists(queryClient, task);
    },
  });
}

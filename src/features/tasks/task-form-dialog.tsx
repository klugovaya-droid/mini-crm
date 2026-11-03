import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useWorkers } from "@/features/auth/profile-queries";
import { useProjects } from "@/features/projects/project-queries";
import { useCreateTask, useUpdateTask } from "@/features/tasks/task-queries";
import { taskFormSchema, type TaskFormValues } from "@/features/tasks/task-schema";
import type { TaskWithPeople } from "@/types/domain";

interface TaskFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task?: TaskWithPeople;
  defaultProjectId?: string;
  onCreated?: (task: TaskWithPeople) => void;
}

export function TaskFormDialog({
  open,
  onOpenChange,
  task,
  defaultProjectId,
  onCreated,
}: TaskFormDialogProps) {
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const { data: projects } = useProjects();
  const { data: workers } = useWorkers();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      title: "",
      description: "",
      projectId: defaultProjectId ?? "",
      assigneeId: "",
    },
  });

  useEffect(() => {
    if (!open) return;
    setSubmitError(null);
    form.reset({
      title: task?.title ?? "",
      description: task?.description ?? "",
      projectId: task?.project_id ?? defaultProjectId ?? "",
      assigneeId: task?.assignee_id ?? "",
    });
  }, [open, task, defaultProjectId, form]);

  const pending = createTask.isPending || updateTask.isPending;

  async function onSubmit(values: TaskFormValues) {
    setSubmitError(null);
    const input = {
      project_id: values.projectId,
      title: values.title,
      description: values.description,
      assignee_id: values.assigneeId,
    };

    try {
      if (task) {
        await updateTask.mutateAsync({ id: task.id, input });
        toast.success("Задача обновлена");
      } else {
        const created = await createTask.mutateAsync(input);
        toast.success("Задача создана");
        onCreated?.(created);
      }
      onOpenChange(false);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Не удалось сохранить задачу.");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{task ? "Редактировать задачу" : "Новая задача"}</DialogTitle>
          <DialogDescription>
            Новая задача создаётся в статусе «Новая» и назначается исполнителю.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)} noValidate>
          <div className="space-y-2">
            <Label htmlFor="task-title">Название</Label>
            <Input
              id="task-title"
              placeholder="Проверить армирование фундамента"
              aria-invalid={Boolean(form.formState.errors.title)}
              aria-describedby={form.formState.errors.title ? "task-title-error" : undefined}
              {...form.register("title")}
            />
            {form.formState.errors.title ? (
              <p id="task-title-error" className="text-sm text-destructive">
                {form.formState.errors.title.message}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="task-description">Описание</Label>
            <Textarea
              id="task-description"
              rows={4}
              placeholder="Что нужно сделать и на что обратить внимание"
              aria-invalid={Boolean(form.formState.errors.description)}
              {...form.register("description")}
            />
            {form.formState.errors.description ? (
              <p className="text-sm text-destructive">
                {form.formState.errors.description.message}
              </p>
            ) : null}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Объект</Label>
              <Controller
                control={form.control}
                name="projectId"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger
                      aria-label="Объект"
                      aria-invalid={Boolean(form.formState.errors.projectId)}
                    >
                      <SelectValue placeholder="Выберите объект" />
                    </SelectTrigger>
                    <SelectContent>
                      {projects?.map((project) => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {form.formState.errors.projectId ? (
                <p className="text-sm text-destructive">
                  {form.formState.errors.projectId.message}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label>Исполнитель</Label>
              <Controller
                control={form.control}
                name="assigneeId"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger
                      aria-label="Исполнитель"
                      aria-invalid={Boolean(form.formState.errors.assigneeId)}
                    >
                      <SelectValue placeholder="Выберите исполнителя" />
                    </SelectTrigger>
                    <SelectContent>
                      {workers?.map((worker) => (
                        <SelectItem key={worker.id} value={worker.id}>
                          {worker.full_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {form.formState.errors.assigneeId ? (
                <p className="text-sm text-destructive">
                  {form.formState.errors.assigneeId.message}
                </p>
              ) : null}
            </div>
          </div>

          {submitError ? (
            <div
              role="alert"
              className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
            >
              {submitError}
            </div>
          ) : null}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={pending}
            >
              Отмена
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Сохраняем…" : "Сохранить"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

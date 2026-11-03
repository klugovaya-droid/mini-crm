import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
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
import { useCreateProject, useUpdateProject } from "@/features/projects/project-queries";
import {
  projectFormSchema,
  type ProjectFormValues,
} from "@/features/projects/project-schema";
import type { Project } from "@/types/domain";

interface ProjectFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project?: Project;
  onCreated?: (project: Project) => void;
}

export function ProjectFormDialog({
  open,
  onOpenChange,
  project,
  onCreated,
}: ProjectFormDialogProps) {
  const createProject = useCreateProject();
  const updateProject = useUpdateProject();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: { name: "", address: "" },
  });

  useEffect(() => {
    if (!open) return;
    setSubmitError(null);
    form.reset({ name: project?.name ?? "", address: project?.address ?? "" });
  }, [open, project, form]);

  const pending = createProject.isPending || updateProject.isPending;

  async function onSubmit(values: ProjectFormValues) {
    setSubmitError(null);
    try {
      if (project) {
        await updateProject.mutateAsync({ id: project.id, input: values });
        toast.success("Объект обновлён");
      } else {
        const created = await createProject.mutateAsync(values);
        toast.success("Объект создан");
        onCreated?.(created);
      }
      onOpenChange(false);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Не удалось сохранить объект.");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{project ? "Редактировать объект" : "Новый объект"}</DialogTitle>
          <DialogDescription>
            Название и адрес видны всем, у кого есть доступ к объекту.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)} noValidate>
          <div className="space-y-2">
            <Label htmlFor="project-name">Название</Label>
            <Input
              id="project-name"
              placeholder="ЖК «Северный»"
              aria-invalid={Boolean(form.formState.errors.name)}
              aria-describedby={form.formState.errors.name ? "project-name-error" : undefined}
              {...form.register("name")}
            />
            {form.formState.errors.name ? (
              <p id="project-name-error" className="text-sm text-destructive">
                {form.formState.errors.name.message}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="project-address">Адрес</Label>
            <Input
              id="project-address"
              placeholder="г. Москва, ул. Северная, 12"
              aria-invalid={Boolean(form.formState.errors.address)}
              aria-describedby={
                form.formState.errors.address ? "project-address-error" : undefined
              }
              {...form.register("address")}
            />
            {form.formState.errors.address ? (
              <p id="project-address-error" className="text-sm text-destructive">
                {form.formState.errors.address.message}
              </p>
            ) : null}
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

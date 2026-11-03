import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useArchiveProject } from "@/features/projects/project-queries";
import type { Project } from "@/types/domain";

interface ProjectArchiveDialogProps {
  project: Project | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onArchived?: (id: string) => void;
}

export function ProjectArchiveDialog({
  project,
  open,
  onOpenChange,
  onArchived,
}: ProjectArchiveDialogProps) {
  const archiveProject = useArchiveProject();

  async function archive() {
    if (!project) return;
    try {
      await archiveProject.mutateAsync(project.id);
      toast.success("Объект архивирован");
      onArchived?.(project.id);
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Не удалось архивировать объект.");
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Архивировать объект?</AlertDialogTitle>
          <AlertDialogDescription>
            «{project?.name}» исчезнет из списка. Задачи и история сохранятся.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Отмена</AlertDialogCancel>
          <AlertDialogAction onClick={() => void archive()}>Архивировать</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

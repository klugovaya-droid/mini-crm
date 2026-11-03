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
import { useArchiveTask } from "@/features/tasks/task-queries";
import type { TaskWithPeople } from "@/types/domain";

interface TaskArchiveDialogProps {
  task: TaskWithPeople | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onArchived?: (task: TaskWithPeople) => void;
}

export function TaskArchiveDialog({
  task,
  open,
  onOpenChange,
  onArchived,
}: TaskArchiveDialogProps) {
  const archiveTask = useArchiveTask();

  async function archive() {
    if (!task) return;
    try {
      await archiveTask.mutateAsync(task);
      toast.success("Задача архивирована");
      onArchived?.(task);
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Не удалось архивировать задачу.");
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Архивировать задачу?</AlertDialogTitle>
          <AlertDialogDescription>
            «{task?.title}» исчезнет из списков. История сохранится.
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

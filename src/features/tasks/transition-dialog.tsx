import { useEffect, useState } from "react";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { TaskAction } from "@/features/tasks/permissions";
import { useTransitionTask } from "@/features/tasks/task-queries";
import type { TaskWithPeople } from "@/types/domain";

interface TransitionDialogProps {
  task: TaskWithPeople;
  action: TaskAction | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TransitionDialog({
  task,
  action,
  open,
  onOpenChange,
}: TransitionDialogProps) {
  const transition = useTransitionTask();
  const [comment, setComment] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setComment("");
    setError(null);
  }, [open]);

  async function submit() {
    if (!action) return;
    if (action.commentRequired && !comment.trim()) {
      setError("Комментарий обязателен.");
      return;
    }

    setError(null);
    try {
      await transition.mutateAsync({
        taskId: task.id,
        to: action.to,
        comment: comment.trim() || undefined,
      });
      toast.success("Статус задачи обновлён");
      onOpenChange(false);
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : "Не удалось изменить статус.",
      );
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{action?.label ?? "Изменить статус"}</DialogTitle>
          <DialogDescription>
            {action?.to === "rework"
              ? "Опишите, что нужно доработать. Комментарий увидят исполнитель и руководители."
              : "Комментарий необязателен, но поможет понять причину решения."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Label htmlFor="transition-comment">Комментарий</Label>
          <Textarea
            id="transition-comment"
            rows={4}
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? "transition-comment-error" : undefined}
            placeholder={
              action?.to === "rework" ? "Что нужно исправить" : "Комментарий (необязательно)"
            }
          />
          {error ? (
            <p id="transition-comment-error" className="text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={transition.isPending}
          >
            Отмена
          </Button>
          <Button type="button" onClick={() => void submit()} disabled={transition.isPending}>
            {transition.isPending ? "Сохраняем…" : action?.label ?? "Подтвердить"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/features/auth/auth-context";
import { availableActions, type TaskAction } from "@/features/tasks/permissions";
import { useTransitionTask } from "@/features/tasks/task-queries";
import { TransitionDialog } from "@/features/tasks/transition-dialog";
import type { TaskWithPeople } from "@/types/domain";

const successMessages: Record<string, string> = {
  in_progress: "Задача взята в работу",
  on_review: "Задача отправлена на проверку",
  accepted: "Задача принята",
  rework: "Задача возвращена на доработку",
};

export function WorkflowActions({ task }: { task: TaskWithPeople }) {
  const { profile } = useAuth();
  const transition = useTransitionTask();
  const [dialogAction, setDialogAction] = useState<TaskAction | null>(null);

  if (!profile) return null;
  const actions = availableActions(profile, task);
  if (actions.length === 0) return null;

  async function run(action: TaskAction) {
    if (action.commentRequired) {
      setDialogAction(action);
      return;
    }

    try {
      await transition.mutateAsync({ taskId: task.id, to: action.to });
      toast.success(successMessages[action.to] ?? "Статус задачи обновлён");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Не удалось изменить статус.");
    }
  }

  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle>Доступные действия</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2">
        {actions.map((action) => (
          <Button
            key={action.to}
            variant={action.to === "rework" ? "outline" : "default"}
            onClick={() => void run(action)}
            disabled={transition.isPending}
          >
            {action.label}
          </Button>
        ))}
      </CardContent>

      <TransitionDialog
        task={task}
        action={dialogAction}
        open={Boolean(dialogAction)}
        onOpenChange={(open) => {
          if (!open) setDialogAction(null);
        }}
      />
    </Card>
  );
}

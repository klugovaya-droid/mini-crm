import { RefreshCw } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TaskCard } from "@/features/tasks/task-card";
import { useMyTasks } from "@/features/tasks/task-queries";

export function MyTasksPage() {
  const { data: tasks, isLoading, error, refetch } = useMyTasks();

  return (
    <>
      <PageHeader
        title="Мои задачи"
        description="Задачи, назначенные на вас, и их статусы."
      />

      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      ) : null}

      {error ? (
        <Card>
          <CardHeader>
            <CardTitle>Не удалось загрузить задачи</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {error instanceof Error ? error.message : "Попробуйте ещё раз."}
            </p>
            <Button variant="outline" onClick={() => void refetch()}>
              <RefreshCw className="size-4" aria-hidden="true" />
              Повторить
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {!isLoading && !error && tasks?.length === 0 ? (
        <EmptyState
          title="Назначенных задач нет"
          description="Когда руководитель назначит на вас задачу, она появится здесь."
        />
      ) : null}

      {tasks && tasks.length > 0 ? (
        <div className="space-y-3">
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} showProject />
          ))}
        </div>
      ) : null}
    </>
  );
}

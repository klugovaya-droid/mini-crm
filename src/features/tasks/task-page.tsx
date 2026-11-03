import { Archive, ArrowLeft, Pencil } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/features/auth/auth-context";
import { HistoryTimeline } from "@/features/tasks/history-timeline";
import { TaskArchiveDialog } from "@/features/tasks/task-archive-dialog";
import { TaskFormDialog } from "@/features/tasks/task-form-dialog";
import { useTask } from "@/features/tasks/task-queries";
import { WorkflowActions } from "@/features/tasks/workflow-actions";
import { formatDateTime } from "@/lib/format";
import type { TaskWithPeople } from "@/types/domain";

export function TaskPage() {
  const { taskId } = useParams();
  const { profile } = useAuth();
  const navigate = useNavigate();
  const { data: task, isLoading, error, refetch } = useTask(taskId);
  const [editOpen, setEditOpen] = useState(false);
  const [archiveOpen, setArchiveOpen] = useState(false);

  const canManage = profile?.role === "manager";

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-9 w-80" />
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Не удалось загрузить задачу</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {error instanceof Error ? error.message : "Попробуйте ещё раз."}
          </p>
          <Button variant="outline" onClick={() => void refetch()}>
            Повторить
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!task) {
    return (
      <EmptyState
        title="Задача не найдена"
        description="Возможно, она архивирована или у вас нет к ней доступа."
        action={
          <Button asChild>
            <Link to="/">На главную</Link>
          </Button>
        }
      />
    );
  }

  return (
    <>
      <Button variant="ghost" size="sm" className="mb-2 -ml-2" asChild>
        <Link to={`/objects/${task.project_id}`}>
          <ArrowLeft className="size-4" aria-hidden="true" />
          К объекту
        </Link>
      </Button>

      <PageHeader
        title={task.title}
        description={task.project?.name ?? "Объект не указан"}
        actions={
          canManage ? (
            <>
              <Button variant="outline" onClick={() => setEditOpen(true)}>
                <Pencil className="size-4" aria-hidden="true" />
                Редактировать
              </Button>
              <Button variant="outline" onClick={() => setArchiveOpen(true)}>
                <Archive className="size-4" aria-hidden="true" />
                Архивировать
              </Button>
            </>
          ) : null
        }
      />

      <WorkflowActions task={task} />

      <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Описание</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-sm">
              {task.description || "Описание не заполнено."}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Данные задачи</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-3 text-sm">
              <div className="flex items-center justify-between gap-3">
                <dt className="text-muted-foreground">Статус</dt>
                <dd>
                  <StatusBadge status={task.status} />
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-muted-foreground">Исполнитель</dt>
                <dd className="text-right">{task.assignee?.full_name ?? "—"}</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-muted-foreground">Автор</dt>
                <dd className="text-right">{task.author?.full_name ?? "—"}</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-muted-foreground">Создана</dt>
                <dd className="text-right">{formatDateTime(task.created_at)}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      </div>

      <section className="mt-6" aria-labelledby="task-history-title">
        <h2 id="task-history-title" className="mb-3 text-lg font-medium">
          История
        </h2>
        <HistoryTimeline taskId={task.id} />
      </section>

      <TaskFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        task={task}
      />

      <TaskArchiveDialog
        task={task}
        open={archiveOpen}
        onOpenChange={setArchiveOpen}
        onArchived={(archived: TaskWithPeople) =>
          navigate(`/objects/${archived.project_id}`)
        }
      />
    </>
  );
}

import { Archive, ArrowLeft, Pencil, Plus } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/features/auth/auth-context";
import { ProjectArchiveDialog } from "@/features/projects/project-archive-dialog";
import { ProjectFormDialog } from "@/features/projects/project-form-dialog";
import { useProject } from "@/features/projects/project-queries";
import { TaskArchiveDialog } from "@/features/tasks/task-archive-dialog";
import { TaskCard } from "@/features/tasks/task-card";
import { TaskFormDialog } from "@/features/tasks/task-form-dialog";
import { useProjectTasks } from "@/features/tasks/task-queries";
import type { Project, TaskWithPeople } from "@/types/domain";

export function ObjectPage() {
  const { projectId } = useParams();
  const { profile } = useAuth();
  const navigate = useNavigate();
  const { data: project, isLoading, error, refetch } = useProject(projectId);
  const { data: tasks, isLoading: tasksLoading, error: tasksError } = useProjectTasks(projectId);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [createTaskOpen, setCreateTaskOpen] = useState(false);
  const [archivingTask, setArchivingTask] = useState<TaskWithPeople | null>(null);

  const canManage = profile?.role === "manager";

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-9 w-72" />
        <Skeleton className="h-4 w-96" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Не удалось загрузить объект</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {error instanceof Error ? error.message : "Попробуйте ещё раз."}
          </p>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => void refetch()}>
              Повторить
            </Button>
            <Button variant="ghost" asChild>
              <Link to="/objects">К списку объектов</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!project) {
    return (
      <EmptyState
        title="Объект не найден"
        description="Возможно, он архивирован или у вас нет к нему доступа."
        action={
          <Button asChild>
            <Link to="/objects">К списку объектов</Link>
          </Button>
        }
      />
    );
  }

  return (
    <>
      <Button variant="ghost" size="sm" className="mb-2 -ml-2" asChild>
        <Link to="/objects">
          <ArrowLeft className="size-4" aria-hidden="true" />
          Все объекты
        </Link>
      </Button>

      <PageHeader
        title={project.name}
        description={project.address}
        actions={
          canManage ? (
            <>
              <Button variant="outline" onClick={() => setEditingProject(project)}>
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

      <section aria-labelledby="project-tasks-title">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 id="project-tasks-title" className="text-lg font-medium">
            Задачи
          </h2>
          {canManage ? (
            <Button onClick={() => setCreateTaskOpen(true)}>
              <Plus className="size-4" aria-hidden="true" />
              Создать задачу
            </Button>
          ) : null}
        </div>

        {tasksLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        ) : null}

        {tasksError ? (
          <Card>
            <CardHeader>
              <CardTitle>Не удалось загрузить задачи</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              {tasksError instanceof Error ? tasksError.message : "Попробуйте ещё раз."}
            </CardContent>
          </Card>
        ) : null}

        {!tasksLoading && !tasksError && tasks?.length === 0 ? (
          <EmptyState
            title="Задач пока нет"
            description={
              canManage
                ? "Создайте первую задачу и назначьте исполнителя."
                : "Когда руководитель назначит вам задачу по этому объекту, она появится здесь."
            }
            action={
              canManage ? (
                <Button onClick={() => setCreateTaskOpen(true)}>
                  <Plus className="size-4" aria-hidden="true" />
                  Создать задачу
                </Button>
              ) : null
            }
          />
        ) : null}

        {tasks && tasks.length > 0 ? (
          <div className="space-y-3">
            {tasks.map((task) => (
              <div key={task.id} className="relative">
                <TaskCard task={task} />
                {canManage ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-3 bottom-2 z-10"
                    onClick={() => setArchivingTask(task)}
                  >
                    Архивировать
                  </Button>
                ) : null}
              </div>
            ))}
          </div>
        ) : null}
      </section>

      <ProjectFormDialog
        open={Boolean(editingProject)}
        onOpenChange={(open) => {
          if (!open) setEditingProject(null);
        }}
        project={editingProject ?? undefined}
      />

      <ProjectArchiveDialog
        project={project}
        open={archiveOpen}
        onOpenChange={setArchiveOpen}
        onArchived={() => navigate("/objects")}
      />

      <TaskFormDialog
        open={createTaskOpen}
        onOpenChange={setCreateTaskOpen}
        defaultProjectId={project.id}
        onCreated={(task) => navigate(`/tasks/${task.id}`)}
      />

      <TaskArchiveDialog
        task={archivingTask}
        open={Boolean(archivingTask)}
        onOpenChange={(open) => {
          if (!open) setArchivingTask(null);
        }}
      />
    </>
  );
}

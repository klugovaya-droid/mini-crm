import { Archive, ArrowLeft, Pencil } from "lucide-react";
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
import type { Project } from "@/types/domain";

export function ObjectPage() {
  const { projectId } = useParams();
  const { profile } = useAuth();
  const navigate = useNavigate();
  const { data: project, isLoading, error, refetch } = useProject(projectId);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [archiveOpen, setArchiveOpen] = useState(false);

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
        <h2 id="project-tasks-title" className="mb-3 text-lg font-medium">
          Задачи
        </h2>
        <EmptyState
          title="Задачи появятся на следующем шаге"
          description="После подключения задач здесь будет список работ по объекту."
        />
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
    </>
  );
}

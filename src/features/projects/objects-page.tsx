import { Plus, RefreshCw } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/features/auth/auth-context";
import { ProjectArchiveDialog } from "@/features/projects/project-archive-dialog";
import { ProjectCard } from "@/features/projects/project-card";
import { ProjectFormDialog } from "@/features/projects/project-form-dialog";
import { useProjects } from "@/features/projects/project-queries";
import type { Project } from "@/types/domain";

function ProjectGridSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-label="Загрузка объектов">
      {Array.from({ length: 3 }).map((_, index) => (
        <Card key={index}>
          <CardHeader>
            <Skeleton className="h-5 w-2/3" />
            <Skeleton className="h-4 w-full" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-4 w-5/6" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function ObjectsPage() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const { data: projects, isLoading, error, refetch } = useProjects();
  const [createOpen, setCreateOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [archivingProject, setArchivingProject] = useState<Project | null>(null);

  const canManage = profile?.role === "manager";

  return (
    <>
      <PageHeader
        title="Объекты"
        description="Стройки, по которым ведутся задачи."
        actions={
          canManage ? (
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="size-4" aria-hidden="true" />
              Создать объект
            </Button>
          ) : null
        }
      />

      {isLoading ? <ProjectGridSkeleton /> : null}

      {error ? (
        <Card>
          <CardHeader>
            <CardTitle>Не удалось загрузить объекты</CardTitle>
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

      {!isLoading && !error && projects?.length === 0 ? (
        <EmptyState
          title="Объектов пока нет"
          description={
            canManage
              ? "Создайте первый объект и назначьте на него задачи."
              : "Когда руководитель назначит вам задачу, объект появится здесь."
          }
          action={
            canManage ? (
              <Button onClick={() => setCreateOpen(true)}>
                <Plus className="size-4" aria-hidden="true" />
                Создать объект
              </Button>
            ) : null
          }
        />
      ) : null}

      {projects && projects.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              canManage={canManage}
              onEdit={setEditingProject}
              onArchive={setArchivingProject}
            />
          ))}
        </div>
      ) : null}

      <ProjectFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={(project) => navigate(`/objects/${project.id}`)}
      />

      <ProjectFormDialog
        open={Boolean(editingProject)}
        onOpenChange={(open) => {
          if (!open) setEditingProject(null);
        }}
        project={editingProject ?? undefined}
      />

      <ProjectArchiveDialog
        project={archivingProject}
        open={Boolean(archivingProject)}
        onOpenChange={(open) => {
          if (!open) setArchivingProject(null);
        }}
      />
    </>
  );
}

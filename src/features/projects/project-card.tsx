import { Archive, MoreHorizontal, Pencil, MapPin } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Project } from "@/types/domain";

interface ProjectCardProps {
  project: Project;
  canManage: boolean;
  onEdit: (project: Project) => void;
  onArchive: (project: Project) => void;
}

export function ProjectCard({ project, canManage, onEdit, onArchive }: ProjectCardProps) {
  return (
    <Card className="group relative transition-shadow hover:shadow-md">
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-lg">
            <Link
              to={`/objects/${project.id}`}
              className="outline-none after:absolute after:inset-0 focus-visible:underline"
            >
              {project.name}
            </Link>
          </CardTitle>

          {canManage ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="relative z-10 size-8 shrink-0"
                  aria-label={`Действия с объектом ${project.name}`}
                >
                  <MoreHorizontal className="size-4" aria-hidden="true" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onSelect={() => onEdit(project)}>
                  <Pencil className="size-4" aria-hidden="true" />
                  Редактировать
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive" onSelect={() => onArchive(project)}>
                  <Archive className="size-4" aria-hidden="true" />
                  Архивировать
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : null}
        </div>
        <CardDescription className="flex items-start gap-1.5">
          <MapPin className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
          {project.address}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          Откройте карточку, чтобы посмотреть задачи по объекту.
        </p>
      </CardContent>
    </Card>
  );
}

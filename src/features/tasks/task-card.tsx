import { CalendarDays, MapPin, UserRound } from "lucide-react";
import { Link } from "react-router-dom";
import { StatusBadge } from "@/components/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/format";
import type { TaskWithPeople } from "@/types/domain";

interface TaskCardProps {
  task: TaskWithPeople;
  showProject?: boolean;
}

export function TaskCard({ task, showProject = false }: TaskCardProps) {
  return (
    <Card className="relative transition-shadow hover:shadow-sm">
      <CardHeader className="gap-2">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <CardTitle className="text-base">
            <Link
              to={`/tasks/${task.id}`}
              className="outline-none after:absolute after:inset-0 focus-visible:underline"
            >
              {task.title}
            </Link>
          </CardTitle>
          <StatusBadge status={task.status} />
        </div>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
        {showProject && task.project ? (
          <span className="flex items-center gap-1.5">
            <MapPin className="size-3.5" aria-hidden="true" />
            {task.project.name}
          </span>
        ) : null}
        <span className="flex items-center gap-1.5">
          <UserRound className="size-3.5" aria-hidden="true" />
          {task.assignee?.full_name ?? "Исполнитель не назначен"}
        </span>
        <span className="flex items-center gap-1.5">
          <CalendarDays className="size-3.5" aria-hidden="true" />
          {formatDate(task.created_at)}
        </span>
      </CardContent>
    </Card>
  );
}

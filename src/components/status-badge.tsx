import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { TaskStatus } from "@/types/domain";
import { taskStatusLabels } from "@/types/status";

const statusClasses: Record<TaskStatus, string> = {
  new: "border-slate-200 bg-slate-100 text-slate-700",
  in_progress: "border-blue-200 bg-blue-50 text-blue-700",
  on_review: "border-amber-200 bg-amber-50 text-amber-800",
  accepted: "border-emerald-200 bg-emerald-50 text-emerald-700",
  rework: "border-rose-200 bg-rose-50 text-rose-700",
};

export function StatusBadge({ status }: { status: TaskStatus }) {
  return (
    <Badge variant="outline" className={cn("font-normal", statusClasses[status])}>
      {taskStatusLabels[status]}
    </Badge>
  );
}

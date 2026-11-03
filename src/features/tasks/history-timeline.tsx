import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { historyTitle } from "@/features/tasks/history";
import { useTaskHistory } from "@/features/tasks/task-queries";
import { formatDateTime } from "@/lib/format";

export function HistoryTimeline({ taskId }: { taskId: string }) {
  const { data: entries, isLoading, error, refetch } = useTaskHistory(taskId);

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border bg-background p-4">
        <p className="text-sm text-muted-foreground">
          {error instanceof Error ? error.message : "Не удалось загрузить историю."}
        </p>
        <Button variant="outline" size="sm" className="mt-3" onClick={() => void refetch()}>
          <RefreshCw className="size-4" aria-hidden="true" />
          Повторить
        </Button>
      </div>
    );
  }

  if (!entries || entries.length === 0) {
    return (
      <div className="rounded-xl border border-dashed bg-background p-6 text-sm text-muted-foreground">
        История пока пуста.
      </div>
    );
  }

  return (
    <ol className="relative space-y-5 border-l pl-5">
      {entries.map((entry) => (
        <li key={entry.id} className="relative">
          <span
            className="absolute top-1.5 -left-[26px] size-2.5 rounded-full border-2 border-background bg-primary"
            aria-hidden="true"
          />
          <p className="text-sm font-medium">{historyTitle(entry)}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {entry.changed_by_profile?.full_name ?? "Неизвестный пользователь"} ·{" "}
            {formatDateTime(entry.created_at)}
          </p>
          {entry.comment ? (
            <p className="mt-2 rounded-lg bg-muted px-3 py-2 text-sm">{entry.comment}</p>
          ) : null}
        </li>
      ))}
    </ol>
  );
}

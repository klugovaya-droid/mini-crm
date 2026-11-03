import { PageHeader } from "@/components/page-header";

export function TaskPage() {
  return (
    <>
      <PageHeader title="Задача" description="Данные задачи, действия и история." />
      <div className="rounded-xl border bg-background p-6 text-sm text-muted-foreground">
        Карточка задачи будет подключена на следующем шаге.
      </div>
    </>
  );
}

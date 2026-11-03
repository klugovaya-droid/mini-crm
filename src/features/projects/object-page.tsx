import { PageHeader } from "@/components/page-header";

export function ObjectPage() {
  return (
    <>
      <PageHeader title="Объект" description="Карточка объекта и его задачи." />
      <div className="rounded-xl border bg-background p-6 text-sm text-muted-foreground">
        Карточка объекта будет подключена на следующем шаге.
      </div>
    </>
  );
}

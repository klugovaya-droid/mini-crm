import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";

export function ObjectsPage() {
  return (
    <>
      <PageHeader
        title="Объекты"
        description="Стройки, по которым ведутся задачи."
      />
      <EmptyState
        title="Список объектов скоро появится"
        description="На следующем шаге здесь будет список доступных объектов."
      />
    </>
  );
}

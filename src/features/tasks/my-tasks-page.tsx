import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";

export function MyTasksPage() {
  return (
    <>
      <PageHeader
        title="Мои задачи"
        description="Задачи, назначенные на вас, и их статусы."
      />
      <EmptyState
        title="Список задач скоро появится"
        description="На следующем шаге здесь будут только ваши задачи."
      />
    </>
  );
}

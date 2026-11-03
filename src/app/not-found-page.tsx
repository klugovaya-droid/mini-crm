import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export function NotFoundPage() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <p className="text-4xl font-semibold">404</p>
      <h1 className="mt-2 text-xl font-medium">Страница не найдена</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Возможно, ссылка устарела или у вас нет доступа к этой странице.
      </p>
      <Button asChild className="mt-6">
        <Link to="/">На главную</Link>
      </Button>
    </div>
  );
}

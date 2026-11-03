import { HardHat } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui/card";

export default function App() {
  return (
    <main className="flex min-h-svh items-center justify-center bg-muted/40 p-6">
      <Card className="w-full max-w-md">
        <CardHeader className="items-center text-center">
          <div className="mb-2 flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <HardHat className="size-6" aria-hidden="true" />
          </div>
          <h1 className="font-heading text-2xl font-medium">Вход</h1>
          <CardDescription>
            Мини-CRM для строительной компании: объекты, задачи и исполнители.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Экран входа будет подключён на следующем шаге.
          </p>
          <Button className="w-full" disabled>
            Войти
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}

import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { useAuth } from "@/features/auth/auth-context";

export function ProfileMissing() {
  const { session, signOut } = useAuth();

  return (
    <main className="flex min-h-svh items-center justify-center bg-muted/40 p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <h1 className="text-xl font-semibold">Профиль не настроен</h1>
          <CardDescription>
            Для аккаунта {session?.user.email ?? ""} нет профиля с ролью. Обратитесь к
            руководителю.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" className="w-full" onClick={() => void signOut()}>
            <LogOut className="size-4" aria-hidden="true" />
            Выйти
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}

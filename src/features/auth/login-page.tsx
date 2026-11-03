import { zodResolver } from "@hookform/resolvers/zod";
import { HardHat, LogIn } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/features/auth/auth-context";
import { ProfileMissing } from "@/features/auth/profile-missing";

const loginSchema = z.object({
  email: z.string().email("Введите корректный email"),
  password: z.string().min(6, "Пароль должен быть не короче 6 символов"),
});

type LoginValues = z.infer<typeof loginSchema>;

export function LoginPage() {
  const { session, profile, loading, configError, signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  if (!loading && session && profile) {
    return <Navigate to="/" replace />;
  }

  if (!loading && session && !profile && !configError) {
    return <ProfileMissing />;
  }

  async function onSubmit(values: LoginValues) {
    setSubmitError(null);
    setSubmitting(true);
    try {
      await signIn(values.email.trim(), values.password);
      const from = (location.state as { from?: string } | null)?.from;
      navigate(from && from !== "/login" ? from : "/", { replace: true });
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Не удалось войти.");
    } finally {
      setSubmitting(false);
    }
  }

  if (configError) {
    return (
      <main className="flex min-h-svh items-center justify-center bg-muted/40 p-6">
        <Card className="w-full max-w-md">
          <CardHeader>
            <h1 className="text-xl font-semibold">Приложение не настроено</h1>
            <CardDescription>{configError}</CardDescription>
          </CardHeader>
        </Card>
      </main>
    );
  }

  return (
    <main className="flex min-h-svh items-center justify-center bg-muted/40 p-6">
      <Card className="w-full max-w-md">
        <CardHeader className="items-center text-center">
          <div className="mb-2 flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <HardHat className="size-6" aria-hidden="true" />
          </div>
          <h1 className="text-2xl font-semibold">Вход</h1>
          <CardDescription>
            Мини-CRM для строительной компании: объекты, задачи и исполнители.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)} noValidate>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="name@company.ru"
                aria-invalid={Boolean(form.formState.errors.email)}
                aria-describedby={form.formState.errors.email ? "email-error" : undefined}
                {...form.register("email")}
              />
              {form.formState.errors.email ? (
                <p id="email-error" className="text-sm text-destructive">
                  {form.formState.errors.email.message}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Пароль</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                aria-invalid={Boolean(form.formState.errors.password)}
                aria-describedby={
                  form.formState.errors.password ? "password-error" : undefined
                }
                {...form.register("password")}
              />
              {form.formState.errors.password ? (
                <p id="password-error" className="text-sm text-destructive">
                  {form.formState.errors.password.message}
                </p>
              ) : null}
            </div>

            {submitError ? (
              <div
                role="alert"
                className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
              >
                {submitError}
              </div>
            ) : null}

            <Button type="submit" className="w-full" disabled={submitting}>
              <LogIn className="size-4" aria-hidden="true" />
              {submitting ? "Входим…" : "Войти"}
            </Button>

            <p className="text-center text-xs text-muted-foreground">
              Регистрация отключена. Доступ выдаёт руководитель.
            </p>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}

import { Navigate, Outlet, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { FullScreenLoader } from "@/components/full-screen-loader";
import { useAuth } from "@/features/auth/auth-context";
import { ProfileMissing } from "@/features/auth/profile-missing";
import type { AppRole } from "@/types/domain";

export function RequireAuth() {
  const { session, profile, loading, profileError, signOut } = useAuth();
  const location = useLocation();

  if (loading) return <FullScreenLoader />;

  if (!session) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (profileError) {
    return (
      <main className="flex min-h-svh items-center justify-center bg-muted/40 p-6">
        <Card className="w-full max-w-md">
          <CardHeader>
            <h1 className="text-xl font-semibold">Ошибка профиля</h1>
            <CardDescription>{profileError}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button className="w-full" onClick={() => window.location.reload()}>
              Обновить страницу
            </Button>
            <Button variant="outline" className="w-full" onClick={() => void signOut()}>
              Выйти
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  if (!profile) return <ProfileMissing />;

  return <Outlet />;
}

export function RequireRole({ role }: { role: AppRole }) {
  const { profile } = useAuth();

  if (!profile) return null;
  if (profile.role !== role) return <Navigate to="/" replace />;

  return <Outlet />;
}

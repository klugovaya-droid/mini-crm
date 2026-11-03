import { Route, Routes } from "react-router-dom";
import { AppShell } from "@/app/app-shell";
import { NotFoundPage } from "@/app/not-found-page";
import { HomeRedirect } from "@/features/auth/home-redirect";
import { LoginPage } from "@/features/auth/login-page";
import { RequireAuth, RequireRole } from "@/features/auth/require-auth";
import { ObjectPage } from "@/features/projects/object-page";
import { ObjectsPage } from "@/features/projects/objects-page";
import { MyTasksPage } from "@/features/tasks/my-tasks-page";
import { TaskPage } from "@/features/tasks/task-page";

export function AppRouter() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route element={<RequireAuth />}>
        <Route element={<AppShell />}>
          <Route index element={<HomeRedirect />} />
          <Route path="objects" element={<ObjectsPage />} />
          <Route path="objects/:projectId" element={<ObjectPage />} />
          <Route path="tasks/:taskId" element={<TaskPage />} />
          <Route element={<RequireRole role="worker" />}>
            <Route path="my-tasks" element={<MyTasksPage />} />
          </Route>
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Route>
    </Routes>
  );
}

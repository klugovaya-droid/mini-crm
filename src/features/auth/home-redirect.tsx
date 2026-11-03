import { Navigate } from "react-router-dom";
import { FullScreenLoader } from "@/components/full-screen-loader";
import { useAuth } from "@/features/auth/auth-context";

export function HomeRedirect() {
  const { profile, loading } = useAuth();

  if (loading) return <FullScreenLoader />;
  if (!profile) return null;

  return <Navigate to={profile.role === "manager" ? "/objects" : "/my-tasks"} replace />;
}

import { useQuery } from "@tanstack/react-query";
import { listWorkers } from "@/features/auth/profile-api";

export const profileKeys = {
  workers: ["profiles", "workers"] as const,
};

export function useWorkers() {
  return useQuery({ queryKey: profileKeys.workers, queryFn: listWorkers });
}

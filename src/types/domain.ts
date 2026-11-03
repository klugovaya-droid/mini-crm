import type { Database } from "@/lib/database.types";

export type AppRole = Database["public"]["Enums"]["app_role"];
export type TaskStatus = Database["public"]["Enums"]["task_status"];
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Project = Database["public"]["Tables"]["projects"]["Row"];
export type Task = Database["public"]["Tables"]["tasks"]["Row"];
export type TaskHistoryEntry = Database["public"]["Tables"]["task_status_history"]["Row"];

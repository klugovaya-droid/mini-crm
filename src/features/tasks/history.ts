import type { HistoryEntryWithPerson } from "@/types/domain";
import { taskStatusLabels } from "@/types/status";

export function historyTitle(entry: Pick<HistoryEntryWithPerson, "from_status" | "to_status">) {
  if (entry.from_status === null) {
    return "Задача создана";
  }

  return `${taskStatusLabels[entry.from_status]} → ${taskStatusLabels[entry.to_status]}`;
}

import { describe, expect, it } from "vitest";
import { roleLabels, taskStatusLabels, taskStatusOrder } from "@/types/status";

describe("domain labels", () => {
  it("has a Russian label for every status", () => {
    expect(Object.keys(taskStatusLabels)).toHaveLength(taskStatusOrder.length);
    for (const status of taskStatusOrder) {
      expect(taskStatusLabels[status]).not.toBe("");
    }
  });

  it("has a Russian label for every role", () => {
    expect(roleLabels.manager).toBe("Руководитель");
    expect(roleLabels.worker).toBe("Исполнитель");
  });
});

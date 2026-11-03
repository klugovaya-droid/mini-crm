import { describe, expect, it } from "vitest";
import { taskFormSchema } from "@/features/tasks/task-schema";

describe("taskFormSchema", () => {
  it("accepts a valid task", () => {
    const result = taskFormSchema.safeParse({
      title: "Проверить армирование",
      description: "Сверить с проектом",
      projectId: "11111111-1111-4111-8111-111111111111",
      assigneeId: "22222222-2222-4222-8222-222222222222",
    });

    expect(result.success).toBe(true);
  });

  it("requires project and assignee", () => {
    const result = taskFormSchema.safeParse({
      title: "Задача",
      description: "",
      projectId: "",
      assigneeId: "",
    });

    expect(result.success).toBe(false);
  });

  it("requires a title", () => {
    const result = taskFormSchema.safeParse({
      title: " ",
      description: "",
      projectId: "11111111-1111-4111-8111-111111111111",
      assigneeId: "22222222-2222-4222-8222-222222222222",
    });

    expect(result.success).toBe(false);
  });
});

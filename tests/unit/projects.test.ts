import { describe, expect, it } from "vitest";
import { projectFormSchema } from "@/features/projects/project-schema";
import { mapDbError } from "@/lib/db-errors";

describe("projectFormSchema", () => {
  it("accepts a valid project", () => {
    const result = projectFormSchema.safeParse({
      name: "  ЖК Северный  ",
      address: "  Москва, ул. Северная, 12  ",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe("ЖК Северный");
    }
  });

  it("rejects empty fields", () => {
    const result = projectFormSchema.safeParse({ name: " ", address: "" });

    expect(result.success).toBe(false);
  });
});

describe("mapDbError", () => {
  it("maps permission errors", () => {
    expect(mapDbError({ code: "42501", message: "permission denied" } as never)).toContain(
      "Недостаточно прав",
    );
  });

  it("falls back for unknown errors", () => {
    expect(mapDbError({ code: "XX000", message: "boom" } as never)).toContain(
      "Не удалось выполнить действие",
    );
  });
});

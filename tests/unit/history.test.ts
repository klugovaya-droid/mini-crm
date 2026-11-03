import { describe, expect, it } from "vitest";
import { historyTitle } from "@/features/tasks/history";
import { mapDbError } from "@/lib/db-errors";

describe("historyTitle", () => {
  it("labels task creation", () => {
    expect(historyTitle({ from_status: null, to_status: "new" })).toBe("Задача создана");
  });

  it("labels a status change", () => {
    expect(historyTitle({ from_status: "new", to_status: "in_progress" })).toBe(
      "Новая → В работе",
    );
  });
});

describe("workflow error mapping", () => {
  it("maps the required comment error", () => {
    expect(
      mapDbError({ code: "MC008", message: "COMMENT_REQUIRED" } as never),
    ).toBe("Комментарий обязателен.");
  });

  it("maps an invalid transition", () => {
    expect(
      mapDbError({ code: "MC006", message: "INVALID_TRANSITION" } as never),
    ).toBe("Этот переход статуса недоступен.");
  });
});

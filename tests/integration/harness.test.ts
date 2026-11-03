import { describe, expect, it } from "vitest";

describe("integration harness", () => {
  it("runs in node", () => {
    expect(typeof process.versions.node).toBe("string");
  });
});

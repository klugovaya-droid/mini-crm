import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

function collect(path: string): string[] {
  const stat = statSync(path);
  if (stat.isDirectory()) {
    return readdirSync(path).flatMap((entry) => collect(join(path, entry)));
  }
  return [path];
}

describe("client secret scan", () => {
  it("does not mention service-role keys in client sources", () => {
    const files = collect("src");
    const offenders = files.filter((file) => {
      const content = readFileSync(file, "utf8");
      return /service_role/i.test(content) || /SUPABASE_SERVICE_ROLE/i.test(content);
    });

    expect(offenders).toEqual([]);
  });
});

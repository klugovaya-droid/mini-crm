import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests/e2e/**/*.test.ts"],
    globalSetup: ["./tests/e2e/global-setup.ts"],
    environment: "node",
    testTimeout: 60_000,
    hookTimeout: 120_000,
    fileParallelism: false,
    sequence: {
      concurrent: false,
    },
  },
});

import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    fileParallelism: false,
    maxWorkers: 1,
    setupFiles: ["./tests/setup.ts"],
    testTimeout: 15000,
  },
});

import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests/**/*.test.ts", "src/**/*.test.ts", "src/**/*.steps.ts"],
    typecheck: {
      tsconfig: "./tsconfig.test.json",
    },
    globals: true,
    environment: "node",
    setupFiles: ["./tests/server/setup/gas-mocks.ts"],
    coverage: {
      provider: "v8",
      reporter: ["lcov", "text"],
      reportsDirectory: "./coverage",
    },
  },
});

/** @type {import('@stryker-mutator/core').PartialStrykerOptions} */
const config = {
  testRunner: "vitest",
  plugins: ["@stryker-mutator/vitest-runner"],
  vitest: {
    configFile: "vite.config.ts",
  },
  mutate: [
    "src/**/*.ts",
    "src/**/*.tsx",
    "!src/**/*.test.ts",
    "!src/**/*.test.tsx",
    "!src/types/**/*.ts",
    "!src/test/**",
    "!src/main.tsx",
    "!src/vite-env.d.ts",
  ],
  reporters: ["html", "json", "clear-text", "progress"],
  htmlReporter: {
    fileName: "reports/mutation/index.html",
  },
  jsonReporter: {
    fileName: "reports/mutation/mutation-report.json",
  },
  thresholds: {
    high: 80,
    low: 60,
    break: null,
  },
  timeoutMS: 10000,
};

export default config;

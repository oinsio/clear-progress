/** @type {import('@stryker-mutator/core').PartialStrykerOptions} */
const config = {
  testRunner: "vitest",
  plugins: ["@stryker-mutator/vitest-runner"],
  vitest: {
    configFile: "vitest.config.ts",
  },
  mutate: [
    "src/**/*.ts",
    "!src/**/*.test.ts",
    "!src/test/**",
    "!src/**/*-test-utils.ts",
    "!src/**/make-sheet-mock.ts",
    "!src/types/**/*.ts",
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

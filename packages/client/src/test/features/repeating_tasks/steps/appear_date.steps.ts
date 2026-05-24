// implements FR8 of repeating-tasks-specs
import type { FeatureDescriibeCallbackParams } from "@amiceli/vitest-cucumber";
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import { expect, type TestContext } from "vitest";
import { calculateAppearDate } from "@/utils/repeatRule";

const feature = await loadFeature("../appear_date.feature");

type Context = Record<string, never>;

describeFeature(feature, (f: FeatureDescriibeCallbackParams<Context>) => {
  let result: string;

  // @repeating-tasks-specs @FR8
  f.Scenario("Appear date with 0 advance days", ({ Given, When, Then }) => {
    let nextDate: string;
    let advanceDays: number;

    Given(
      'next_date is "2026-02-15" and advance_days is 0',
      (_ctx: TestContext) => {
        nextDate = "2026-02-15";
        advanceDays = 0;
      },
    );

    When("system calculates appear date", (_ctx: TestContext) => {
      result = calculateAppearDate(nextDate, advanceDays);
    });

    Then('result is "2026-02-15"', (_ctx: TestContext) => {
      expect(result).toBe("2026-02-15");
    });
  });

  // @repeating-tasks-specs @FR8
  f.Scenario("Appear date with 7 advance days", ({ Given, When, Then }) => {
    let nextDate: string;
    let advanceDays: number;

    Given(
      'next_date is "2026-02-15" and advance_days is 7',
      (_ctx: TestContext) => {
        nextDate = "2026-02-15";
        advanceDays = 7;
      },
    );

    When("system calculates appear date", (_ctx: TestContext) => {
      result = calculateAppearDate(nextDate, advanceDays);
    });

    Then('result is "2026-02-08"', (_ctx: TestContext) => {
      expect(result).toBe("2026-02-08");
    });
  });

  // @repeating-tasks-specs @FR8
  f.Scenario("Appear date with 30 advance days", ({ Given, When, Then }) => {
    let nextDate: string;
    let advanceDays: number;

    Given(
      'next_date is "2026-03-01" and advance_days is 30',
      (_ctx: TestContext) => {
        nextDate = "2026-03-01";
        advanceDays = 30;
      },
    );

    When("system calculates appear date", (_ctx: TestContext) => {
      result = calculateAppearDate(nextDate, advanceDays);
    });

    Then('result is "2026-01-30"', (_ctx: TestContext) => {
      expect(result).toBe("2026-01-30");
    });
  });
});

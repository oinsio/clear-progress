// implements FR3 of repeating-tasks-specs
// implements FR7, FR8 of add-recurring-edge-case-tests
import type { FeatureDescriibeCallbackParams } from "@amiceli/vitest-cucumber";
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import { expect, type TestContext } from "vitest";
import { fakeClock } from "@/lib/temporal";
import type { RepeatRule } from "@/types/common";
import { calculateNextDate } from "@/utils/repeatRule";

const feature = await loadFeature("../next_date_daily.feature");

type Context = Record<string, never>;

describeFeature(feature, (f: FeatureDescriibeCallbackParams<Context>) => {
  let previousNextDate: string;
  let todayISO: string;
  let result: string;

  // @repeating-tasks-specs @FR3
  f.Scenario("Daily interval 1 next day", ({ Given, When, Then }) => {
    Given(
      'previous next_date is "2026-01-15" and today is "2026-01-15"',
      (_ctx: TestContext) => {
        previousNextDate = "2026-01-15";
        todayISO = "2026-01-15";
      },
    );

    When(
      "system calculates next date with daily interval 1",
      (_ctx: TestContext) => {
        const clock = fakeClock(`${todayISO}T12:00:00Z`);
        const rule: RepeatRule = {
          type: "fixed",
          frequency: "daily",
          interval: 1,
          target_box: "today",
          advance_days: 0,
        };
        result = calculateNextDate(
          rule,
          `${todayISO}T12:00:00.000Z`,
          previousNextDate,
          clock,
        );
      },
    );

    Then('result is "2026-01-16"', (_ctx: TestContext) => {
      expect(result).toBe("2026-01-16");
    });
  });

  // @repeating-tasks-specs @FR3
  f.Scenario("Daily interval 3", ({ Given, When, Then }) => {
    Given(
      'previous next_date is "2026-01-15" and today is "2026-01-15"',
      (_ctx: TestContext) => {
        previousNextDate = "2026-01-15";
        todayISO = "2026-01-15";
      },
    );

    When(
      "system calculates next date with daily interval 3",
      (_ctx: TestContext) => {
        const clock = fakeClock(`${todayISO}T12:00:00Z`);
        const rule: RepeatRule = {
          type: "fixed",
          frequency: "daily",
          interval: 3,
          target_box: "today",
          advance_days: 0,
        };
        result = calculateNextDate(
          rule,
          `${todayISO}T12:00:00.000Z`,
          previousNextDate,
          clock,
        );
      },
    );

    Then('result is "2026-01-18"', (_ctx: TestContext) => {
      expect(result).toBe("2026-01-18");
    });
  });

  // @repeating-tasks-specs @FR3
  f.Scenario("Daily skip logic skips missed days", ({ Given, When, Then }) => {
    Given(
      'previous next_date is "2026-01-10" and today is "2026-01-20"',
      (_ctx: TestContext) => {
        previousNextDate = "2026-01-10";
        todayISO = "2026-01-20";
      },
    );

    When(
      "system calculates next date with daily interval 3",
      (_ctx: TestContext) => {
        const clock = fakeClock(`${todayISO}T12:00:00Z`);
        const rule: RepeatRule = {
          type: "fixed",
          frequency: "daily",
          interval: 3,
          target_box: "today",
          advance_days: 0,
        };
        result = calculateNextDate(
          rule,
          `${todayISO}T12:00:00.000Z`,
          previousNextDate,
          clock,
        );
      },
    );

    Then('result is "2026-01-23"', (_ctx: TestContext) => {
      expect(result).toBe("2026-01-23");
    });
  });

  // @add-recurring-edge-case-tests @FR7
  f.Scenario(
    "Daily early completion prev greater than today",
    ({ Given, When, Then }) => {
      Given(
        'previous next_date is "2026-07-05" and today is "2026-07-03"',
        (_ctx: TestContext) => {
          previousNextDate = "2026-07-05";
          todayISO = "2026-07-03";
        },
      );

      When(
        "system calculates next date with daily interval 1",
        (_ctx: TestContext) => {
          const clock = fakeClock(`${todayISO}T12:00:00Z`);
          const rule: RepeatRule = {
            type: "fixed",
            frequency: "daily",
            interval: 1,
            target_box: "today",
            advance_days: 0,
          };
          result = calculateNextDate(
            rule,
            `${todayISO}T12:00:00.000Z`,
            previousNextDate,
            clock,
          );
        },
      );

      Then('result is "2026-07-04"', (_ctx: TestContext) => {
        expect(result).toBe("2026-07-04");
      });
    },
  );

  // @repeating-tasks-specs @FR3 @add-recurring-edge-case-tests @FR8
  f.Scenario("Daily skip logic exact alignment", ({ Given, When, Then }) => {
    Given(
      'previous next_date is "2026-01-01" and today is "2026-01-07"',
      (_ctx: TestContext) => {
        previousNextDate = "2026-01-01";
        todayISO = "2026-01-07";
      },
    );

    When(
      "system calculates next date with daily interval 3",
      (_ctx: TestContext) => {
        const clock = fakeClock(`${todayISO}T12:00:00Z`);
        const rule: RepeatRule = {
          type: "fixed",
          frequency: "daily",
          interval: 3,
          target_box: "today",
          advance_days: 0,
        };
        result = calculateNextDate(
          rule,
          `${todayISO}T12:00:00.000Z`,
          previousNextDate,
          clock,
        );
      },
    );

    Then('result is "2026-01-10"', (_ctx: TestContext) => {
      expect(result).toBe("2026-01-10");
    });
  });
});

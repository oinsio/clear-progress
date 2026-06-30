// implements FR4 of repeating-tasks-specs
// implements FR4 of add-recurring-edge-case-tests
import type { FeatureDescriibeCallbackParams } from "@amiceli/vitest-cucumber";
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import { expect, type TestContext } from "vitest";
import { fakeClock } from "@/lib/temporal";
import type { RepeatRule } from "@/types/common";
import { calculateNextDate } from "@/utils/repeatRule";

const feature = await loadFeature("../next_date_weekly.feature");

type Context = Record<string, never>;

describeFeature(feature, (f: FeatureDescriibeCallbackParams<Context>) => {
  let previousNextDate: string;
  let todayISO: string;
  let weekdays: number[];
  let result: string;

  // @repeating-tasks-specs @FR4
  f.Scenario("Weekly single weekday", ({ Given, When, Then }) => {
    Given(
      'previous next_date is "2026-01-05" with weekdays [1] and today is "2026-01-05"',
      (_ctx: TestContext) => {
        previousNextDate = "2026-01-05";
        todayISO = "2026-01-05";
        weekdays = [1];
      },
    );

    When(
      "system calculates next date with weekly interval 1",
      (_ctx: TestContext) => {
        const clock = fakeClock(`${todayISO}T12:00:00Z`);
        const rule: RepeatRule = {
          type: "fixed",
          frequency: "weekly",
          interval: 1,
          weekdays,
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

    Then('result is "2026-01-12"', (_ctx: TestContext) => {
      expect(result).toBe("2026-01-12");
    });
  });

  // @repeating-tasks-specs @FR4
  f.Scenario("Weekly multiple weekdays", ({ Given, When, Then }) => {
    Given(
      'previous next_date is "2026-01-05" with weekdays [1, 3, 5] and today is "2026-01-05"',
      (_ctx: TestContext) => {
        previousNextDate = "2026-01-05";
        todayISO = "2026-01-05";
        weekdays = [1, 3, 5];
      },
    );

    When(
      "system calculates next date with weekly interval 1",
      (_ctx: TestContext) => {
        const clock = fakeClock(`${todayISO}T12:00:00Z`);
        const rule: RepeatRule = {
          type: "fixed",
          frequency: "weekly",
          interval: 1,
          weekdays,
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

    Then('result is "2026-01-07"', (_ctx: TestContext) => {
      expect(result).toBe("2026-01-07");
    });
  });

  // @repeating-tasks-specs @FR4
  f.Scenario("Weekly interval 2", ({ Given, When, Then }) => {
    Given(
      'previous next_date is "2026-01-05" with weekdays [1] and today is "2026-01-05"',
      (_ctx: TestContext) => {
        previousNextDate = "2026-01-05";
        todayISO = "2026-01-05";
        weekdays = [1];
      },
    );

    When(
      "system calculates next date with weekly interval 2",
      (_ctx: TestContext) => {
        const clock = fakeClock(`${todayISO}T12:00:00Z`);
        const rule: RepeatRule = {
          type: "fixed",
          frequency: "weekly",
          interval: 2,
          weekdays,
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

    Then('result is "2026-01-19"', (_ctx: TestContext) => {
      expect(result).toBe("2026-01-19");
    });
  });

  // @add-recurring-edge-case-tests @FR4
  f.Scenario(
    "Weekly early completion preserves scheduled date",
    ({ Given, When, Then }) => {
      Given(
        'previous next_date is "2026-07-06" with weekdays [1] and today is "2026-07-04"',
        (_ctx: TestContext) => {
          previousNextDate = "2026-07-06";
          todayISO = "2026-07-04";
          weekdays = [1];
        },
      );

      When(
        "system calculates next date with weekly interval 1",
        (_ctx: TestContext) => {
          const clock = fakeClock(`${todayISO}T12:00:00Z`);
          const rule: RepeatRule = {
            type: "fixed",
            frequency: "weekly",
            interval: 1,
            weekdays,
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

      Then('result is "2026-07-06"', (_ctx: TestContext) => {
        expect(result).toBe("2026-07-06");
      });
    },
  );

  // @add-recurring-edge-case-tests @FR4
  f.Scenario(
    "Weekly early completion with interval 2 preserves scheduled date",
    ({ Given, When, Then }) => {
      Given(
        'previous next_date is "2026-07-06" with weekdays [1] and today is "2026-07-04"',
        (_ctx: TestContext) => {
          previousNextDate = "2026-07-06";
          todayISO = "2026-07-04";
          weekdays = [1];
        },
      );

      When(
        "system calculates next date with weekly interval 2",
        (_ctx: TestContext) => {
          const clock = fakeClock(`${todayISO}T12:00:00Z`);
          const rule: RepeatRule = {
            type: "fixed",
            frequency: "weekly",
            interval: 2,
            weekdays,
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

      Then('result is "2026-07-06"', (_ctx: TestContext) => {
        expect(result).toBe("2026-07-06");
      });
    },
  );

  // @repeating-tasks-specs @FR4
  f.Scenario(
    "Weekly skip logic skips missed weeks",
    ({ Given, When, Then }) => {
      Given(
        'previous next_date is "2026-01-05" with weekdays [1] and today is "2026-02-01"',
        (_ctx: TestContext) => {
          previousNextDate = "2026-01-05";
          todayISO = "2026-02-01";
          weekdays = [1];
        },
      );

      When(
        "system calculates next date with weekly interval 1",
        (_ctx: TestContext) => {
          const clock = fakeClock(`${todayISO}T12:00:00Z`);
          const rule: RepeatRule = {
            type: "fixed",
            frequency: "weekly",
            interval: 1,
            weekdays,
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

      Then('result is "2026-02-02"', (_ctx: TestContext) => {
        expect(result).toBe("2026-02-02");
      });
    },
  );
});

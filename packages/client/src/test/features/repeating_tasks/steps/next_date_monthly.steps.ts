// implements FR5 of repeating-tasks-specs
import type { FeatureDescriibeCallbackParams } from "@amiceli/vitest-cucumber";
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import { expect, type TestContext } from "vitest";
import { fakeClock } from "@/lib/temporal";
import type { RepeatRule } from "@/types/common";
import { calculateNextDate } from "@/utils/repeatRule";

const feature = await loadFeature("../next_date_monthly.feature");

type Context = Record<string, never>;

describeFeature(feature, (f: FeatureDescriibeCallbackParams<Context>) => {
  let previousNextDate: string;
  let todayISO: string;
  let dayOfMonth: number;
  let result: string;

  // @repeating-tasks-specs @FR5
  f.Scenario("Monthly interval 1", ({ Given, When, Then }) => {
    Given(
      'previous next_date is "2026-01-15" with day_of_month 15 and today is "2026-01-15"',
      (_ctx: TestContext) => {
        previousNextDate = "2026-01-15";
        todayISO = "2026-01-15";
        dayOfMonth = 15;
      },
    );

    When(
      "system calculates next date with monthly interval 1",
      (_ctx: TestContext) => {
        const clock = fakeClock(`${todayISO}T12:00:00Z`);
        const rule: RepeatRule = {
          type: "fixed",
          frequency: "monthly",
          interval: 1,
          day_of_month: dayOfMonth,
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

    Then('result is "2026-02-15"', (_ctx: TestContext) => {
      expect(result).toBe("2026-02-15");
    });
  });

  // @repeating-tasks-specs @FR5
  f.Scenario("Monthly end-of-month clamping", ({ Given, When, Then }) => {
    Given(
      'previous next_date is "2026-01-31" with day_of_month 31 and today is "2026-01-31"',
      (_ctx: TestContext) => {
        previousNextDate = "2026-01-31";
        todayISO = "2026-01-31";
        dayOfMonth = 31;
      },
    );

    When(
      "system calculates next date with monthly interval 1",
      (_ctx: TestContext) => {
        const clock = fakeClock(`${todayISO}T12:00:00Z`);
        const rule: RepeatRule = {
          type: "fixed",
          frequency: "monthly",
          interval: 1,
          day_of_month: dayOfMonth,
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

    Then('result is "2026-02-28"', (_ctx: TestContext) => {
      expect(result).toBe("2026-02-28");
    });
  });

  // @repeating-tasks-specs @FR5
  f.Scenario(
    "Monthly skip logic skips past months",
    ({ Given, When, Then }) => {
      Given(
        'previous next_date is "2026-01-15" with day_of_month 15 and today is "2026-04-20"',
        (_ctx: TestContext) => {
          previousNextDate = "2026-01-15";
          todayISO = "2026-04-20";
          dayOfMonth = 15;
        },
      );

      When(
        "system calculates next date with monthly interval 1",
        (_ctx: TestContext) => {
          const clock = fakeClock(`${todayISO}T12:00:00Z`);
          const rule: RepeatRule = {
            type: "fixed",
            frequency: "monthly",
            interval: 1,
            day_of_month: dayOfMonth,
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

      Then('result is "2026-05-15"', (_ctx: TestContext) => {
        expect(result).toBe("2026-05-15");
      });
    },
  );

  // @repeating-tasks-specs @FR5
  f.Scenario("Monthly interval 3 skip logic", ({ Given, When, Then }) => {
    Given(
      'previous next_date is "2026-01-15" with day_of_month 15 and today is "2026-06-01"',
      (_ctx: TestContext) => {
        previousNextDate = "2026-01-15";
        todayISO = "2026-06-01";
        dayOfMonth = 15;
      },
    );

    When(
      "system calculates next date with monthly interval 3",
      (_ctx: TestContext) => {
        const clock = fakeClock(`${todayISO}T12:00:00Z`);
        const rule: RepeatRule = {
          type: "fixed",
          frequency: "monthly",
          interval: 3,
          day_of_month: dayOfMonth,
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

    Then('result is "2026-07-15"', (_ctx: TestContext) => {
      expect(result).toBe("2026-07-15");
    });
  });
});

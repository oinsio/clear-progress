// implements FR6 of repeating-tasks-specs
// implements FR6 of add-recurring-edge-case-tests
import type { FeatureDescriibeCallbackParams } from "@amiceli/vitest-cucumber";
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import { expect, type TestContext } from "vitest";
import { fakeClock } from "@/lib/temporal";
import type { RepeatRule } from "@/types/common";
import { calculateNextDate } from "@/utils/repeatRule";

const feature = await loadFeature("../next_date_yearly.feature");

type Context = Record<string, never>;

describeFeature(feature, (f: FeatureDescriibeCallbackParams<Context>) => {
  let previousNextDate: string;
  let todayISO: string;
  let month: number;
  let day: number;
  let result: string;

  // @repeating-tasks-specs @FR6
  f.Scenario("Yearly interval 1", ({ Given, When, Then }) => {
    Given(
      'previous next_date is "2026-03-20" with month 3 day 20 and today is "2026-03-20"',
      (_ctx: TestContext) => {
        previousNextDate = "2026-03-20";
        todayISO = "2026-03-20";
        month = 3;
        day = 20;
      },
    );

    When(
      "system calculates next date with yearly interval 1",
      (_ctx: TestContext) => {
        const clock = fakeClock(`${todayISO}T12:00:00Z`);
        const rule: RepeatRule = {
          type: "fixed",
          frequency: "yearly",
          interval: 1,
          month_and_day: { month, day },
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

    Then('result is "2027-03-20"', (_ctx: TestContext) => {
      expect(result).toBe("2027-03-20");
    });
  });

  // @repeating-tasks-specs @FR6
  f.Scenario("Yearly Feb 29 in non-leap year", ({ Given, When, Then }) => {
    Given(
      'previous next_date is "2024-02-29" with month 2 day 29 and today is "2024-02-29"',
      (_ctx: TestContext) => {
        previousNextDate = "2024-02-29";
        todayISO = "2024-02-29";
        month = 2;
        day = 29;
      },
    );

    When(
      "system calculates next date with yearly interval 1",
      (_ctx: TestContext) => {
        const clock = fakeClock(`${todayISO}T12:00:00Z`);
        const rule: RepeatRule = {
          type: "fixed",
          frequency: "yearly",
          interval: 1,
          month_and_day: { month, day },
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

    Then('result is "2025-02-28"', (_ctx: TestContext) => {
      expect(result).toBe("2025-02-28");
    });
  });

  // @add-recurring-edge-case-tests @FR6
  f.Scenario(
    "Yearly early completion keeps scheduled date",
    ({ Given, When, Then }) => {
      Given(
        'previous next_date is "2026-12-25" with month 12 day 25 and today is "2026-12-20"',
        (_ctx: TestContext) => {
          previousNextDate = "2026-12-25";
          todayISO = "2026-12-20";
          month = 12;
          day = 25;
        },
      );

      When(
        "system calculates next date with yearly interval 1",
        (_ctx: TestContext) => {
          const clock = fakeClock(`${todayISO}T12:00:00Z`);
          const rule: RepeatRule = {
            type: "fixed",
            frequency: "yearly",
            interval: 1,
            month_and_day: { month, day },
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

      Then('result is "2026-12-25"', (_ctx: TestContext) => {
        expect(result).toBe("2026-12-25");
      });
    },
  );

  // @repeating-tasks-specs @FR6
  f.Scenario("Yearly skip logic skips past years", ({ Given, When, Then }) => {
    Given(
      'previous next_date is "2024-06-15" with month 6 day 15 and today is "2027-01-01"',
      (_ctx: TestContext) => {
        previousNextDate = "2024-06-15";
        todayISO = "2027-01-01";
        month = 6;
        day = 15;
      },
    );

    When(
      "system calculates next date with yearly interval 1",
      (_ctx: TestContext) => {
        const clock = fakeClock(`${todayISO}T12:00:00Z`);
        const rule: RepeatRule = {
          type: "fixed",
          frequency: "yearly",
          interval: 1,
          month_and_day: { month, day },
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

    Then('result is "2027-06-15"', (_ctx: TestContext) => {
      expect(result).toBe("2027-06-15");
    });
  });
});

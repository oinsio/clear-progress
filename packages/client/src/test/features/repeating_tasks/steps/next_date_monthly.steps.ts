// implements FR5 of repeating-tasks-specs
// implements FR5 of add-recurring-edge-case-tests
// implements FR9, FR10, FR11 of add-recurring-edge-case-tests
import type { FeatureDescriibeCallbackParams } from "@amiceli/vitest-cucumber";
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import { expect, type TestContext } from "vitest";
import { fakeClock } from "@/lib/temporal";
import type { RepeatRule } from "@/types/common";
import { calculateNextDate } from "@/utils/repeatRule";

const feature = await loadFeature("../next_date_monthly.feature");

type Context = Record<string, never>;

function computeMonthlyNextDate(
  todayISO: string,
  previousNextDate: string,
  dayOfMonth: number,
  interval: number,
): string {
  const clock = fakeClock(`${todayISO}T12:00:00Z`);
  const rule: RepeatRule = {
    type: "fixed",
    frequency: "monthly",
    interval,
    day_of_month: dayOfMonth,
    target_box: "today",
    advance_days: 0,
  };
  return calculateNextDate(
    rule,
    `${todayISO}T12:00:00.000Z`,
    previousNextDate,
    clock,
  );
}

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
        result = computeMonthlyNextDate(
          todayISO,
          previousNextDate,
          dayOfMonth,
          1,
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
        result = computeMonthlyNextDate(
          todayISO,
          previousNextDate,
          dayOfMonth,
          1,
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
          result = computeMonthlyNextDate(
            todayISO,
            previousNextDate,
            dayOfMonth,
            1,
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
        result = computeMonthlyNextDate(
          todayISO,
          previousNextDate,
          dayOfMonth,
          3,
        );
      },
    );

    Then('result is "2026-07-15"', (_ctx: TestContext) => {
      expect(result).toBe("2026-07-15");
    });
  });

  // @add-recurring-edge-case-tests @FR5
  f.Scenario(
    "Monthly early completion keeps scheduled date",
    ({ Given, When, Then }) => {
      Given(
        'previous next_date is "2026-07-15" with day_of_month 15 and today is "2026-07-12"',
        (_ctx: TestContext) => {
          previousNextDate = "2026-07-15";
          todayISO = "2026-07-12";
          dayOfMonth = 15;
        },
      );

      When(
        "system calculates next date with monthly interval 1",
        (_ctx: TestContext) => {
          result = computeMonthlyNextDate(
            todayISO,
            previousNextDate,
            dayOfMonth,
            1,
          );
        },
      );

      Then('result is "2026-07-15"', (_ctx: TestContext) => {
        expect(result).toBe("2026-07-15");
      });
    },
  );

  // @add-recurring-edge-case-tests @FR5
  f.Scenario(
    "Monthly early completion cross-month keeps scheduled date",
    ({ Given, When, Then }) => {
      Given(
        'previous next_date is "2026-08-01" with day_of_month 1 and today is "2026-07-28"',
        (_ctx: TestContext) => {
          previousNextDate = "2026-08-01";
          todayISO = "2026-07-28";
          dayOfMonth = 1;
        },
      );

      When(
        "system calculates next date with monthly interval 1",
        (_ctx: TestContext) => {
          result = computeMonthlyNextDate(
            todayISO,
            previousNextDate,
            dayOfMonth,
            1,
          );
        },
      );

      Then('result is "2026-08-01"', (_ctx: TestContext) => {
        expect(result).toBe("2026-08-01");
      });
    },
  );

  // @add-recurring-edge-case-tests @FR9
  f.Scenario(
    "Monthly clamping recovery from Feb 28 to Mar 31 for day 31",
    ({ Given, When, Then }) => {
      Given(
        'previous next_date is "2026-02-28" with day_of_month 31 and today is "2026-02-28"',
        (_ctx: TestContext) => {
          previousNextDate = "2026-02-28";
          todayISO = "2026-02-28";
          dayOfMonth = 31;
        },
      );

      When(
        "system calculates next date with monthly interval 1",
        (_ctx: TestContext) => {
          result = computeMonthlyNextDate(
            todayISO,
            previousNextDate,
            dayOfMonth,
            1,
          );
        },
      );

      Then('result is "2026-03-31"', (_ctx: TestContext) => {
        expect(result).toBe("2026-03-31");
      });
    },
  );

  // @add-recurring-edge-case-tests @FR10
  f.Scenario(
    "Monthly clamping Jan 30 to Feb 28 for day 30",
    ({ Given, When, Then }) => {
      Given(
        'previous next_date is "2026-01-30" with day_of_month 30 and today is "2026-01-30"',
        (_ctx: TestContext) => {
          previousNextDate = "2026-01-30";
          todayISO = "2026-01-30";
          dayOfMonth = 30;
        },
      );

      When(
        "system calculates next date with monthly interval 1",
        (_ctx: TestContext) => {
          result = computeMonthlyNextDate(
            todayISO,
            previousNextDate,
            dayOfMonth,
            1,
          );
        },
      );

      Then('result is "2026-02-28"', (_ctx: TestContext) => {
        expect(result).toBe("2026-02-28");
      });
    },
  );

  // @add-recurring-edge-case-tests @FR11
  f.Scenario(
    "Monthly clamping recovery from Feb 28 to Mar 30 for day 30",
    ({ Given, When, Then }) => {
      Given(
        'previous next_date is "2026-02-28" with day_of_month 30 and today is "2026-02-28"',
        (_ctx: TestContext) => {
          previousNextDate = "2026-02-28";
          todayISO = "2026-02-28";
          dayOfMonth = 30;
        },
      );

      When(
        "system calculates next date with monthly interval 1",
        (_ctx: TestContext) => {
          result = computeMonthlyNextDate(
            todayISO,
            previousNextDate,
            dayOfMonth,
            1,
          );
        },
      );

      Then('result is "2026-03-30"', (_ctx: TestContext) => {
        expect(result).toBe("2026-03-30");
      });
    },
  );
});

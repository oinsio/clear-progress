// implements FR1, FR2, FR3, FR4 of align-daily-to-calendar-rhythm
import type { FeatureDescriibeCallbackParams } from "@amiceli/vitest-cucumber";
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import { expect, type TestContext } from "vitest";
import { fakeClock } from "@/lib/temporal";
import type { RepeatRule } from "@/types/common";
import { calculateNextDate, resolveNextFixedDate } from "@/utils/repeatRule";

const feature = await loadFeature("../next_date_daily.feature");

type Context = Record<string, never>;

function buildDailyRule(interval: number): RepeatRule {
  return {
    type: "fixed",
    frequency: "daily",
    interval,
    target_box: "today",
    advance_days: 0,
  };
}

function computeNextDate(
  interval: number,
  completedAtDate: string,
  previousNextDate: string,
  todayISO: string,
): string {
  const clock = fakeClock(`${todayISO}T12:00:00Z`);
  return calculateNextDate(
    buildDailyRule(interval),
    `${completedAtDate}T12:00:00.000Z`,
    previousNextDate,
    clock,
  );
}

function computeNearestMatch(interval: number, todayISO: string): string {
  const clock = fakeClock(`${todayISO}T12:00:00Z`);
  return resolveNextFixedDate(
    buildDailyRule(interval),
    "",
    "nearest-match",
    clock,
  );
}

describeFeature(feature, (f: FeatureDescriibeCallbackParams<Context>) => {
  let previousNextDate: string;
  let completedAtDate: string;
  let todayISO: string;
  let result: string;

  // @align-daily-to-calendar-rhythm @FR1
  f.Scenario("Daily interval 1 normal completion", ({ Given, When, Then }) => {
    Given(
      'previous next_date is "2026-07-01" and today is "2026-07-01" and completed_at date is "2026-07-01"',
      (_ctx: TestContext) => {
        previousNextDate = "2026-07-01";
        todayISO = "2026-07-01";
        completedAtDate = "2026-07-01";
      },
    );

    When(
      "system calculates next date with daily interval 1",
      (_ctx: TestContext) => {
        result = computeNextDate(
          1,
          completedAtDate,
          previousNextDate,
          todayISO,
        );
      },
    );

    Then('result is "2026-07-02"', (_ctx: TestContext) => {
      expect(result).toBe("2026-07-02");
    });
  });

  // @align-daily-to-calendar-rhythm @FR2
  f.Scenario(
    "Daily interval 1 early completion preserves schedule",
    ({ Given, When, Then }) => {
      Given(
        'previous next_date is "2026-07-02" and today is "2026-07-01" and completed_at date is "2026-07-01"',
        (_ctx: TestContext) => {
          previousNextDate = "2026-07-02";
          todayISO = "2026-07-01";
          completedAtDate = "2026-07-01";
        },
      );

      When(
        "system calculates next date with daily interval 1",
        (_ctx: TestContext) => {
          result = computeNextDate(
            1,
            completedAtDate,
            previousNextDate,
            todayISO,
          );
        },
      );

      Then('result is "2026-07-02"', (_ctx: TestContext) => {
        expect(result).toBe("2026-07-02");
      });
    },
  );

  // @align-daily-to-calendar-rhythm @FR3
  f.Scenario(
    "Daily interval 1 late by 1 day skips to future",
    ({ Given, When, Then }) => {
      Given(
        'previous next_date is "2026-07-01" and today is "2026-07-02" and completed_at date is "2026-07-02"',
        (_ctx: TestContext) => {
          previousNextDate = "2026-07-01";
          todayISO = "2026-07-02";
          completedAtDate = "2026-07-02";
        },
      );

      When(
        "system calculates next date with daily interval 1",
        (_ctx: TestContext) => {
          result = computeNextDate(
            1,
            completedAtDate,
            previousNextDate,
            todayISO,
          );
        },
      );

      Then('result is "2026-07-03"', (_ctx: TestContext) => {
        expect(result).toBe("2026-07-03");
      });
    },
  );

  // @align-daily-to-calendar-rhythm @FR3
  f.Scenario(
    "Daily interval 1 long inactivity skips to tomorrow",
    ({ Given, When, Then }) => {
      Given(
        'previous next_date is "2026-07-01" and today is "2026-07-15" and completed_at date is "2026-07-15"',
        (_ctx: TestContext) => {
          previousNextDate = "2026-07-01";
          todayISO = "2026-07-15";
          completedAtDate = "2026-07-15";
        },
      );

      When(
        "system calculates next date with daily interval 1",
        (_ctx: TestContext) => {
          result = computeNextDate(
            1,
            completedAtDate,
            previousNextDate,
            todayISO,
          );
        },
      );

      Then('result is "2026-07-16"', (_ctx: TestContext) => {
        expect(result).toBe("2026-07-16");
      });
    },
  );

  // @align-daily-to-calendar-rhythm @FR1
  f.Scenario("Daily interval 3 normal completion", ({ Given, When, Then }) => {
    Given(
      'previous next_date is "2026-07-01" and today is "2026-07-01" and completed_at date is "2026-07-01"',
      (_ctx: TestContext) => {
        previousNextDate = "2026-07-01";
        todayISO = "2026-07-01";
        completedAtDate = "2026-07-01";
      },
    );

    When(
      "system calculates next date with daily interval 3",
      (_ctx: TestContext) => {
        result = computeNextDate(
          3,
          completedAtDate,
          previousNextDate,
          todayISO,
        );
      },
    );

    Then('result is "2026-07-04"', (_ctx: TestContext) => {
      expect(result).toBe("2026-07-04");
    });
  });

  // @align-daily-to-calendar-rhythm @FR2
  f.Scenario(
    "Daily interval 3 early completion preserves schedule",
    ({ Given, When, Then }) => {
      Given(
        'previous next_date is "2026-07-04" and today is "2026-07-02" and completed_at date is "2026-07-02"',
        (_ctx: TestContext) => {
          previousNextDate = "2026-07-04";
          todayISO = "2026-07-02";
          completedAtDate = "2026-07-02";
        },
      );

      When(
        "system calculates next date with daily interval 3",
        (_ctx: TestContext) => {
          result = computeNextDate(
            3,
            completedAtDate,
            previousNextDate,
            todayISO,
          );
        },
      );

      Then('result is "2026-07-04"', (_ctx: TestContext) => {
        expect(result).toBe("2026-07-04");
      });
    },
  );

  // @align-daily-to-calendar-rhythm @FR3
  f.Scenario(
    "Daily interval 3 late but candidate still in future",
    ({ Given, When, Then }) => {
      Given(
        'previous next_date is "2026-07-01" and today is "2026-07-03" and completed_at date is "2026-07-03"',
        (_ctx: TestContext) => {
          previousNextDate = "2026-07-01";
          todayISO = "2026-07-03";
          completedAtDate = "2026-07-03";
        },
      );

      When(
        "system calculates next date with daily interval 3",
        (_ctx: TestContext) => {
          result = computeNextDate(
            3,
            completedAtDate,
            previousNextDate,
            todayISO,
          );
        },
      );

      Then('result is "2026-07-04"', (_ctx: TestContext) => {
        expect(result).toBe("2026-07-04");
      });
    },
  );

  // @align-daily-to-calendar-rhythm @FR3
  f.Scenario(
    "Daily interval 3 long inactivity skips by grid",
    ({ Given, When, Then }) => {
      Given(
        'previous next_date is "2026-07-01" and today is "2026-07-15" and completed_at date is "2026-07-15"',
        (_ctx: TestContext) => {
          previousNextDate = "2026-07-01";
          todayISO = "2026-07-15";
          completedAtDate = "2026-07-15";
        },
      );

      When(
        "system calculates next date with daily interval 3",
        (_ctx: TestContext) => {
          result = computeNextDate(
            3,
            completedAtDate,
            previousNextDate,
            todayISO,
          );
        },
      );

      Then('result is "2026-07-16"', (_ctx: TestContext) => {
        expect(result).toBe("2026-07-16");
      });
    },
  );

  // @align-daily-to-calendar-rhythm @FR3
  f.Scenario(
    "Daily interval 3 long inactivity candidate equals today",
    ({ Given, When, Then }) => {
      Given(
        'previous next_date is "2026-07-01" and today is "2026-07-16" and completed_at date is "2026-07-16"',
        (_ctx: TestContext) => {
          previousNextDate = "2026-07-01";
          todayISO = "2026-07-16";
          completedAtDate = "2026-07-16";
        },
      );

      When(
        "system calculates next date with daily interval 3",
        (_ctx: TestContext) => {
          result = computeNextDate(
            3,
            completedAtDate,
            previousNextDate,
            todayISO,
          );
        },
      );

      Then('result is "2026-07-19"', (_ctx: TestContext) => {
        expect(result).toBe("2026-07-19");
      });
    },
  );

  // @align-daily-to-calendar-rhythm @FR4
  f.Scenario(
    "Daily nearest-match on rule creation with interval 1",
    ({ Given, When, Then }) => {
      Given('today is "2026-07-01"', (_ctx: TestContext) => {
        todayISO = "2026-07-01";
      });

      When(
        "system calculates nearest-match for daily interval 1",
        (_ctx: TestContext) => {
          result = computeNearestMatch(1, todayISO);
        },
      );

      Then('result is "2026-07-02"', (_ctx: TestContext) => {
        expect(result).toBe("2026-07-02");
      });
    },
  );

  // @align-daily-to-calendar-rhythm @FR4
  f.Scenario(
    "Daily nearest-match on rule creation with interval 3",
    ({ Given, When, Then }) => {
      Given('today is "2026-07-01"', (_ctx: TestContext) => {
        todayISO = "2026-07-01";
      });

      When(
        "system calculates nearest-match for daily interval 3",
        (_ctx: TestContext) => {
          result = computeNearestMatch(3, todayISO);
        },
      );

      Then('result is "2026-07-04"', (_ctx: TestContext) => {
        expect(result).toBe("2026-07-04");
      });
    },
  );

  // @align-daily-to-calendar-rhythm @FR4
  f.Scenario(
    "Daily nearest-match on rule change resets rhythm",
    ({ Given, When, Then }) => {
      Given('today is "2026-07-03"', (_ctx: TestContext) => {
        todayISO = "2026-07-03";
      });

      When(
        "system calculates nearest-match for daily interval 2",
        (_ctx: TestContext) => {
          result = computeNearestMatch(2, todayISO);
        },
      );

      Then('result is "2026-07-05"', (_ctx: TestContext) => {
        expect(result).toBe("2026-07-05");
      });
    },
  );
});

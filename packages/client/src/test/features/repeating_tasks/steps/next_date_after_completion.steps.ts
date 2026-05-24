// implements FR7 of repeating-tasks-specs
import type { FeatureDescriibeCallbackParams } from "@amiceli/vitest-cucumber";
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import { expect, type TestContext } from "vitest";
import { fakeClock } from "@/lib/temporal";
import type { RepeatRule } from "@/types/common";
import { calculateNextDate } from "@/utils/repeatRule";

const feature = await loadFeature("../next_date_after_completion.feature");

type Context = Record<string, never>;

describeFeature(feature, (f: FeatureDescriibeCallbackParams<Context>) => {
  let completedAt: string;
  let delayDays: number;
  let timeZone: string;
  let todayISO: string;
  let result: string;

  // @repeating-tasks-specs @FR7
  f.Scenario("After completion with delay 3 days", ({ Given, When, Then }) => {
    Given(
      'completed_at is "2026-01-15T10:00:00.000Z" with delay_days 3',
      (_ctx: TestContext) => {
        completedAt = "2026-01-15T10:00:00.000Z";
        delayDays = 3;
        timeZone = "UTC";
        todayISO = "2026-01-15";
      },
    );

    When(
      "system calculates next date for after_completion",
      (_ctx: TestContext) => {
        const clock = fakeClock(`${todayISO}T12:00:00Z`, timeZone);
        const rule: RepeatRule = {
          type: "after_completion",
          delay_days: delayDays,
          target_box: "inbox",
          advance_days: 0,
        };
        result = calculateNextDate(rule, completedAt, undefined, clock);
      },
    );

    Then('result is "2026-01-18"', (_ctx: TestContext) => {
      expect(result).toBe("2026-01-18");
    });
  });

  // @repeating-tasks-specs @FR7
  f.Scenario(
    "After completion uses current timezone",
    ({ Given, When, Then }) => {
      Given(
        'completed_at is "2026-01-15T23:00:00.000Z" with delay_days 1 in timezone "America/New_York"',
        (_ctx: TestContext) => {
          completedAt = "2026-01-15T23:00:00.000Z";
          delayDays = 1;
          timeZone = "America/New_York";
          todayISO = "2026-01-15";
        },
      );

      When(
        "system calculates next date for after_completion",
        (_ctx: TestContext) => {
          const clock = fakeClock("2026-01-15T23:00:00Z", "America/New_York");
          const rule: RepeatRule = {
            type: "after_completion",
            delay_days: delayDays,
            target_box: "inbox",
            advance_days: 0,
          };
          result = calculateNextDate(rule, completedAt, undefined, clock);
        },
      );

      Then('result is "2026-01-16"', (_ctx: TestContext) => {
        expect(result).toBe("2026-01-16");
      });
    },
  );

  // @repeating-tasks-specs @FR7
  f.Scenario(
    "After completion no skip logic even if date is past",
    ({ Given, When, Then }) => {
      Given(
        'completed_at is "2026-01-10T10:00:00.000Z" with delay_days 1 and today is "2026-01-20"',
        (_ctx: TestContext) => {
          completedAt = "2026-01-10T10:00:00.000Z";
          delayDays = 1;
          timeZone = "UTC";
          todayISO = "2026-01-20";
        },
      );

      When(
        "system calculates next date for after_completion",
        (_ctx: TestContext) => {
          const clock = fakeClock(`${todayISO}T12:00:00Z`, timeZone);
          const rule: RepeatRule = {
            type: "after_completion",
            delay_days: delayDays,
            target_box: "inbox",
            advance_days: 0,
          };
          result = calculateNextDate(rule, completedAt, undefined, clock);
        },
      );

      Then('result is "2026-01-11"', (_ctx: TestContext) => {
        expect(result).toBe("2026-01-11");
      });
    },
  );
});

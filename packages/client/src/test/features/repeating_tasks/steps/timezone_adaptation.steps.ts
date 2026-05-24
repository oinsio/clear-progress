// implements FR12 of repeating-tasks-specs
import type { FeatureDescriibeCallbackParams } from "@amiceli/vitest-cucumber";
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import { expect, type TestContext } from "vitest";
import { fakeClock } from "@/lib/temporal";
import type { RepeatRule } from "@/types/common";
import { calculateNextDate } from "@/utils/repeatRule";

const feature = await loadFeature("../timezone_adaptation.feature");

type Context = Record<string, never>;

describeFeature(feature, (f: FeatureDescriibeCallbackParams<Context>) => {
  let completedAt: string;
  let result: string;

  // @repeating-tasks-specs @FR12
  f.Scenario(
    "Timezone change affects completed date interpretation",
    ({ Given, When, Then }) => {
      Given(
        'completed_at is "2026-01-16T03:00:00.000Z" and timezone is "Asia/Almaty"',
        (_ctx: TestContext) => {
          completedAt = "2026-01-16T03:00:00.000Z";
        },
      );

      When(
        "system calculates next date for after_completion with delay_days 1",
        (_ctx: TestContext) => {
          const clock = fakeClock("2026-01-16T03:00:00Z", "Asia/Almaty");
          const rule: RepeatRule = {
            type: "after_completion",
            delay_days: 1,
            target_box: "inbox",
            advance_days: 0,
          };
          result = calculateNextDate(rule, completedAt, undefined, clock);
        },
      );

      Then('result is "2026-01-17"', (_ctx: TestContext) => {
        expect(result).toBe("2026-01-17");
      });
    },
  );

  // @repeating-tasks-specs @FR12
  f.Scenario(
    "Same instant different timezone gives different date",
    ({ Given, When, Then }) => {
      Given(
        'completed_at is "2026-01-16T03:00:00.000Z" and timezone is "America/New_York"',
        (_ctx: TestContext) => {
          completedAt = "2026-01-16T03:00:00.000Z";
        },
      );

      When(
        "system calculates next date for after_completion with delay_days 1",
        (_ctx: TestContext) => {
          const clock = fakeClock("2026-01-16T03:00:00Z", "America/New_York");
          const rule: RepeatRule = {
            type: "after_completion",
            delay_days: 1,
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
});

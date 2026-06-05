// implements FR3 of day-boundary
import type { FeatureDescriibeCallbackParams } from "@amiceli/vitest-cucumber";
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import { expect, type TestContext } from "vitest";
import { fakeClock } from "@/lib/temporal";
import { getLogicalDate } from "@/utils/getLogicalDate";

const feature = await loadFeature("../day_boundary_logical_date.feature");

type Context = Record<string, never>;

describeFeature(feature, (f: FeatureDescriibeCallbackParams<Context>) => {
  let dayBoundary: string;
  let timeZone: string;
  let localTime: string;
  let localDate: string;
  let logicalDate: string;

  f.BeforeEachScenario(() => {
    dayBoundary = "";
    timeZone = "UTC";
    localTime = "";
    localDate = "";
    logicalDate = "";
  });

  // @day-boundary @FR3
  f.ScenarioOutline(
    "Logical date depends on current time relative to boundary",
    ({ Given, And, When, Then }, variables) => {
      Given('day boundary is "<boundary>"', (_ctx: TestContext) => {
        dayBoundary = variables.boundary as string;
      });

      And('current local time is "<time>" on "<date>"', (_ctx: TestContext) => {
        localTime = variables.time as string;
        localDate = variables.date as string;
      });

      When("system computes the logical date", (_ctx: TestContext) => {
        const clock = fakeClock(`${localDate}T${localTime}:00Z`, timeZone);
        logicalDate = getLogicalDate(clock, dayBoundary);
      });

      Then('logical date is "<logical_date>"', (_ctx: TestContext) => {
        expect(logicalDate).toBe(variables.logical_date as string);
      });
    },
  );

  // @day-boundary @FR3
  f.Scenario("Respects current timezone", ({ Given, And, When, Then }) => {
    Given('day boundary is "02:00"', (_ctx: TestContext) => {
      dayBoundary = "02:00";
    });

    And('timezone is "Asia/Tokyo"', (_ctx: TestContext) => {
      timeZone = "Asia/Tokyo";
    });

    And(
      'current local time is "01:00" on "2026-06-05"',
      (_ctx: TestContext) => {
        localTime = "01:00";
        localDate = "2026-06-05";
      },
    );

    When("system computes the logical date", (_ctx: TestContext) => {
      // Asia/Tokyo is UTC+9, so 01:00 local = 2026-06-04T16:00:00Z
      const utcTimestamp = `2026-06-04T16:00:00Z`;
      const clock = fakeClock(utcTimestamp, timeZone);
      logicalDate = getLogicalDate(clock, dayBoundary);
    });

    Then('logical date is "2026-06-04"', (_ctx: TestContext) => {
      expect(logicalDate).toBe("2026-06-04");
    });
  });
});

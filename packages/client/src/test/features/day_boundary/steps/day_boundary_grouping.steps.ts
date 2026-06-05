// implements FR8, FR9 of day-boundary
import type { FeatureDescriibeCallbackParams } from "@amiceli/vitest-cucumber";
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import i18next from "i18next";
import { expect, type TestContext } from "vitest";
import { fakeClock } from "@/lib/temporal";
import { formatShortDateTime, groupCompletedTasks } from "@/shared/lib/utils";
import { buildTask } from "@/test/factories/taskFactory";
import type { Task } from "@/types/entities";

const feature = await loadFeature("../day_boundary_grouping.feature");

type Context = Record<string, never>;

describeFeature(feature, (f: FeatureDescriibeCallbackParams<Context>) => {
  let dayBoundary: string;
  let completedAtIso: string;
  let task: Task;
  let groupResult: ReturnType<typeof groupCompletedTasks>;
  let formattedLabel: string;
  let currentTime: string;
  let currentDate: string;

  f.BeforeEachScenario(() => {
    dayBoundary = "";
    completedAtIso = "";
    formattedLabel = "";
    currentTime = "";
    currentDate = "";
  });

  // @day-boundary @FR8
  f.Scenario(
    "Task completed before boundary grouped as previous logical day",
    ({ Given, And, When, Then }) => {
      Given('day boundary is "02:00"', (_ctx: TestContext) => {
        dayBoundary = "02:00";
      });

      And(
        'a task was completed at "01:30" on "2026-06-05"',
        (_ctx: TestContext) => {
          completedAtIso = "2026-06-05T01:30:00.000Z";
          task = buildTask({
            is_completed: true,
            completed_at: completedAtIso,
          });
        },
      );

      When("system groups completed tasks", (_ctx: TestContext) => {
        const clock = fakeClock("2026-06-05T14:00:00Z");
        groupResult = groupCompletedTasks([task], clock, dayBoundary);
      });

      Then('the task is grouped under "2026-06-04"', (_ctx: TestContext) => {
        expect(groupResult.todayTasks).toHaveLength(0);
        expect(groupResult.yesterdayTasks).toContain(task);
      });
    },
  );

  // @day-boundary @FR8
  f.Scenario(
    "Task completed after boundary grouped as current logical day",
    ({ Given, And, When, Then }) => {
      Given('day boundary is "02:00"', (_ctx: TestContext) => {
        dayBoundary = "02:00";
      });

      And(
        'a task was completed at "14:00" on "2026-06-05"',
        (_ctx: TestContext) => {
          completedAtIso = "2026-06-05T14:00:00.000Z";
          task = buildTask({
            is_completed: true,
            completed_at: completedAtIso,
          });
        },
      );

      When("system groups completed tasks", (_ctx: TestContext) => {
        const clock = fakeClock("2026-06-05T14:00:00Z");
        groupResult = groupCompletedTasks([task], clock, dayBoundary);
      });

      Then('the task is grouped under "2026-06-05"', (_ctx: TestContext) => {
        expect(groupResult.todayTasks).toContain(task);
      });
    },
  );

  // @day-boundary @FR8
  f.Scenario(
    "Default boundary preserves midnight-based grouping",
    ({ Given, And, When, Then }) => {
      Given('day boundary is "00:00"', (_ctx: TestContext) => {
        dayBoundary = "00:00";
      });

      And(
        'a task was completed at "01:30" on "2026-06-05"',
        (_ctx: TestContext) => {
          completedAtIso = "2026-06-05T01:30:00.000Z";
          task = buildTask({
            is_completed: true,
            completed_at: completedAtIso,
          });
        },
      );

      When("system groups completed tasks", (_ctx: TestContext) => {
        const clock = fakeClock("2026-06-05T14:00:00Z");
        groupResult = groupCompletedTasks([task], clock, dayBoundary);
      });

      Then('the task is grouped under "2026-06-05"', (_ctx: TestContext) => {
        expect(groupResult.todayTasks).toContain(task);
      });
    },
  );

  // @day-boundary @FR9
  f.Scenario(
    "Today label shown for task completed before boundary",
    ({ Given, And, When, Then }) => {
      Given('day boundary is "02:00"', (_ctx: TestContext) => {
        dayBoundary = "02:00";
      });

      And(
        'current local time is "01:30" on "2026-06-05"',
        (_ctx: TestContext) => {
          currentTime = "01:30";
          currentDate = "2026-06-05";
        },
      );

      And(
        'a task was completed at "23:00" on "2026-06-04"',
        (_ctx: TestContext) => {
          completedAtIso = "2026-06-04T23:00:00.000Z";
        },
      );

      When("system formats the completion date", (_ctx: TestContext) => {
        const clock = fakeClock(`${currentDate}T${currentTime}:00Z`);
        formattedLabel = formatShortDateTime(
          completedAtIso,
          clock,
          dayBoundary,
        );
      });

      Then('the label is "Today"', (_ctx: TestContext) => {
        const todayTranslation = i18next.t("task.today");
        expect(formattedLabel).toContain(todayTranslation);
      });
    },
  );

  // @day-boundary @FR9
  f.Scenario(
    "Default boundary preserves date labels",
    ({ Given, And, When, Then }) => {
      Given('day boundary is "00:00"', (_ctx: TestContext) => {
        dayBoundary = "00:00";
      });

      And(
        'current local time is "14:00" on "2026-06-05"',
        (_ctx: TestContext) => {
          currentTime = "14:00";
          currentDate = "2026-06-05";
        },
      );

      And(
        'a task was completed at "10:00" on "2026-06-05"',
        (_ctx: TestContext) => {
          completedAtIso = "2026-06-05T10:00:00.000Z";
        },
      );

      When("system formats the completion date", (_ctx: TestContext) => {
        const clock = fakeClock(`${currentDate}T${currentTime}:00Z`);
        formattedLabel = formatShortDateTime(
          completedAtIso,
          clock,
          dayBoundary,
        );
      });

      Then('the label is "Today"', (_ctx: TestContext) => {
        const todayTranslation = i18next.t("task.today");
        expect(formattedLabel).toContain(todayTranslation);
      });
    },
  );
});

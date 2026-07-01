// implements FR7 of day-boundary
import "fake-indexeddb/auto";
import type { FeatureDescriibeCallbackParams } from "@amiceli/vitest-cucumber";
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import { expect, type TestContext, vi } from "vitest";
import { db } from "@/db/database";
import { ChecklistRepository } from "@/db/repositories/ChecklistRepository";
import { TaskRepository } from "@/db/repositories/TaskRepository";
import { fakeClock } from "@/lib/temporal";
import { type RecurringResult, TaskService } from "@/services/TaskService";
import { buildTask } from "@/test/factories/taskFactory";
import type { Task } from "@/types/entities";
import { getLogicalDate } from "@/utils/getLogicalDate";

vi.mock("@/utils/repeatRule", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/utils/repeatRule")>();
  return {
    ...original,
    calculateNextDate: vi.fn(),
    calculateAppearDate: vi.fn(),
  };
});

import { calculateAppearDate, calculateNextDate } from "@/utils/repeatRule";

const feature = await loadFeature("../day_boundary_recurring.feature");

const TASK_ID = "b0000000-0000-4000-8000-000000000020";

const DAILY_RULE = JSON.stringify({
  type: "fixed",
  frequency: "daily",
  interval: 1,
  target_box: "today",
  advance_days: 0,
});

type Context = Record<string, never>;

async function seedRecurringTask(
  nextDate: string,
  appearDate: string,
  expectedNextDate: string,
  expectedAppearDate: string,
): Promise<void> {
  const task = buildTask({
    id: TASK_ID,
    name: "Recurring task",
    box: "today",
    repeat_rule: DAILY_RULE,
    next_date: nextDate,
    appear_date: appearDate,
  });
  await db.tasks.add(task);
  vi.mocked(calculateNextDate).mockReturnValue(expectedNextDate);
  vi.mocked(calculateAppearDate).mockReturnValue(expectedAppearDate);
}

async function completeTask(
  clockISO: string,
  logicalDate?: string,
): Promise<{ completed: Task; recurringResult: RecurringResult }> {
  const clock = fakeClock(clockISO);
  const taskService = new TaskService(
    new TaskRepository(),
    new ChecklistRepository(),
    clock,
  );
  return taskService.complete(TASK_ID, logicalDate);
}

describeFeature(feature, (f: FeatureDescriibeCallbackParams<Context>) => {
  let logicalDate: string;
  let completionResult: { completed: Task; recurringResult: RecurringResult };
  let dayBoundary: string;
  let localTime: string;
  let localDate: string;

  f.BeforeEachScenario(async () => {
    await db.tasks.clear();
    await db.checklist_items.clear();
    logicalDate = "";
    dayBoundary = "";
    localTime = "";
    localDate = "";
    vi.mocked(calculateNextDate).mockReset();
    vi.mocked(calculateAppearDate).mockReset();
  });

  // @day-boundary @FR7
  f.Scenario(
    "Recurring copy hidden when appear date is after logical date",
    ({ Given, And, When, Then }) => {
      Given('logical date is "2026-01-15"', (_ctx: TestContext) => {
        logicalDate = "2026-01-15";
      });

      And(
        'a repeating task with calculated appear date "2026-01-20"',
        async (_ctx: TestContext) => {
          await seedRecurringTask(
            "2026-01-15",
            "2026-01-15",
            "2026-01-20",
            "2026-01-20",
          );
        },
      );

      When("user completes the repeating task", async (_ctx: TestContext) => {
        completionResult = await completeTask(
          "2026-01-15T10:00:00Z",
          logicalDate,
        );
      });

      Then("the recurring copy is hidden", (_ctx: TestContext) => {
        expect(completionResult.recurringResult.status).toBe("created");
        if (completionResult.recurringResult.status === "created") {
          expect(completionResult.recurringResult.task.is_hidden).toBe(true);
        }
      });
    },
  );

  // @day-boundary @FR7
  f.Scenario(
    "Recurring copy visible when appear date matches logical date",
    ({ Given, And, When, Then }) => {
      Given('logical date is "2026-01-15"', (_ctx: TestContext) => {
        logicalDate = "2026-01-15";
      });

      And(
        'a repeating task with calculated appear date "2026-01-15"',
        async (_ctx: TestContext) => {
          await seedRecurringTask(
            "2026-01-14",
            "2026-01-14",
            "2026-01-15",
            "2026-01-15",
          );
        },
      );

      When("user completes the repeating task", async (_ctx: TestContext) => {
        completionResult = await completeTask(
          "2026-01-15T10:00:00Z",
          logicalDate,
        );
      });

      Then("the recurring copy is visible", (_ctx: TestContext) => {
        expect(completionResult.recurringResult.status).toBe("created");
        if (completionResult.recurringResult.status === "created") {
          expect(completionResult.recurringResult.task.is_hidden).toBe(false);
        }
      });
    },
  );

  // @day-boundary @FR7
  f.Scenario(
    "Logical date used when day boundary is non-midnight",
    ({ Given, And, When, Then }) => {
      Given('day boundary is "02:00"', (_ctx: TestContext) => {
        dayBoundary = "02:00";
      });

      And(
        'current local time is "01:30" on "2026-06-05"',
        (_ctx: TestContext) => {
          localTime = "01:30";
          localDate = "2026-06-05";
        },
      );

      And(
        'a repeating task with calculated appear date "2026-06-05"',
        async (_ctx: TestContext) => {
          await seedRecurringTask(
            "2026-06-04",
            "2026-06-04",
            "2026-06-05",
            "2026-06-05",
          );
        },
      );

      When(
        'user completes the repeating task with logical date "2026-06-04"',
        async (_ctx: TestContext) => {
          const clock = fakeClock(`${localDate}T${localTime}:00Z`);
          logicalDate = getLogicalDate(clock, dayBoundary);
          expect(logicalDate).toBe("2026-06-04");
          completionResult = await completeTask(
            `${localDate}T${localTime}:00Z`,
            logicalDate,
          );
        },
      );

      Then("the recurring copy is hidden", (_ctx: TestContext) => {
        expect(completionResult.recurringResult.status).toBe("created");
        if (completionResult.recurringResult.status === "created") {
          expect(completionResult.recurringResult.task.is_hidden).toBe(true);
        }
      });
    },
  );

  // @day-boundary @FR7
  f.Scenario(
    "Backward compatibility without logical date parameter",
    ({ Given, When, Then }) => {
      Given(
        'a repeating task with calculated appear date "2026-01-15"',
        async (_ctx: TestContext) => {
          await seedRecurringTask(
            "2026-01-14",
            "2026-01-14",
            "2026-01-15",
            "2026-01-15",
          );
        },
      );

      When(
        "user completes the repeating task without logical date",
        async (_ctx: TestContext) => {
          completionResult = await completeTask("2026-01-15T10:00:00Z");
        },
      );

      Then(
        "the recurring copy visibility is determined by calendar date from clock",
        (_ctx: TestContext) => {
          expect(completionResult.recurringResult.status).toBe("created");
          // clock.plainDateISO() = "2026-01-15", appear_date = "2026-01-15"
          // shouldReveal: appear_date <= today → true → is_hidden = false
          if (completionResult.recurringResult.status === "created") {
            expect(completionResult.recurringResult.task.is_hidden).toBe(false);
          }
        },
      );
    },
  );
});

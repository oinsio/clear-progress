// implements FR10 of repeating-tasks-specs
import "fake-indexeddb/auto";
import type { FeatureDescriibeCallbackParams } from "@amiceli/vitest-cucumber";
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import { expect, type TestContext } from "vitest";
import { db } from "@/db/database";
import { ChecklistRepository } from "@/db/repositories/ChecklistRepository";
import { TaskRepository } from "@/db/repositories/TaskRepository";
import { fakeClock } from "@/lib/temporal";
import { type RecurringResult, TaskService } from "@/services/TaskService";
import { buildTask } from "@/test/factories/taskFactory";
import type { Task } from "@/types/entities";

const feature = await loadFeature("../hidden_task_visibility.feature");

const TASK_ID = "a0000000-0000-4000-8000-000000000010";

type Context = Record<string, never>;

async function setupRecurringTask(advanceDays: number): Promise<TaskService> {
  const clock = fakeClock("2026-06-15T10:00:00Z");
  const service = new TaskService(
    new TaskRepository(),
    new ChecklistRepository(),
    clock,
  );
  const task = buildTask({
    id: TASK_ID,
    name: "Daily task",
    box: "today",
    repeat_rule: JSON.stringify({
      type: "fixed",
      frequency: "daily",
      interval: 1,
      target_box: "today",
      advance_days: advanceDays,
    }),
    next_date: "2026-06-15",
    appear_date: "2026-06-15",
  });
  await db.tasks.add(task);
  return service;
}

function assertRecurringHidden(
  recurringResult: RecurringResult,
  expectedHidden: boolean,
): void {
  expect(recurringResult.status).toBe("created");
  if (recurringResult.status === "created") {
    expect(recurringResult.task.is_hidden).toBe(expectedHidden);
  }
}

describeFeature(feature, (f: FeatureDescriibeCallbackParams<Context>) => {
  let taskService: TaskService;
  let completionResult: { completed: Task; recurringResult: RecurringResult };

  f.BeforeEachScenario(async () => {
    await db.tasks.clear();
    await db.checklist_items.clear();
  });

  // @repeating-tasks-specs @FR10
  f.Scenario(
    "Recurring copy hidden when appear_date is future",
    ({ Given, When, Then }) => {
      Given(
        'today is "2026-06-15" and advance_days is 0',
        async (_ctx: TestContext) => {
          taskService = await setupRecurringTask(0);
        },
      );

      When("system creates a recurring copy", async (_ctx: TestContext) => {
        completionResult = await taskService.complete(TASK_ID);
      });

      Then("copy has is_hidden true", (_ctx: TestContext) => {
        assertRecurringHidden(completionResult.recurringResult, true);
      });
    },
  );

  // @repeating-tasks-specs @FR10
  f.Scenario(
    "Recurring copy visible when appear_date is today",
    ({ Given, When, Then }) => {
      Given(
        'today is "2026-06-15" and advance_days is 1',
        async (_ctx: TestContext) => {
          taskService = await setupRecurringTask(1);
        },
      );

      When("system creates a recurring copy", async (_ctx: TestContext) => {
        completionResult = await taskService.complete(TASK_ID);
      });

      Then("copy has is_hidden false", (_ctx: TestContext) => {
        assertRecurringHidden(completionResult.recurringResult, false);
      });
    },
  );

  // @repeating-tasks-specs @FR10
  f.Scenario(
    "Recurring copy visible when appear_date is past",
    ({ Given, When, Then }) => {
      Given(
        'today is "2026-06-15" and advance_days is 5',
        async (_ctx: TestContext) => {
          taskService = await setupRecurringTask(5);
        },
      );

      When("system creates a recurring copy", async (_ctx: TestContext) => {
        completionResult = await taskService.complete(TASK_ID);
      });

      Then("copy has is_hidden false", (_ctx: TestContext) => {
        assertRecurringHidden(completionResult.recurringResult, false);
      });
    },
  );
});

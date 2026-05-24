// implements FR13 of repeating-tasks-specs
import "fake-indexeddb/auto";
import type { FeatureDescriibeCallbackParams } from "@amiceli/vitest-cucumber";
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import { expect, type TestContext } from "vitest";
import { db } from "@/db/database";
import { ChecklistRepository } from "@/db/repositories/ChecklistRepository";
import { TaskRepository } from "@/db/repositories/TaskRepository";
import { fakeClock } from "@/lib/temporal";
import { TaskService } from "@/services/TaskService";
import { buildTask } from "@/test/factories/taskFactory";

const feature = await loadFeature("../recurring_copy_update.feature");

const DAILY_RULE = JSON.stringify({
  type: "fixed",
  frequency: "daily",
  interval: 1,
  target_box: "today",
  advance_days: 0,
});

const TASK_RECOMPLETION_ID = "e0000000-0000-4000-8000-000000000005";
const HIDDEN_COPY_ID = "b0000000-0000-4000-8000-000000000002";

type Context = Record<string, never>;

describeFeature(feature, (f: FeatureDescriibeCallbackParams<Context>) => {
  let taskService: TaskService;
  let taskCountBefore: number;

  f.BeforeEachScenario(async () => {
    await db.tasks.clear();
    await db.checklist_items.clear();
    const clock = fakeClock("2026-01-15T10:00:00Z");
    taskService = new TaskService(
      new TaskRepository(),
      new ChecklistRepository(),
      clock,
    );
  });

  // @repeating-tasks-specs @FR13
  f.Scenario(
    "Update existing hidden copy on re-completion",
    ({ Given, When, Then, And }) => {
      Given(
        "active task A with a daily repeat_rule and existing hidden copy B",
        async (_ctx: TestContext) => {
          const taskA = buildTask({
            id: TASK_RECOMPLETION_ID,
            name: "Morning routine",
            box: "today",
            repeat_rule: DAILY_RULE,
            original_task_id: "",
            next_date: "2026-01-15",
            appear_date: "2026-01-15",
          });
          await db.tasks.add(taskA);

          const hiddenCopy = buildTask({
            id: HIDDEN_COPY_ID,
            name: "Morning routine",
            box: "today",
            repeat_rule: DAILY_RULE,
            original_task_id: TASK_RECOMPLETION_ID,
            is_hidden: true,
            next_date: "2026-01-14",
            appear_date: "2026-01-14",
          });
          await db.tasks.add(hiddenCopy);
          taskCountBefore = await db.tasks.count();
        },
      );

      When("user completes task A", async (_ctx: TestContext) => {
        await taskService.complete(TASK_RECOMPLETION_ID);
      });

      Then(
        "hidden copy B is updated with new next_date",
        async (_ctx: TestContext) => {
          const updatedCopy = await db.tasks.get(HIDDEN_COPY_ID);
          expect(updatedCopy).toBeDefined();
          expect(updatedCopy!.next_date).not.toBe("2026-01-14");
          expect(updatedCopy!.next_date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        },
      );

      And("no additional task is created", async (_ctx: TestContext) => {
        const taskCountAfter = await db.tasks.count();
        expect(taskCountAfter).toBe(taskCountBefore);
      });
    },
  );
});

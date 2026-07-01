// implements FR9 of repeating-tasks-specs
import "fake-indexeddb/auto";
import type { FeatureDescriibeCallbackParams } from "@amiceli/vitest-cucumber";
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import { expect, type TestContext } from "vitest";
import { db } from "@/db/database";
import { ChecklistRepository } from "@/db/repositories/ChecklistRepository";
import { TaskRepository } from "@/db/repositories/TaskRepository";
import { fakeClock } from "@/lib/temporal";
import { type RecurringResult, TaskService } from "@/services/TaskService";
import { buildChecklistItem } from "@/test/factories/checklistItemFactory";
import { buildTask } from "@/test/factories/taskFactory";
import type { ChecklistItem, Task } from "@/types/entities";

const feature = await loadFeature("../recurring_copy_creation.feature");

const DAILY_RULE = JSON.stringify({
  type: "fixed",
  frequency: "daily",
  interval: 1,
  target_box: "today",
  advance_days: 0,
});

const TASK_A_ID = "a0000000-0000-4000-8000-000000000001";
const TASK_CHAIN_ID = "c0000000-0000-4000-8000-000000000003";
const TASK_CHECKLIST_ID = "d0000000-0000-4000-8000-000000000004";
const ITEM_1_ID = "f0000000-0000-4000-8000-000000000006";
const ITEM_2_ID = "f0000000-0000-4000-8000-000000000007";
const ITEM_3_ID = "f0000000-0000-4000-8000-000000000008";

type Context = Record<string, never>;

describeFeature(feature, (f: FeatureDescriibeCallbackParams<Context>) => {
  let taskService: TaskService;
  let completionResult: { completed: Task; recurringResult: RecurringResult };
  let taskA: Task;
  let copyB: Task;
  let copyC: Task;

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

  // @repeating-tasks-specs @FR9
  f.Scenario(
    "Complete repeating task creates a copy",
    ({ Given, When, Then, And }) => {
      Given(
        'active task "Morning routine" with a daily repeat_rule',
        async (_ctx: TestContext) => {
          taskA = buildTask({
            id: TASK_A_ID,
            name: "Morning routine",
            box: "today",
            repeat_rule: DAILY_RULE,
            next_date: "2026-01-15",
            appear_date: "2026-01-15",
          });
          await db.tasks.add(taskA);
        },
      );

      When("user completes the task", async (_ctx: TestContext) => {
        completionResult = await taskService.complete(TASK_A_ID);
      });

      Then(
        "a new task is created with same name and repeat_rule",
        (_ctx: TestContext) => {
          expect(completionResult.recurringResult.status).toBe("created");
          if (completionResult.recurringResult.status === "created") {
            expect(completionResult.recurringResult.task.name).toBe(
              "Morning routine",
            );
            expect(completionResult.recurringResult.task.repeat_rule).toBe(
              DAILY_RULE,
            );
          }
        },
      );

      And(
        "new task has a different ID and is_completed false",
        (_ctx: TestContext) => {
          if (completionResult.recurringResult.status === "created") {
            expect(completionResult.recurringResult.task.id).not.toBe(
              TASK_A_ID,
            );
            expect(completionResult.recurringResult.task.is_completed).toBe(
              false,
            );
            expect(completionResult.recurringResult.task.completed_at).toBe("");
          }
        },
      );

      And(
        "new task has calculated next_date and appear_date",
        (_ctx: TestContext) => {
          if (completionResult.recurringResult.status === "created") {
            expect(completionResult.recurringResult.task.next_date).toMatch(
              /^\d{4}-\d{2}-\d{2}$/,
            );
            expect(completionResult.recurringResult.task.appear_date).toMatch(
              /^\d{4}-\d{2}-\d{2}$/,
            );
          }
        },
      );
    },
  );

  // @repeating-tasks-specs @FR9
  f.Scenario(
    "Recurring copy preserves original_task_id chain",
    ({ Given, When, Then, And }) => {
      Given(
        "active task A with a daily repeat_rule and empty original_task_id",
        async (_ctx: TestContext) => {
          taskA = buildTask({
            id: TASK_CHAIN_ID,
            name: "Chain task",
            box: "today",
            repeat_rule: DAILY_RULE,
            original_task_id: "",
            next_date: "2026-01-15",
            appear_date: "2026-01-15",
          });
          await db.tasks.add(taskA);
        },
      );

      When(
        "user completes task A producing copy B",
        async (_ctx: TestContext) => {
          const resultA = await taskService.complete(TASK_CHAIN_ID);
          if (resultA.recurringResult.status !== "created")
            throw new Error("Expected recurring copy");
          copyB = resultA.recurringResult.task;
        },
      );

      And(
        "user completes copy B producing copy C",
        async (_ctx: TestContext) => {
          await db.tasks.update(copyB.id, { is_hidden: false });
          const resultB = await taskService.complete(copyB.id);
          if (resultB.recurringResult.status !== "created")
            throw new Error("Expected recurring copy");
          copyC = resultB.recurringResult.task;
        },
      );

      Then(
        "copy B has original_task_id equal to task A id",
        (_ctx: TestContext) => {
          expect(copyB.original_task_id).toBe(TASK_CHAIN_ID);
        },
      );

      And(
        "copy C has original_task_id equal to task A id",
        (_ctx: TestContext) => {
          expect(copyC.original_task_id).toBe(TASK_CHAIN_ID);
        },
      );
    },
  );

  // @repeating-tasks-specs @FR9
  f.Scenario(
    "Recurring copy includes checklist items",
    ({ Given, When, Then, And }) => {
      let copiedItems: ChecklistItem[];

      Given(
        "active task with 3 checklist items where 2 are completed",
        async (_ctx: TestContext) => {
          taskA = buildTask({
            id: TASK_CHECKLIST_ID,
            name: "Task with checklist",
            box: "today",
            repeat_rule: DAILY_RULE,
            next_date: "2026-01-15",
            appear_date: "2026-01-15",
          });
          await db.tasks.add(taskA);

          const items = [
            buildChecklistItem({
              id: ITEM_1_ID,
              task_id: TASK_CHECKLIST_ID,
              name: "Step 1",
              is_completed: true,
              sort_order: "0",
            }),
            buildChecklistItem({
              id: ITEM_2_ID,
              task_id: TASK_CHECKLIST_ID,
              name: "Step 2",
              is_completed: true,
              sort_order: "1",
            }),
            buildChecklistItem({
              id: ITEM_3_ID,
              task_id: TASK_CHECKLIST_ID,
              name: "Step 3",
              is_completed: false,
              sort_order: "2",
            }),
          ];
          await db.checklist_items.bulkAdd(items);
        },
      );

      When("user completes the task", async (_ctx: TestContext) => {
        completionResult = await taskService.complete(TASK_CHECKLIST_ID);
      });

      Then(
        "the recurring copy has 3 checklist items with new IDs",
        async (_ctx: TestContext) => {
          if (completionResult.recurringResult.status !== "created")
            throw new Error("Expected recurring copy");
          const recurringId = completionResult.recurringResult.task.id;
          copiedItems = await db.checklist_items
            .where("task_id")
            .equals(recurringId)
            .toArray();
          expect(copiedItems).toHaveLength(3);
          const originalIds = [ITEM_1_ID, ITEM_2_ID, ITEM_3_ID];
          for (const item of copiedItems) {
            expect(originalIds).not.toContain(item.id);
          }
        },
      );

      And(
        "all copied checklist items have is_completed false",
        (_ctx: TestContext) => {
          for (const item of copiedItems) {
            expect(item.is_completed).toBe(false);
          }
        },
      );
    },
  );
});

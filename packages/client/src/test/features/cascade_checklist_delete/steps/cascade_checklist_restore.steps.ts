// implements FR2 of cascade-checklist-delete
import type { FeatureDescriibeCallbackParams } from "@amiceli/vitest-cucumber";
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import { expect, type TestContext } from "vitest";
import { db } from "@/db/database";
import { getIdOrThrow } from "@/test/helpers/getIdOrThrow";
import {
  createScenarioContext,
  seedChecklistItem,
  seedTask,
} from "./cascade_checklist_steps.helpers";

const feature = await loadFeature("../cascade_checklist_restore.feature");

type Context = Record<string, never>;

describeFeature(feature, (f: FeatureDescriibeCallbackParams<Context>) => {
  const ctx = createScenarioContext();

  f.BeforeEachScenario(async () => {
    await ctx.reset();
  });

  // @cascade-checklist-delete @FR2
  f.Scenario(
    "Restore task restores all checklist items",
    ({ Given, When, Then, And }) => {
      Given(
        'a deleted task "T1" with deleted checklist items "C1" and "C2"',
        async (_ctx: TestContext) => {
          const taskId = await seedTask(ctx.taskIds, "T1", {
            is_deleted: true,
          });
          await seedChecklistItem(ctx.checklistItemIds, "C1", {
            task_id: taskId,
            is_deleted: true,
          });
          await seedChecklistItem(ctx.checklistItemIds, "C2", {
            task_id: taskId,
            is_deleted: true,
          });
        },
      );

      When('user restores task "T1"', async (_ctx: TestContext) => {
        await ctx.taskService.restore(getIdOrThrow(ctx.taskIds, "T1"));
      });

      Then(
        'task "T1" has is_deleted false and needsSync true',
        async (_ctx: TestContext) => {
          const task = await db.tasks.get(getIdOrThrow(ctx.taskIds, "T1"));
          expect(task?.is_deleted).toBe(false);
          expect(task?.needsSync).toBe(true);
        },
      );

      And(
        'checklist item "C1" has is_deleted false and needsSync true',
        async (_ctx: TestContext) => {
          const item = await db.checklist_items.get(
            getIdOrThrow(ctx.checklistItemIds, "C1"),
          );
          expect(item?.is_deleted).toBe(false);
          expect(item?.needsSync).toBe(true);
        },
      );

      And(
        'checklist item "C2" has is_deleted false and needsSync true',
        async (_ctx: TestContext) => {
          const item = await db.checklist_items.get(
            getIdOrThrow(ctx.checklistItemIds, "C2"),
          );
          expect(item?.is_deleted).toBe(false);
          expect(item?.needsSync).toBe(true);
        },
      );
    },
  );

  // @cascade-checklist-delete @FR2
  f.Scenario(
    "Restore task with no checklist items",
    ({ Given, When, Then, And }) => {
      Given(
        'a deleted task "T1" with no checklist items',
        async (_ctx: TestContext) => {
          await seedTask(ctx.taskIds, "T1", { is_deleted: true });
        },
      );

      When('user restores task "T1"', async (_ctx: TestContext) => {
        await ctx.taskService.restore(getIdOrThrow(ctx.taskIds, "T1"));
      });

      Then('task "T1" has is_deleted false', async (_ctx: TestContext) => {
        const task = await db.tasks.get(getIdOrThrow(ctx.taskIds, "T1"));
        expect(task?.is_deleted).toBe(false);
      });

      And("no error occurs", async (_ctx: TestContext) => {
        // If we reached this step, no error was thrown
        expect(true).toBe(true);
      });
    },
  );

  // @cascade-checklist-delete @FR2
  f.Scenario(
    "Restore task restores previously manually deleted checklist items",
    ({ Given, When, Then, And }) => {
      Given(
        'a task "T1" where "C1" was manually deleted before task deletion',
        async (_ctx: TestContext) => {
          const taskId = await seedTask(ctx.taskIds, "T1", {
            is_deleted: true,
          });
          await seedChecklistItem(ctx.checklistItemIds, "C1", {
            task_id: taskId,
            is_deleted: true,
          });
        },
      );

      And(
        'task "T1" and all its checklist items are now deleted',
        async (_ctx: TestContext) => {
          // State is already set up in Given: task and C1 are both is_deleted: true.
          // This step documents that the full deletion state is in effect.
          expect(true).toBe(true);
        },
      );

      When('user restores task "T1"', async (_ctx: TestContext) => {
        await ctx.taskService.restore(getIdOrThrow(ctx.taskIds, "T1"));
      });

      Then(
        'checklist item "C1" has is_deleted false',
        async (_ctx: TestContext) => {
          const item = await db.checklist_items.get(
            getIdOrThrow(ctx.checklistItemIds, "C1"),
          );
          expect(item?.is_deleted).toBe(false);
        },
      );

      And(
        "all checklist items are restored regardless of deletion origin",
        async (_ctx: TestContext) => {
          const allItems = await db.checklist_items
            .where("task_id")
            .equals(getIdOrThrow(ctx.taskIds, "T1"))
            .toArray();
          for (const checklistItem of allItems) {
            expect(checklistItem.is_deleted).toBe(false);
          }
        },
      );
    },
  );
});

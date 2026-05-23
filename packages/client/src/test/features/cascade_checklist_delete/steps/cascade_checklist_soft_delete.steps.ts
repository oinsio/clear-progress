// implements FR1 of cascade-checklist-delete
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

const feature = await loadFeature("../cascade_checklist_soft_delete.feature");

type Context = Record<string, never>;

describeFeature(feature, (f: FeatureDescriibeCallbackParams<Context>) => {
  const ctx = createScenarioContext();

  f.BeforeEachScenario(async () => {
    await ctx.reset();
  });

  // @cascade-checklist-delete @FR1
  f.Scenario(
    "Soft-delete task cascades to its checklist items",
    ({ Given, When, Then, And }) => {
      Given(
        'a task "T1" with checklist items "C1" and "C2"',
        async (_ctx: TestContext) => {
          const taskId = await seedTask(ctx.taskIds, "T1");
          await seedChecklistItem(ctx.checklistItemIds, "C1", {
            task_id: taskId,
          });
          await seedChecklistItem(ctx.checklistItemIds, "C2", {
            task_id: taskId,
          });
        },
      );

      When('user soft-deletes task "T1"', async (_ctx: TestContext) => {
        await ctx.taskService.softDelete(getIdOrThrow(ctx.taskIds, "T1"));
      });

      Then(
        'task "T1" has is_deleted true and needsSync true',
        async (_ctx: TestContext) => {
          const task = await db.tasks.get(getIdOrThrow(ctx.taskIds, "T1"));
          expect(task?.is_deleted).toBe(true);
          expect(task?.needsSync).toBe(true);
        },
      );

      And(
        'checklist item "C1" has is_deleted true and needsSync true',
        async (_ctx: TestContext) => {
          const item = await db.checklist_items.get(
            getIdOrThrow(ctx.checklistItemIds, "C1"),
          );
          expect(item?.is_deleted).toBe(true);
          expect(item?.needsSync).toBe(true);
        },
      );

      And(
        'checklist item "C2" has is_deleted true and needsSync true',
        async (_ctx: TestContext) => {
          const item = await db.checklist_items.get(
            getIdOrThrow(ctx.checklistItemIds, "C2"),
          );
          expect(item?.is_deleted).toBe(true);
          expect(item?.needsSync).toBe(true);
        },
      );
    },
  );

  // @cascade-checklist-delete @FR1
  f.Scenario(
    "Soft-delete task with no checklist items",
    ({ Given, When, Then, And }) => {
      Given(
        'a task "T1" with no checklist items',
        async (_ctx: TestContext) => {
          await seedTask(ctx.taskIds, "T1");
        },
      );

      When('user soft-deletes task "T1"', async (_ctx: TestContext) => {
        await ctx.taskService.softDelete(getIdOrThrow(ctx.taskIds, "T1"));
      });

      Then('task "T1" has is_deleted true', async (_ctx: TestContext) => {
        const task = await db.tasks.get(getIdOrThrow(ctx.taskIds, "T1"));
        expect(task?.is_deleted).toBe(true);
      });

      And("no error occurs", async (_ctx: TestContext) => {
        // If we reached this step, no error was thrown
        expect(true).toBe(true);
      });
    },
  );

  // @cascade-checklist-delete @FR1
  f.Scenario(
    "Soft-delete task with already-deleted checklist items",
    ({ Given, When, Then, And }) => {
      const oldTimestamp = "2020-01-01T00:00:00.000Z";

      Given(
        'a task "T1" with checklist item "C1" active and "C2" already deleted',
        async (_ctx: TestContext) => {
          const taskId = await seedTask(ctx.taskIds, "T1");
          await seedChecklistItem(ctx.checklistItemIds, "C1", {
            task_id: taskId,
            is_deleted: false,
          });
          await seedChecklistItem(ctx.checklistItemIds, "C2", {
            task_id: taskId,
            is_deleted: true,
            updated_at: oldTimestamp,
          });
        },
      );

      When('user soft-deletes task "T1"', async (_ctx: TestContext) => {
        await ctx.taskService.softDelete(getIdOrThrow(ctx.taskIds, "T1"));
      });

      Then(
        'checklist item "C1" has is_deleted true and needsSync true',
        async (_ctx: TestContext) => {
          const item = await db.checklist_items.get(
            getIdOrThrow(ctx.checklistItemIds, "C1"),
          );
          expect(item?.is_deleted).toBe(true);
          expect(item?.needsSync).toBe(true);
        },
      );

      And(
        'checklist item "C2" has is_deleted true and needsSync true with updated updated_at',
        async (_ctx: TestContext) => {
          const item = await db.checklist_items.get(
            getIdOrThrow(ctx.checklistItemIds, "C2"),
          );
          expect(item?.is_deleted).toBe(true);
          expect(item?.needsSync).toBe(true);
          expect(item?.updated_at).not.toBe(oldTimestamp);
        },
      );
    },
  );
});

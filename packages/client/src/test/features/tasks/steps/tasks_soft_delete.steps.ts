// implements FR1, FR9, FR10 of task-core-specs
import type { FeatureDescriibeCallbackParams } from "@amiceli/vitest-cucumber";
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import { expect, type TestContext } from "vitest";
import { db } from "@/db/database";
import {
  createScenarioContext,
  getTask,
  seedTask,
} from "@/test/helpers/bdd/tasks/helpers";
import { getIdOrThrow } from "@/test/helpers/getIdOrThrow";
import { toISOTimestamp } from "@/utils/dateHelpers";

const feature = await loadFeature("../tasks_soft_delete.feature");

const CHECKLIST_ITEMS_COUNT = 3;

type Context = Record<string, never>;

describeFeature(feature, (f: FeatureDescriibeCallbackParams<Context>) => {
  const ctx = createScenarioContext();

  f.BeforeEachScenario(async () => {
    await ctx.reset();
  });

  async function seedChecklistItems(
    taskId: string,
    count: number,
    isDeleted: boolean,
  ) {
    const now = toISOTimestamp();
    for (let i = 0; i < count; i++) {
      await db.checklist_items.add({
        id: crypto.randomUUID(),
        task_id: taskId,
        name: `Item ${i + 1}`,
        is_completed: false,
        sort_order: String(i),
        is_deleted: isDeleted,
        created_at: now,
        updated_at: now,
        revision: 0,
        needsSync: false,
      });
    }
  }

  // @task-core-specs @FR1
  f.Scenario("Soft-delete a task", ({ Given, When, Then, And }) => {
    Given('active task "Buy groceries" exists', async (_ctx: TestContext) => {
      await seedTask(ctx.taskIds, "Buy groceries");
    });

    When("user soft-deletes the task", async (_ctx: TestContext) => {
      await ctx.taskService.softDelete(
        getIdOrThrow(ctx.taskIds, "Buy groceries"),
      );
    });

    Then("task has is_deleted true", async (_ctx: TestContext) => {
      const task = await getTask(ctx.taskIds, "Buy groceries");
      expect(task.is_deleted).toBe(true);
    });

    And("task has needsSync true", async (_ctx: TestContext) => {
      const task = await getTask(ctx.taskIds, "Buy groceries");
      expect(task.needsSync).toBe(true);
    });
  });

  // @task-core-specs @FR1
  f.Scenario("Restore a soft-deleted task", ({ Given, When, Then, And }) => {
    Given(
      'soft-deleted task "Buy groceries" exists',
      async (_ctx: TestContext) => {
        await seedTask(ctx.taskIds, "Buy groceries", { is_deleted: true });
      },
    );

    When("user restores the task", async (_ctx: TestContext) => {
      await ctx.taskService.restore(getIdOrThrow(ctx.taskIds, "Buy groceries"));
    });

    Then("task has is_deleted false", async (_ctx: TestContext) => {
      const task = await getTask(ctx.taskIds, "Buy groceries");
      expect(task.is_deleted).toBe(false);
    });

    And("task has needsSync true", async (_ctx: TestContext) => {
      const task = await getTask(ctx.taskIds, "Buy groceries");
      expect(task.needsSync).toBe(true);
    });
  });

  // @task-core-specs @FR9
  f.Scenario(
    "Cascade soft-delete to checklist items",
    ({ Given, When, Then }) => {
      Given(
        'task "Buy groceries" has 3 checklist items',
        async (_ctx: TestContext) => {
          const taskId = await seedTask(ctx.taskIds, "Buy groceries");
          await seedChecklistItems(taskId, CHECKLIST_ITEMS_COUNT, false);
        },
      );

      When("user soft-deletes the task", async (_ctx: TestContext) => {
        await ctx.taskService.softDelete(
          getIdOrThrow(ctx.taskIds, "Buy groceries"),
        );
      });

      Then(
        "all 3 checklist items have is_deleted true and needsSync true",
        async (_ctx: TestContext) => {
          const taskId = getIdOrThrow(ctx.taskIds, "Buy groceries");
          const items = await db.checklist_items
            .where("task_id")
            .equals(taskId)
            .toArray();
          expect(items).toHaveLength(CHECKLIST_ITEMS_COUNT);
          for (const item of items) {
            expect(item.is_deleted).toBe(true);
            expect(item.needsSync).toBe(true);
          }
        },
      );
    },
  );

  // @task-core-specs @FR10
  f.Scenario("Cascade restore to checklist items", ({ Given, When, Then }) => {
    Given(
      'soft-deleted task "Buy groceries" has 3 soft-deleted checklist items',
      async (_ctx: TestContext) => {
        const taskId = await seedTask(ctx.taskIds, "Buy groceries", {
          is_deleted: true,
        });
        await seedChecklistItems(taskId, CHECKLIST_ITEMS_COUNT, true);
      },
    );

    When("user restores the task", async (_ctx: TestContext) => {
      await ctx.taskService.restore(getIdOrThrow(ctx.taskIds, "Buy groceries"));
    });

    Then(
      "all 3 checklist items have is_deleted false and needsSync true",
      async (_ctx: TestContext) => {
        const taskId = getIdOrThrow(ctx.taskIds, "Buy groceries");
        const items = await db.checklist_items
          .where("task_id")
          .equals(taskId)
          .toArray();
        expect(items).toHaveLength(CHECKLIST_ITEMS_COUNT);
        for (const item of items) {
          expect(item.is_deleted).toBe(false);
          expect(item.needsSync).toBe(true);
        }
      },
    );
  });

  // @task-core-specs @FR9
  f.Scenario(
    "Soft-delete task with no checklist items",
    ({ Given, When, Then }) => {
      Given(
        'active task "Buy groceries" exists without checklist items',
        async (_ctx: TestContext) => {
          await seedTask(ctx.taskIds, "Buy groceries");
        },
      );

      When("user soft-deletes the task", async (_ctx: TestContext) => {
        await ctx.taskService.softDelete(
          getIdOrThrow(ctx.taskIds, "Buy groceries"),
        );
      });

      Then("task has is_deleted true", async (_ctx: TestContext) => {
        const task = await getTask(ctx.taskIds, "Buy groceries");
        expect(task.is_deleted).toBe(true);
      });
    },
  );
});

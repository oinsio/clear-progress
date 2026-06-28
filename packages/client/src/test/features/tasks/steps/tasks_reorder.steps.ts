// implements FR6, FR9 of fractional-sort-order
import type { FeatureDescriibeCallbackParams } from "@amiceli/vitest-cucumber";
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import { expect, type TestContext } from "vitest";
import { SORT_ORDER_REBALANCE_THRESHOLD } from "@/constants";
import { db } from "@/db/database";
import {
  createScenarioContext,
  getTask,
  seedTask,
} from "@/test/helpers/bdd/tasks/helpers";

const feature = await loadFeature("../tasks_reorder.feature");

type Context = Record<string, never>;

describeFeature(feature, (f: FeatureDescriibeCallbackParams<Context>) => {
  const ctx = createScenarioContext();

  f.BeforeEachScenario(async () => {
    await ctx.reset();
  });

  // @fractional-sort-order @FR6
  f.Scenario(
    "Reorder updates only the dragged task",
    ({ Given, When, Then, And }) => {
      Given('task A with sort_order "a0"', async (_ctx: TestContext) => {
        await seedTask(ctx.taskIds, "A", { sort_order: "a0", box: "inbox" });
      });

      And('task B with sort_order "a1"', async (_ctx: TestContext) => {
        await seedTask(ctx.taskIds, "B", { sort_order: "a1", box: "inbox" });
      });

      When(
        'user reorders task A to sort_order "a2"',
        async (_ctx: TestContext) => {
          const taskA = await getTask(ctx.taskIds, "A");
          await ctx.taskService.reorderTasks(taskA.id, "a2");
        },
      );

      Then('A has sort_order "a2"', async (_ctx: TestContext) => {
        const task = await getTask(ctx.taskIds, "A");
        expect(task.sort_order).toBe("a2");
      });

      And('A has syncStatus "pending"', async (_ctx: TestContext) => {
        const task = await getTask(ctx.taskIds, "A");
        expect(task.syncStatus).toBe("pending");
      });

      And('B has sort_order "a1"', async (_ctx: TestContext) => {
        const task = await getTask(ctx.taskIds, "B");
        expect(task.sort_order).toBe("a1");
      });
    },
  );

  // @fractional-sort-order @FR6
  f.Scenario("Reorder nonexistent task throws error", ({ When, Then }) => {
    let thrownError: Error;

    When("user reorders nonexistent task", async (_ctx: TestContext) => {
      try {
        await ctx.taskService.reorderTasks(crypto.randomUUID(), "a1");
      } catch (error) {
        thrownError = error as Error;
      }
    });

    Then('error "Task not found" is thrown', async (_ctx: TestContext) => {
      expect(thrownError).toBeDefined();
      expect(thrownError.message).toContain("Task not found");
    });
  });

  // @fractional-sort-order @FR9
  f.Scenario(
    "Reorder triggers rebalancing when key exceeds threshold",
    ({ Given, When, Then }) => {
      Given(
        'tasks A, B in inbox with sort_order "a0", "a1"',
        async (_ctx: TestContext) => {
          await seedTask(ctx.taskIds, "A", { sort_order: "a0", box: "inbox" });
          await seedTask(ctx.taskIds, "B", { sort_order: "a1", box: "inbox" });
        },
      );

      When(
        "user reorders task A with a long key exceeding threshold",
        async (_ctx: TestContext) => {
          const longKey = "a".repeat(SORT_ORDER_REBALANCE_THRESHOLD + 1);
          const taskA = await getTask(ctx.taskIds, "A");
          await ctx.taskService.reorderTasks(taskA.id, longKey);
        },
      );

      Then(
        "all tasks in inbox are rebalanced with fresh keys",
        async (_ctx: TestContext) => {
          const allTasks = await db.tasks.toArray();
          for (const task of allTasks) {
            expect(typeof task.sort_order).toBe("string");
            expect(task.syncStatus).toBe("pending");
          }
        },
      );
    },
  );
});

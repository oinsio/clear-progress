// implements FR5 of task-core-specs
import type { FeatureDescriibeCallbackParams } from "@amiceli/vitest-cucumber";
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import { expect, type TestContext } from "vitest";
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

  // @task-core-specs @FR5
  f.Scenario(
    "Reorder assigns sequential sort_order",
    ({ Given, When, Then, And }) => {
      Given(
        "tasks A, B, C with sort_order 0, 1, 2",
        async (_ctx: TestContext) => {
          await seedTask(ctx.taskIds, "A", { sort_order: 0 });
          await seedTask(ctx.taskIds, "B", { sort_order: 1 });
          await seedTask(ctx.taskIds, "C", { sort_order: 2 });
        },
      );

      When("user reorders to B, C, A", async (_ctx: TestContext) => {
        const taskB = await getTask(ctx.taskIds, "B");
        const taskC = await getTask(ctx.taskIds, "C");
        const taskA = await getTask(ctx.taskIds, "A");
        await ctx.taskService.reorderTasks([taskB, taskC, taskA]);
      });

      Then("B has sort_order 0", async (_ctx: TestContext) => {
        const task = await getTask(ctx.taskIds, "B");
        expect(task.sort_order).toBe(0);
      });

      And("C has sort_order 1", async (_ctx: TestContext) => {
        const task = await getTask(ctx.taskIds, "C");
        expect(task.sort_order).toBe(1);
      });

      And("A has sort_order 2", async (_ctx: TestContext) => {
        const task = await getTask(ctx.taskIds, "A");
        expect(task.sort_order).toBe(2);
      });
    },
  );

  // @task-core-specs @FR5
  f.Scenario(
    "Only changed tasks marked for sync",
    ({ Given, When, Then, And }) => {
      Given(
        "tasks A, B, C with sort_order 0, 1, 2 and needsSync false",
        async (_ctx: TestContext) => {
          await seedTask(ctx.taskIds, "A", {
            sort_order: 0,
            needsSync: false,
          });
          await seedTask(ctx.taskIds, "B", {
            sort_order: 1,
            needsSync: false,
          });
          await seedTask(ctx.taskIds, "C", {
            sort_order: 2,
            needsSync: false,
          });
        },
      );

      When("user reorders to A, C, B", async (_ctx: TestContext) => {
        const taskA = await getTask(ctx.taskIds, "A");
        const taskC = await getTask(ctx.taskIds, "C");
        const taskB = await getTask(ctx.taskIds, "B");
        await ctx.taskService.reorderTasks([taskA, taskC, taskB]);
      });

      Then("A has needsSync false", async (_ctx: TestContext) => {
        const task = await getTask(ctx.taskIds, "A");
        expect(task.needsSync).toBe(false);
      });

      And("C has needsSync true", async (_ctx: TestContext) => {
        const task = await getTask(ctx.taskIds, "C");
        expect(task.needsSync).toBe(true);
      });

      And("B has needsSync true", async (_ctx: TestContext) => {
        const task = await getTask(ctx.taskIds, "B");
        expect(task.needsSync).toBe(true);
      });
    },
  );

  // @task-core-specs @FR5
  f.Scenario("Empty reorder is no-op", ({ When, Then }) => {
    let taskCountBefore: number;

    When("user reorders with empty array", async (_ctx: TestContext) => {
      taskCountBefore = await db.tasks.count();
      await ctx.taskService.reorderTasks([]);
    });

    Then("no database write occurs", async (_ctx: TestContext) => {
      const taskCountAfter = await db.tasks.count();
      expect(taskCountAfter).toBe(taskCountBefore);
    });
  });

  // @task-core-specs @FR5
  f.Scenario("Same order is no-op", ({ Given, When, Then, And }) => {
    Given(
      "tasks A, B with sort_order 0, 1 and needsSync false",
      async (_ctx: TestContext) => {
        await seedTask(ctx.taskIds, "A", { sort_order: 0, needsSync: false });
        await seedTask(ctx.taskIds, "B", { sort_order: 1, needsSync: false });
      },
    );

    When("user reorders to A, B", async (_ctx: TestContext) => {
      const taskA = await getTask(ctx.taskIds, "A");
      const taskB = await getTask(ctx.taskIds, "B");
      await ctx.taskService.reorderTasks([taskA, taskB]);
    });

    Then("A has needsSync false", async (_ctx: TestContext) => {
      const task = await getTask(ctx.taskIds, "A");
      expect(task.needsSync).toBe(false);
    });

    And("B has needsSync false", async (_ctx: TestContext) => {
      const task = await getTask(ctx.taskIds, "B");
      expect(task.needsSync).toBe(false);
    });
  });
});

// implements FR8 of task-core-specs
import type { FeatureDescriibeCallbackParams } from "@amiceli/vitest-cucumber";
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import { expect, type TestContext } from "vitest";
import {
  createScenarioContext,
  seedTask,
} from "@/test/helpers/bdd/tasks/helpers";
import type { Task } from "@/types/entities";

const feature = await loadFeature("../tasks_associations.feature");

type Context = Record<string, never>;

describeFeature(feature, (f: FeatureDescriibeCallbackParams<Context>) => {
  const ctx = createScenarioContext();

  f.BeforeEachScenario(async () => {
    await ctx.reset();
  });

  // @task-core-specs @FR8
  f.Scenario("Get tasks by goal", ({ Given, When, Then }) => {
    let returnedTasks: Task[];

    Given(
      '2 tasks with goal "g1" and 1 task with goal "g2"',
      async (_ctx: TestContext) => {
        await seedTask(ctx.taskIds, "Goal1 Task A", {
          goal_id: "g1",
          sort_order: 1,
        });
        await seedTask(ctx.taskIds, "Goal1 Task B", {
          goal_id: "g1",
          sort_order: 0,
        });
        await seedTask(ctx.taskIds, "Goal2 Task A", {
          goal_id: "g2",
          sort_order: 0,
        });
      },
    );

    When('user gets tasks by goal "g1"', async (_ctx: TestContext) => {
      returnedTasks = await ctx.taskService.getByGoalId("g1");
    });

    Then(
      "2 tasks are returned sorted by sort_order",
      async (_ctx: TestContext) => {
        expect(returnedTasks).toHaveLength(2);
        expect(returnedTasks.map((task) => task.sort_order)).toEqual([0, 1]);
      },
    );
  });

  // @task-core-specs @FR8
  f.Scenario(
    "Get tasks by context excludes completed",
    ({ Given, When, Then }) => {
      let returnedTasks: Task[];

      Given(
        '1 incomplete and 1 completed task with context "c1"',
        async (_ctx: TestContext) => {
          await seedTask(ctx.taskIds, "Incomplete Task", {
            context_id: "c1",
            sort_order: 0,
            is_completed: false,
          });
          await seedTask(ctx.taskIds, "Completed Task", {
            context_id: "c1",
            sort_order: 1,
            is_completed: true,
            completed_at: "2026-01-01T10:00:00.000Z",
          });
        },
      );

      When('user gets tasks by context "c1"', async (_ctx: TestContext) => {
        returnedTasks = await ctx.taskService.getByContextId("c1");
      });

      Then("only 1 incomplete task is returned", async (_ctx: TestContext) => {
        expect(returnedTasks).toHaveLength(1);
        expect(returnedTasks[0].name).toBe("Incomplete Task");
        expect(returnedTasks[0].is_completed).toBe(false);
      });
    },
  );

  // @task-core-specs @FR8
  f.Scenario("Get tasks by category", ({ Given, When, Then }) => {
    let returnedTasks: Task[];

    Given(
      '2 incomplete tasks with category "cat1"',
      async (_ctx: TestContext) => {
        await seedTask(ctx.taskIds, "Cat Task A", {
          category_id: "cat1",
          sort_order: 1,
        });
        await seedTask(ctx.taskIds, "Cat Task B", {
          category_id: "cat1",
          sort_order: 0,
        });
      },
    );

    When('user gets tasks by category "cat1"', async (_ctx: TestContext) => {
      returnedTasks = await ctx.taskService.getByCategoryId("cat1");
    });

    Then(
      "2 tasks are returned sorted by sort_order",
      async (_ctx: TestContext) => {
        expect(returnedTasks).toHaveLength(2);
        expect(returnedTasks.map((task) => task.sort_order)).toEqual([0, 1]);
      },
    );
  });

  // @task-core-specs @FR8
  f.Scenario("Goal task counts", ({ Given, When, Then }) => {
    let goalCounts: Record<string, number>;

    Given(
      '3 active incomplete tasks with goals "g1", "g1", "g2"',
      async (_ctx: TestContext) => {
        await seedTask(ctx.taskIds, "G1 Task A", {
          goal_id: "g1",
          sort_order: 0,
        });
        await seedTask(ctx.taskIds, "G1 Task B", {
          goal_id: "g1",
          sort_order: 1,
        });
        await seedTask(ctx.taskIds, "G2 Task A", {
          goal_id: "g2",
          sort_order: 0,
        });
      },
    );

    When("user gets goal task counts", async (_ctx: TestContext) => {
      goalCounts = await ctx.taskService.getGoalTaskCounts();
    });

    Then("counts are g1=2 and g2=1", async (_ctx: TestContext) => {
      expect(goalCounts).toEqual({ g1: 2, g2: 1 });
    });
  });

  // @task-core-specs @FR8
  f.Scenario(
    "Tasks with empty goal_id not counted",
    ({ Given, When, Then }) => {
      let goalCounts: Record<string, number>;

      Given(
        "1 active incomplete task with empty goal_id",
        async (_ctx: TestContext) => {
          await seedTask(ctx.taskIds, "No Goal Task", {
            goal_id: "",
            sort_order: 0,
          });
        },
      );

      When("user gets goal task counts", async (_ctx: TestContext) => {
        goalCounts = await ctx.taskService.getGoalTaskCounts();
      });

      Then("empty counts returned", async (_ctx: TestContext) => {
        expect(goalCounts).toEqual({});
      });
    },
  );
});

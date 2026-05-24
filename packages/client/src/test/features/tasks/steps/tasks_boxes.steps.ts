// implements FR2 of task-core-specs
import type { FeatureDescriibeCallbackParams } from "@amiceli/vitest-cucumber";
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import { expect, type TestContext } from "vitest";
import {
  createScenarioContext,
  seedTask,
} from "@/test/helpers/bdd/tasks/helpers";
import { getIdOrThrow } from "@/test/helpers/getIdOrThrow";
import type { Task } from "@/types/entities";

const feature = await loadFeature("../tasks_boxes.feature");

type Context = Record<string, never>;

describeFeature(feature, (f: FeatureDescriibeCallbackParams<Context>) => {
  const ctx = createScenarioContext();

  f.BeforeEachScenario(async () => {
    await ctx.reset();
  });

  // @task-core-specs @FR2
  f.Scenario(
    "Get tasks by box sorted by sort_order",
    ({ Given, When, Then }) => {
      let returnedTasks: Task[];

      Given(
        "inbox has tasks with sort_order 2, 0, 1",
        async (_ctx: TestContext) => {
          await seedTask(ctx.taskIds, "Task A", {
            box: "inbox",
            sort_order: 2,
          });
          await seedTask(ctx.taskIds, "Task B", {
            box: "inbox",
            sort_order: 0,
          });
          await seedTask(ctx.taskIds, "Task C", {
            box: "inbox",
            sort_order: 1,
          });
        },
      );

      When('user gets tasks by box "inbox"', async (_ctx: TestContext) => {
        returnedTasks = await ctx.taskService.getByBox("inbox");
      });

      Then("tasks are returned in order 0, 1, 2", async (_ctx: TestContext) => {
        expect(returnedTasks.map((task) => task.sort_order)).toEqual([0, 1, 2]);
      });
    },
  );

  // @task-core-specs @FR2
  f.Scenario("Empty box returns empty array", ({ When, Then }) => {
    let returnedTasks: Task[];

    When('user gets tasks by box "inbox"', async (_ctx: TestContext) => {
      returnedTasks = await ctx.taskService.getByBox("inbox");
    });

    Then("empty array is returned", async (_ctx: TestContext) => {
      expect(returnedTasks).toEqual([]);
    });
  });

  // @task-core-specs @FR2
  f.Scenario(
    "Soft-deleted tasks excluded from box",
    ({ Given, When, Then }) => {
      let returnedTasks: Task[];

      Given(
        "inbox has 2 active tasks and 1 soft-deleted task",
        async (_ctx: TestContext) => {
          await seedTask(ctx.taskIds, "Active 1", {
            box: "inbox",
            sort_order: 0,
          });
          await seedTask(ctx.taskIds, "Active 2", {
            box: "inbox",
            sort_order: 1,
          });
          await seedTask(ctx.taskIds, "Deleted", {
            box: "inbox",
            sort_order: 2,
            is_deleted: true,
          });
        },
      );

      When('user gets tasks by box "inbox"', async (_ctx: TestContext) => {
        returnedTasks = await ctx.taskService.getByBox("inbox");
      });

      Then("only 2 tasks are returned", async (_ctx: TestContext) => {
        expect(returnedTasks).toHaveLength(2);
      });
    },
  );

  // @task-core-specs @FR2
  f.Scenario("Move task from inbox to today", ({ Given, When, Then, And }) => {
    let movedTask: Task;

    Given(
      'task "Buy groceries" exists in box "inbox"',
      async (_ctx: TestContext) => {
        await seedTask(ctx.taskIds, "Buy groceries", { box: "inbox" });
      },
    );

    When('user moves task to box "today"', async (_ctx: TestContext) => {
      movedTask = await ctx.taskService.moveToBox(
        getIdOrThrow(ctx.taskIds, "Buy groceries"),
        "today",
      );
    });

    Then('task has box "today"', async (_ctx: TestContext) => {
      expect(movedTask.box).toBe("today");
    });

    And("task has needsSync true", async (_ctx: TestContext) => {
      expect(movedTask.needsSync).toBe(true);
    });
  });

  // @task-core-specs @FR2
  f.Scenario("Move task to same box is no-op", ({ Given, When, Then, And }) => {
    let movedTask: Task;
    const fixedUpdatedAt = "2025-01-01T00:00:00.000Z";

    Given(
      'task "Buy groceries" exists in box "inbox" with needsSync false',
      async (_ctx: TestContext) => {
        await seedTask(ctx.taskIds, "Buy groceries", {
          box: "inbox",
          needsSync: false,
          updated_at: fixedUpdatedAt,
        });
      },
    );

    When('user moves task to box "inbox"', async (_ctx: TestContext) => {
      movedTask = await ctx.taskService.moveToBox(
        getIdOrThrow(ctx.taskIds, "Buy groceries"),
        "inbox",
      );
    });

    Then("task has needsSync false", async (_ctx: TestContext) => {
      expect(movedTask.needsSync).toBe(false);
    });

    And("task updated_at is unchanged", async (_ctx: TestContext) => {
      expect(movedTask.updated_at).toBe(fixedUpdatedAt);
    });
  });
});

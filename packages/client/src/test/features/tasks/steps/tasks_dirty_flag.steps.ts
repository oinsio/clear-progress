// implements FR1 of task-core-specs
import type { FeatureDescriibeCallbackParams } from "@amiceli/vitest-cucumber";
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import { expect, type TestContext } from "vitest";
import {
  createScenarioContext,
  getTask,
  seedTask,
} from "@/test/helpers/bdd/tasks/helpers";
import { getIdOrThrow } from "@/test/helpers/getIdOrThrow";
import type { Task } from "@/types/entities";

const feature = await loadFeature("../tasks_dirty_flag.feature");

const FIXED_UPDATED_AT = "2025-01-01T00:00:00.000Z";

type Context = Record<string, never>;

describeFeature(feature, (f: FeatureDescriibeCallbackParams<Context>) => {
  const ctx = createScenarioContext();

  f.BeforeEachScenario(async () => {
    await ctx.reset();
  });

  // @task-core-specs @FR1
  f.Scenario(
    "Smart dirty flag on actual update",
    ({ Given, When, Then, And }) => {
      let updatedTask: Task;

      Given(
        'task "Buy groceries" exists with needsSync false',
        async (_ctx: TestContext) => {
          await seedTask(ctx.taskIds, "Buy groceries", {
            needsSync: false,
            updated_at: FIXED_UPDATED_AT,
          });
        },
      );

      When(
        'user updates task name to "Buy vegetables"',
        async (_ctx: TestContext) => {
          updatedTask = await ctx.taskService.update(
            getIdOrThrow(ctx.taskIds, "Buy groceries"),
            { name: "Buy vegetables" },
          );
        },
      );

      Then("task has needsSync true", async (_ctx: TestContext) => {
        expect(updatedTask.needsSync).toBe(true);
      });

      And("task updated_at is refreshed", async (_ctx: TestContext) => {
        expect(updatedTask.updated_at).not.toBe(FIXED_UPDATED_AT);
      });
    },
  );

  // @task-core-specs @FR1
  f.Scenario(
    "No-op update does not set dirty flag",
    ({ Given, When, Then, And }) => {
      let updatedTask: Task;

      Given(
        'task "Buy groceries" exists with needsSync false',
        async (_ctx: TestContext) => {
          await seedTask(ctx.taskIds, "Buy groceries", {
            needsSync: false,
            updated_at: FIXED_UPDATED_AT,
          });
        },
      );

      When(
        'user updates task name to "Buy groceries"',
        async (_ctx: TestContext) => {
          updatedTask = await ctx.taskService.update(
            getIdOrThrow(ctx.taskIds, "Buy groceries"),
            { name: "Buy groceries" },
          );
        },
      );

      Then("task has needsSync false", async (_ctx: TestContext) => {
        expect(updatedTask.needsSync).toBe(false);
      });

      And("task updated_at is unchanged", async (_ctx: TestContext) => {
        expect(updatedTask.updated_at).toBe(FIXED_UPDATED_AT);
      });
    },
  );

  // @task-core-specs @FR1
  f.Scenario("Dirty flag on create", ({ When, Then }) => {
    let createdTask: Task;

    When(
      'user creates task "New task" in box "inbox"',
      async (_ctx: TestContext) => {
        createdTask = await ctx.taskService.create({
          name: "New task",
          box: "inbox",
        });
      },
    );

    Then("task has needsSync true", async (_ctx: TestContext) => {
      expect(createdTask.needsSync).toBe(true);
    });
  });

  // @task-core-specs @FR1
  f.Scenario("Dirty flag on soft-delete", ({ Given, When, Then }) => {
    Given(
      'task "Buy groceries" exists with needsSync false',
      async (_ctx: TestContext) => {
        await seedTask(ctx.taskIds, "Buy groceries", {
          needsSync: false,
        });
      },
    );

    When("user soft-deletes the task", async (_ctx: TestContext) => {
      await ctx.taskService.softDelete(
        getIdOrThrow(ctx.taskIds, "Buy groceries"),
      );
    });

    Then("task has needsSync true", async (_ctx: TestContext) => {
      const task = await getTask(ctx.taskIds, "Buy groceries");
      expect(task.needsSync).toBe(true);
    });
  });

  // @task-core-specs @FR1
  f.Scenario("Dirty flag on restore", ({ Given, When, Then }) => {
    Given(
      'soft-deleted task "Buy groceries" exists with needsSync false',
      async (_ctx: TestContext) => {
        await seedTask(ctx.taskIds, "Buy groceries", {
          is_deleted: true,
          needsSync: false,
        });
      },
    );

    When("user restores the task", async (_ctx: TestContext) => {
      await ctx.taskService.restore(getIdOrThrow(ctx.taskIds, "Buy groceries"));
    });

    Then("task has needsSync true", async (_ctx: TestContext) => {
      const task = await getTask(ctx.taskIds, "Buy groceries");
      expect(task.needsSync).toBe(true);
    });
  });

  // @task-core-specs @FR1
  f.Scenario("Dirty flag on complete", ({ Given, When, Then }) => {
    let completionResult: { completed: Task; recurring: Task | null };

    Given(
      'task "Buy groceries" exists with needsSync false',
      async (_ctx: TestContext) => {
        await seedTask(ctx.taskIds, "Buy groceries", {
          needsSync: false,
          is_completed: false,
        });
      },
    );

    When("user completes the task", async (_ctx: TestContext) => {
      completionResult = await ctx.taskService.complete(
        getIdOrThrow(ctx.taskIds, "Buy groceries"),
      );
    });

    Then("task has needsSync true", async (_ctx: TestContext) => {
      expect(completionResult.completed.needsSync).toBe(true);
    });
  });
});

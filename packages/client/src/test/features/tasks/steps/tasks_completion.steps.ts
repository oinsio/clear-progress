// implements FR3, FR4 of task-core-specs
import type { FeatureDescriibeCallbackParams } from "@amiceli/vitest-cucumber";
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import { expect, type TestContext } from "vitest";
import type { RecurringResult } from "@/services/TaskService";
import {
  createScenarioContext,
  seedTask,
} from "@/test/helpers/bdd/tasks/helpers";
import { getIdOrThrow } from "@/test/helpers/getIdOrThrow";
import type { Task } from "@/types/entities";

const feature = await loadFeature("../tasks_completion.feature");

const ISO_TIMESTAMP_REGEX = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;

type Context = Record<string, never>;

describeFeature(feature, (f: FeatureDescriibeCallbackParams<Context>) => {
  const ctx = createScenarioContext();

  f.BeforeEachScenario(async () => {
    await ctx.reset();
  });

  // @task-core-specs @FR3
  f.Scenario("Complete a task", ({ Given, When, Then, And }) => {
    let result: { completed: Task; recurringResult: RecurringResult };

    Given('active task "Buy groceries" exists', async (_ctx: TestContext) => {
      await seedTask(ctx.taskIds, "Buy groceries", {
        box: "inbox",
        is_completed: false,
      });
    });

    When("user completes the task", async (_ctx: TestContext) => {
      result = await ctx.taskService.complete(
        getIdOrThrow(ctx.taskIds, "Buy groceries"),
      );
    });

    Then("task has is_completed true", async (_ctx: TestContext) => {
      expect(result.completed.is_completed).toBe(true);
    });

    And(
      "task has completed_at set to current timestamp",
      async (_ctx: TestContext) => {
        expect(result.completed.completed_at).toMatch(ISO_TIMESTAMP_REGEX);
        expect(result.completed.completed_at).not.toBe("");
      },
    );

    And('task has syncStatus "pending"', async (_ctx: TestContext) => {
      expect(result.completed.syncStatus).toBe("pending");
    });
  });

  // @task-core-specs @FR3
  f.Scenario("Uncomplete a task", ({ Given, When, Then, And }) => {
    let uncompleted: Task;

    Given(
      'completed task "Buy groceries" exists',
      async (_ctx: TestContext) => {
        await seedTask(ctx.taskIds, "Buy groceries", {
          box: "inbox",
          is_completed: true,
          completed_at: "2026-01-15T10:00:00.000Z",
        });
      },
    );

    When("user uncompletes the task", async (_ctx: TestContext) => {
      uncompleted = await ctx.taskService.noncomplete(
        getIdOrThrow(ctx.taskIds, "Buy groceries"),
      );
    });

    Then("task has is_completed false", async (_ctx: TestContext) => {
      expect(uncompleted.is_completed).toBe(false);
    });

    And('task has completed_at ""', async (_ctx: TestContext) => {
      expect(uncompleted.completed_at).toBe("");
    });

    And('task has syncStatus "pending"', async (_ctx: TestContext) => {
      expect(uncompleted.syncStatus).toBe("pending");
    });
  });

  // @task-core-specs @FR3
  f.Scenario("Complete nonexistent task throws error", ({ When, Then }) => {
    let thrownError: Error;

    When("user completes nonexistent task", async (_ctx: TestContext) => {
      try {
        await ctx.taskService.complete(crypto.randomUUID());
      } catch (error) {
        thrownError = error as Error;
      }
    });

    Then('error "Task not found" is thrown', async (_ctx: TestContext) => {
      expect(thrownError).toBeDefined();
      expect(thrownError.message).toContain("Task not found");
    });
  });

  // @task-core-specs @FR3
  f.Scenario("Uncomplete nonexistent task throws error", ({ When, Then }) => {
    let thrownError: Error;

    When("user uncompletes nonexistent task", async (_ctx: TestContext) => {
      try {
        await ctx.taskService.noncomplete(crypto.randomUUID());
      } catch (error) {
        thrownError = error as Error;
      }
    });

    Then('error "Task not found" is thrown', async (_ctx: TestContext) => {
      expect(thrownError).toBeDefined();
      expect(thrownError.message).toContain("Task not found");
    });
  });

  // @task-core-specs @FR4
  f.Scenario(
    "Completed tasks sorted by completed_at descending",
    ({ Given, When, Then }) => {
      let completedTasks: Task[];

      Given(
        'tasks completed at "2026-01-01T10:00:00.000Z" and "2026-01-02T10:00:00.000Z"',
        async (_ctx: TestContext) => {
          await seedTask(ctx.taskIds, "Earlier task", {
            box: "inbox",
            is_completed: true,
            completed_at: "2026-01-01T10:00:00.000Z",
          });
          await seedTask(ctx.taskIds, "Later task", {
            box: "inbox",
            is_completed: true,
            completed_at: "2026-01-02T10:00:00.000Z",
          });
        },
      );

      When("user views completed tasks", async (_ctx: TestContext) => {
        completedTasks = await ctx.taskService.getCompleted();
      });

      Then(
        'task completed at "2026-01-02T10:00:00.000Z" appears first',
        async (_ctx: TestContext) => {
          expect(completedTasks[0].completed_at).toBe(
            "2026-01-02T10:00:00.000Z",
          );
        },
      );
    },
  );

  // @task-core-specs @FR4
  f.Scenario(
    "Soft-deleted excluded from completed list",
    ({ Given, When, Then }) => {
      let completedTasks: Task[];

      Given(
        "a completed task that is also soft-deleted",
        async (_ctx: TestContext) => {
          await seedTask(ctx.taskIds, "Deleted task", {
            box: "inbox",
            is_completed: true,
            is_deleted: true,
            completed_at: "2026-01-15T10:00:00.000Z",
          });
        },
      );

      When("user views completed tasks", async (_ctx: TestContext) => {
        completedTasks = await ctx.taskService.getCompleted();
      });

      Then("empty array is returned", async (_ctx: TestContext) => {
        expect(completedTasks).toEqual([]);
      });
    },
  );

  // @fractional-sort-order @FR5
  f.Scenario(
    "Uncompleted task appears at top of its box",
    ({ Given, When, Then, And }) => {
      let uncompleted: Task;

      Given(
        'inbox has tasks with sort_order "a0", "a1"',
        async (_ctx: TestContext) => {
          await seedTask(ctx.taskIds, "Inbox A", {
            box: "inbox",
            sort_order: "a0",
          });
          await seedTask(ctx.taskIds, "Inbox B", {
            box: "inbox",
            sort_order: "a1",
          });
        },
      );

      And(
        'completed task "Buy groceries" exists in box "inbox"',
        async (_ctx: TestContext) => {
          await seedTask(ctx.taskIds, "Buy groceries", {
            box: "inbox",
            is_completed: true,
            completed_at: "2026-01-15T10:00:00.000Z",
            sort_order: "a0V",
          });
        },
      );

      When("user uncompletes the task", async (_ctx: TestContext) => {
        uncompleted = await ctx.taskService.noncomplete(
          getIdOrThrow(ctx.taskIds, "Buy groceries"),
        );
      });

      Then('task has sort_order above "a1"', async (_ctx: TestContext) => {
        const sortOrder = String(uncompleted.sort_order);
        expect(sortOrder > "a1").toBe(true);
      });
    },
  );
});

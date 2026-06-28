// implements FR1 of task-core-specs
import type { FeatureDescriibeCallbackParams } from "@amiceli/vitest-cucumber";
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import { expect, type TestContext } from "vitest";
import { db } from "@/db/database";
import {
  createScenarioContext,
  seedTask,
} from "@/test/helpers/bdd/tasks/helpers";
import { getIdOrThrow } from "@/test/helpers/getIdOrThrow";
import type { Task } from "@/types/entities";

const feature = await loadFeature("../tasks_crud.feature");

const UUID_V4_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const ISO_TIMESTAMP_REGEX = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;

type Context = Record<string, never>;

describeFeature(feature, (f: FeatureDescriibeCallbackParams<Context>) => {
  const ctx = createScenarioContext();

  f.BeforeEachScenario(async () => {
    await ctx.reset();
  });

  // @task-core-specs @FR1
  f.Scenario("Create task with name and box", ({ When, Then, And }) => {
    let createdTask: Task;

    When(
      'user creates task "Buy groceries" in box "inbox"',
      async (_ctx: TestContext) => {
        createdTask = await ctx.taskService.create({
          name: "Buy groceries",
          box: "inbox",
        });
      },
    );

    Then(
      'task is persisted with name "Buy groceries"',
      async (_ctx: TestContext) => {
        const persistedTask = await db.tasks.get(createdTask.id);
        expect(persistedTask?.name).toBe("Buy groceries");
      },
    );

    And('task has box "inbox"', async (_ctx: TestContext) => {
      expect(createdTask.box).toBe("inbox");
    });

    And("task has revision 0", async (_ctx: TestContext) => {
      expect(createdTask.revision).toBe(0);
    });

    And('task has syncStatus "pending"', async (_ctx: TestContext) => {
      expect(createdTask.syncStatus).toBe("pending");
    });

    And("task has is_deleted false", async (_ctx: TestContext) => {
      expect(createdTask.is_deleted).toBe(false);
    });

    And("task has is_completed false", async (_ctx: TestContext) => {
      expect(createdTask.is_completed).toBe(false);
    });
  });

  // @fractional-sort-order @FR3
  f.Scenario("New task created at top of box", ({ Given, When, Then }) => {
    let createdTask: Task;

    Given(
      'inbox has tasks with sort_order "a0", "a1", "a2"',
      async (_ctx: TestContext) => {
        await seedTask(ctx.taskIds, "Task A", {
          box: "inbox",
          sort_order: "a0",
        });
        await seedTask(ctx.taskIds, "Task B", {
          box: "inbox",
          sort_order: "a1",
        });
        await seedTask(ctx.taskIds, "Task C", {
          box: "inbox",
          sort_order: "a2",
        });
      },
    );

    When(
      'user creates task "New task" in box "inbox"',
      async (_ctx: TestContext) => {
        createdTask = await ctx.taskService.create({
          name: "New task",
          box: "inbox",
        });
      },
    );

    Then('task has sort_order above "a2"', async (_ctx: TestContext) => {
      const sortOrder = String(createdTask.sort_order);
      expect(sortOrder > "a2").toBe(true);
    });
  });

  // @task-core-specs @FR1
  f.Scenario("UUID generated client-side", ({ When, Then }) => {
    let createdTask: Task;

    When(
      'user creates task "Buy groceries" in box "inbox"',
      async (_ctx: TestContext) => {
        createdTask = await ctx.taskService.create({
          name: "Buy groceries",
          box: "inbox",
        });
      },
    );

    Then("task id is valid UUID v4", async (_ctx: TestContext) => {
      expect(createdTask.id).toMatch(UUID_V4_REGEX);
    });
  });

  // @task-core-specs @FR1
  f.Scenario("Timestamps set on creation", ({ When, Then, And }) => {
    let createdTask: Task;

    When(
      'user creates task "Buy groceries" in box "inbox"',
      async (_ctx: TestContext) => {
        createdTask = await ctx.taskService.create({
          name: "Buy groceries",
          box: "inbox",
        });
      },
    );

    Then(
      "task created_at and updated_at are equal",
      async (_ctx: TestContext) => {
        expect(createdTask.created_at).toBe(createdTask.updated_at);
      },
    );

    And(
      "task timestamps are ISO 8601 with Z suffix",
      async (_ctx: TestContext) => {
        expect(createdTask.created_at).toMatch(ISO_TIMESTAMP_REGEX);
        expect(createdTask.updated_at).toMatch(ISO_TIMESTAMP_REGEX);
      },
    );
  });

  // @task-core-specs @FR1
  f.Scenario(
    "Optional fields default to empty string",
    ({ When, Then, And }) => {
      let createdTask: Task;

      When(
        'user creates task "Buy groceries" in box "inbox"',
        async (_ctx: TestContext) => {
          createdTask = await ctx.taskService.create({
            name: "Buy groceries",
            box: "inbox",
          });
        },
      );

      Then('task has description ""', async (_ctx: TestContext) => {
        expect(createdTask.description).toBe("");
      });

      And('task has goal_id ""', async (_ctx: TestContext) => {
        expect(createdTask.goal_id).toBe("");
      });

      And('task has context_id ""', async (_ctx: TestContext) => {
        expect(createdTask.context_id).toBe("");
      });

      And('task has category_id ""', async (_ctx: TestContext) => {
        expect(createdTask.category_id).toBe("");
      });

      And('task has repeat_rule ""', async (_ctx: TestContext) => {
        expect(createdTask.repeat_rule).toBe("");
      });

      And('task has next_date ""', async (_ctx: TestContext) => {
        expect(createdTask.next_date).toBe("");
      });

      And('task has appear_date ""', async (_ctx: TestContext) => {
        expect(createdTask.appear_date).toBe("");
      });

      And('task has original_task_id ""', async (_ctx: TestContext) => {
        expect(createdTask.original_task_id).toBe("");
      });
    },
  );

  // @task-core-specs @FR1
  f.Scenario("Read existing task", ({ Given, When, Then }) => {
    let returnedTask: Task | undefined;

    Given(
      'task "Buy groceries" exists in box "inbox"',
      async (_ctx: TestContext) => {
        await seedTask(ctx.taskIds, "Buy groceries", { box: "inbox" });
      },
    );

    When("user reads task by id", async (_ctx: TestContext) => {
      returnedTask = await ctx.taskService.getById(
        getIdOrThrow(ctx.taskIds, "Buy groceries"),
      );
    });

    Then(
      'task is returned with name "Buy groceries"',
      async (_ctx: TestContext) => {
        expect(returnedTask).toBeDefined();
        expect(returnedTask?.name).toBe("Buy groceries");
      },
    );
  });

  // @task-core-specs @FR1
  f.Scenario("Read nonexistent task", ({ When, Then }) => {
    let returnedTask: Task | undefined;

    When("user reads task by nonexistent id", async (_ctx: TestContext) => {
      returnedTask = await ctx.taskService.getById(crypto.randomUUID());
    });

    Then("undefined is returned", async (_ctx: TestContext) => {
      expect(returnedTask).toBeUndefined();
    });
  });

  // @task-core-specs @FR1
  f.Scenario("Update task name", ({ Given, When, Then, And }) => {
    let updatedTask: Task;
    let originalUpdatedAt: string;

    Given(
      'task "Buy groceries" exists in box "inbox"',
      async (_ctx: TestContext) => {
        await seedTask(ctx.taskIds, "Buy groceries", {
          box: "inbox",
          updated_at: "2025-01-01T00:00:00.000Z",
        });
        const existingTask = await db.tasks.get(
          getIdOrThrow(ctx.taskIds, "Buy groceries"),
        );
        originalUpdatedAt = existingTask?.updated_at ?? "";
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

    Then('task name is "Buy vegetables"', async (_ctx: TestContext) => {
      expect(updatedTask.name).toBe("Buy vegetables");
    });

    And('task has syncStatus "pending"', async (_ctx: TestContext) => {
      expect(updatedTask.syncStatus).toBe("pending");
    });

    And("task updated_at is refreshed", async (_ctx: TestContext) => {
      expect(updatedTask.updated_at).not.toBe(originalUpdatedAt);
    });
  });

  // @task-core-specs @FR1
  f.Scenario("Update nonexistent task throws error", ({ When, Then }) => {
    const nonexistentId = crypto.randomUUID();
    let thrownError: Error;

    When("user updates nonexistent task", async (_ctx: TestContext) => {
      try {
        await ctx.taskService.update(nonexistentId, { name: "New Name" });
      } catch (error) {
        thrownError = error as Error;
      }
    });

    Then('error "Task not found" is thrown', async (_ctx: TestContext) => {
      expect(thrownError).toBeDefined();
      expect(thrownError.message).toContain("Task not found");
    });
  });
});

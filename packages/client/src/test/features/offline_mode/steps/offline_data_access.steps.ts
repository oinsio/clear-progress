// implements FR1, FR2, FR3, FR7, FR8 of add-offline-mode-specs
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

const feature = await loadFeature("../offline_data_access.feature");

type Context = Record<string, never>;

describeFeature(feature, (f: FeatureDescriibeCallbackParams<Context>) => {
  const ctx = createScenarioContext();

  f.BeforeEachScenario(async () => {
    await ctx.reset();
  });

  // @add-offline-mode-specs @FR1 @FR2
  f.Scenario("Create entity without network", ({ When, Then, And }) => {
    let createdTask: Task;

    When(
      "user creates a task without any backend configured",
      async (_ctx: TestContext) => {
        createdTask = await ctx.taskService.create({
          name: "Offline task",
          box: "inbox",
        });
      },
    );

    Then("the task is persisted in IndexedDB", async (_ctx: TestContext) => {
      const persistedTask = await db.tasks.get(createdTask.id);
      expect(persistedTask).toBeDefined();
      expect(persistedTask?.name).toBe("Offline task");
    });

    And("the task has needsSync true", async (_ctx: TestContext) => {
      expect(createdTask.needsSync).toBe(true);
    });
  });

  // @add-offline-mode-specs @FR1 @FR2
  f.Scenario("Read entities without network", ({ Given, When, Then }) => {
    let returnedTasks: Task[];

    Given("tasks exist in IndexedDB", async (_ctx: TestContext) => {
      await seedTask(ctx.taskIds, "Active task", { box: "inbox" });
      await seedTask(ctx.taskIds, "Deleted task", {
        box: "inbox",
        is_deleted: true,
      });
    });

    When(
      "user reads all tasks without any backend configured",
      async (_ctx: TestContext) => {
        returnedTasks = await ctx.taskService.getByBox("inbox");
      },
    );

    Then(
      "all non-deleted tasks are returned from IndexedDB",
      async (_ctx: TestContext) => {
        expect(returnedTasks).toHaveLength(1);
        expect(returnedTasks[0].name).toBe("Active task");
      },
    );
  });

  // @add-offline-mode-specs @FR2
  f.Scenario("Update entity without network", ({ Given, When, Then, And }) => {
    let updatedTask: Task;

    Given("a task exists in IndexedDB", async (_ctx: TestContext) => {
      await seedTask(ctx.taskIds, "Original task", { box: "inbox" });
    });

    When(
      "user updates the task without any backend configured",
      async (_ctx: TestContext) => {
        updatedTask = await ctx.taskService.update(
          getIdOrThrow(ctx.taskIds, "Original task"),
          { name: "Updated task" },
        );
      },
    );

    Then("the task is updated in IndexedDB", async (_ctx: TestContext) => {
      const persistedTask = await db.tasks.get(updatedTask.id);
      expect(persistedTask?.name).toBe("Updated task");
    });

    And("the task has needsSync true", async (_ctx: TestContext) => {
      expect(updatedTask.needsSync).toBe(true);
    });
  });

  // @add-offline-mode-specs @FR2
  f.Scenario(
    "Soft-delete entity without network",
    ({ Given, When, Then, And }) => {
      let deletedTask: Task;

      Given("a task exists in IndexedDB", async (_ctx: TestContext) => {
        await seedTask(ctx.taskIds, "Task to delete", { box: "inbox" });
      });

      When(
        "user deletes the task without any backend configured",
        async (_ctx: TestContext) => {
          deletedTask = await ctx.taskService.softDelete(
            getIdOrThrow(ctx.taskIds, "Task to delete"),
          );
        },
      );

      Then("the task has is_deleted true", async (_ctx: TestContext) => {
        expect(deletedTask.is_deleted).toBe(true);
      });

      And("the task has needsSync true", async (_ctx: TestContext) => {
        expect(deletedTask.needsSync).toBe(true);
      });
    },
  );

  // @add-offline-mode-specs @FR3 @FR7
  f.Scenario(
    "Dirty records survive database reopen",
    ({ Given, When, Then }) => {
      let createdTaskId: string;

      Given(
        "a task was created without any backend configured",
        async (_ctx: TestContext) => {
          const createdTask = await ctx.taskService.create({
            name: "Persistent task",
            box: "inbox",
          });
          createdTaskId = createdTask.id;
        },
      );

      When("the database is closed and reopened", async (_ctx: TestContext) => {
        db.close();
        await db.open();
      });

      Then(
        "the task still exists with needsSync true",
        async (_ctx: TestContext) => {
          const persistedTask = await db.tasks.get(createdTaskId);
          expect(persistedTask).toBeDefined();
          expect(persistedTask?.name).toBe("Persistent task");
          expect(persistedTask?.needsSync).toBe(true);
        },
      );
    },
  );
});

// implements FR7 of task-core-specs
import type { FeatureDescriibeCallbackParams } from "@amiceli/vitest-cucumber";
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import { expect, type TestContext } from "vitest";
import { db } from "@/db/database";
import {
  createScenarioContext,
  seedTask,
} from "@/test/helpers/bdd/tasks/helpers";
import { getIdOrThrow } from "@/test/helpers/getIdOrThrow";
import type { ChecklistItem, Task } from "@/types/entities";
import { toISOTimestamp } from "@/utils/dateHelpers";

const feature = await loadFeature("../tasks_duplicate.feature");

type Context = Record<string, never>;

describeFeature(feature, (f: FeatureDescriibeCallbackParams<Context>) => {
  const ctx = createScenarioContext();

  f.BeforeEachScenario(async () => {
    await ctx.reset();
  });

  // @task-core-specs @FR7
  f.Scenario("Duplicate a task", ({ Given, When, Then, And }) => {
    let duplicatedTask: Task;

    Given(
      'task "Buy groceries" in inbox with description "weekly"',
      async (_ctx: TestContext) => {
        await seedTask(ctx.taskIds, "Buy groceries", {
          box: "inbox",
          description: "weekly",
        });
      },
    );

    When("user duplicates the task", async (_ctx: TestContext) => {
      duplicatedTask = await ctx.taskService.duplicate(
        getIdOrThrow(ctx.taskIds, "Buy groceries"),
      );
    });

    Then(
      'a new task exists with name "Buy groceries" and description "weekly"',
      async (_ctx: TestContext) => {
        expect(duplicatedTask.name).toBe("Buy groceries");
        expect(duplicatedTask.description).toBe("weekly");
      },
    );

    And("new task has a different id", async (_ctx: TestContext) => {
      const originalId = getIdOrThrow(ctx.taskIds, "Buy groceries");
      expect(duplicatedTask.id).not.toBe(originalId);
    });

    And("new task has needsSync true", async (_ctx: TestContext) => {
      expect(duplicatedTask.needsSync).toBe(true);
    });
  });

  // @task-core-specs @FR7
  f.Scenario("Duplicate copies checklist items", ({ Given, When, Then }) => {
    let duplicatedTask: Task;
    const originalChecklistIds: string[] = [];

    Given(
      'task "Buy groceries" has 2 checklist items',
      async (_ctx: TestContext) => {
        await seedTask(ctx.taskIds, "Buy groceries", { box: "inbox" });
        const taskId = getIdOrThrow(ctx.taskIds, "Buy groceries");
        const now = toISOTimestamp();

        const firstItemId = crypto.randomUUID();
        const secondItemId = crypto.randomUUID();
        originalChecklistIds.push(firstItemId, secondItemId);

        await db.checklist_items.bulkAdd([
          {
            id: firstItemId,
            task_id: taskId,
            name: "Milk",
            is_completed: false,
            sort_order: 0,
            is_deleted: false,
            created_at: now,
            updated_at: now,
            revision: 0,
            needsSync: false,
          } as ChecklistItem,
          {
            id: secondItemId,
            task_id: taskId,
            name: "Bread",
            is_completed: false,
            sort_order: 1,
            is_deleted: false,
            created_at: now,
            updated_at: now,
            revision: 0,
            needsSync: false,
          } as ChecklistItem,
        ]);
      },
    );

    When("user duplicates the task", async (_ctx: TestContext) => {
      duplicatedTask = await ctx.taskService.duplicate(
        getIdOrThrow(ctx.taskIds, "Buy groceries"),
      );
    });

    Then(
      "new task has 2 checklist items with new ids",
      async (_ctx: TestContext) => {
        const copiedItems = await db.checklist_items
          .where("task_id")
          .equals(duplicatedTask.id)
          .toArray();

        expect(copiedItems).toHaveLength(2);

        for (const copiedItem of copiedItems) {
          expect(originalChecklistIds).not.toContain(copiedItem.id);
        }
      },
    );
  });

  // @task-core-specs @FR7
  f.Scenario("Duplicate nonexistent task throws error", ({ When, Then }) => {
    let thrownError: Error;

    When("user duplicates nonexistent task", async (_ctx: TestContext) => {
      try {
        await ctx.taskService.duplicate(crypto.randomUUID());
      } catch (error) {
        thrownError = error as Error;
      }
    });

    Then('error "Task not found" is thrown', async (_ctx: TestContext) => {
      expect(thrownError).toBeDefined();
      expect(thrownError.message).toContain("Task not found");
    });
  });

  // @hide-tasks @FR10
  f.Scenario(
    "Duplicating a hidden task creates a visible copy",
    ({ Given, When, Then, And }) => {
      let duplicatedTask: Task;

      Given(
        'a hidden task "Renew passport" with appear_date "2027-06-01"',
        async (_ctx: TestContext) => {
          await seedTask(ctx.taskIds, "Renew passport", {
            box: "inbox",
            is_hidden: true,
            appear_date: "2027-06-01",
          });
        },
      );

      When("user duplicates the task", async (_ctx: TestContext) => {
        duplicatedTask = await ctx.taskService.duplicate(
          getIdOrThrow(ctx.taskIds, "Renew passport"),
        );
      });

      Then("new task has is_hidden false", async (_ctx: TestContext) => {
        expect(duplicatedTask.is_hidden).toBe(false);
      });

      And('new task has appear_date ""', async (_ctx: TestContext) => {
        expect(duplicatedTask.appear_date).toBe("");
      });
    },
  );
});

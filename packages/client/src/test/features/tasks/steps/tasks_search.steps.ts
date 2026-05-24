// implements FR6 of task-core-specs
import type { FeatureDescriibeCallbackParams } from "@amiceli/vitest-cucumber";
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import { expect, type TestContext } from "vitest";
import {
  createScenarioContext,
  seedTask,
} from "@/test/helpers/bdd/tasks/helpers";
import type { Task } from "@/types/entities";

const feature = await loadFeature("../tasks_search.feature");

type Context = Record<string, never>;

describeFeature(feature, (f: FeatureDescriibeCallbackParams<Context>) => {
  const ctx = createScenarioContext();

  f.BeforeEachScenario(async () => {
    await ctx.reset();
  });

  // @task-core-specs @FR6
  f.Scenario("Search by name", ({ Given, When, Then }) => {
    let searchResults: Task[];

    Given(
      'tasks "Buy groceries" and "Read book" exist',
      async (_ctx: TestContext) => {
        await seedTask(ctx.taskIds, "Buy groceries", { box: "inbox" });
        await seedTask(ctx.taskIds, "Read book", { box: "inbox" });
      },
    );

    When('user searches for "buy"', async (_ctx: TestContext) => {
      searchResults = await ctx.taskService.searchByName("buy");
    });

    Then('only "Buy groceries" is returned', async (_ctx: TestContext) => {
      expect(searchResults).toHaveLength(1);
      expect(searchResults[0].name).toBe("Buy groceries");
    });
  });

  // @task-core-specs @FR6
  f.Scenario("Search by description", ({ Given, When, Then }) => {
    let searchResults: Task[];

    Given(
      'task with description "weekly shopping list" exists',
      async (_ctx: TestContext) => {
        await seedTask(ctx.taskIds, "Errands", {
          box: "inbox",
          description: "weekly shopping list",
        });
      },
    );

    When('user searches for "shopping"', async (_ctx: TestContext) => {
      searchResults = await ctx.taskService.searchByName("shopping");
    });

    Then("the task is returned", async (_ctx: TestContext) => {
      expect(searchResults).toHaveLength(1);
      expect(searchResults[0].name).toBe("Errands");
    });
  });

  // @task-core-specs @FR6
  f.Scenario("Search is case-insensitive", ({ Given, When, Then }) => {
    let searchResults: Task[];

    Given('task "Buy Groceries" exists', async (_ctx: TestContext) => {
      await seedTask(ctx.taskIds, "Buy Groceries", { box: "inbox" });
    });

    When('user searches for "buy groceries"', async (_ctx: TestContext) => {
      searchResults = await ctx.taskService.searchByName("buy groceries");
    });

    Then("the task is returned", async (_ctx: TestContext) => {
      expect(searchResults).toHaveLength(1);
      expect(searchResults[0].name).toBe("Buy Groceries");
    });
  });

  // @task-core-specs @FR6
  f.Scenario(
    "Incomplete tasks sorted before completed",
    ({ Given, When, Then }) => {
      let searchResults: Task[];

      Given(
        'incomplete task "Task A" and completed task "Task B" both match query "Task"',
        async (_ctx: TestContext) => {
          await seedTask(ctx.taskIds, "Task A", {
            box: "inbox",
            is_completed: false,
            updated_at: "2026-01-01T10:00:00.000Z",
          });
          await seedTask(ctx.taskIds, "Task B", {
            box: "inbox",
            is_completed: true,
            completed_at: "2026-01-01T10:00:00.000Z",
            updated_at: "2026-01-02T10:00:00.000Z",
          });
        },
      );

      When('user searches for "Task"', async (_ctx: TestContext) => {
        searchResults = await ctx.taskService.searchByName("Task");
      });

      Then('"Task A" appears before "Task B"', async (_ctx: TestContext) => {
        expect(searchResults).toHaveLength(2);
        expect(searchResults[0].name).toBe("Task A");
        expect(searchResults[1].name).toBe("Task B");
      });
    },
  );

  // @task-core-specs @FR6
  f.Scenario("No matches returns empty array", ({ When, Then }) => {
    let searchResults: Task[];

    When('user searches for "nonexistent"', async (_ctx: TestContext) => {
      searchResults = await ctx.taskService.searchByName("nonexistent");
    });

    Then("empty array is returned", async (_ctx: TestContext) => {
      expect(searchResults).toEqual([]);
    });
  });
});

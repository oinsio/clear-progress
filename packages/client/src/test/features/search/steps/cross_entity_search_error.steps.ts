// implements FR3 of search-specs
import type { FeatureDescriibeCallbackParams } from "@amiceli/vitest-cucumber";
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import { expect, type MockInstance, type TestContext, vi } from "vitest";
import {
  createMockGoalService,
  createMockIdeaService,
  createMockTaskService,
  createSearchMocks,
  performSearch,
  type SearchMocks,
} from "@/hooks/useSearch.test-utils";
import type { Goal, Idea, Task } from "@/types/entities";

const feature = await loadFeature("../cross_entity_search_error.feature");

type Context = Record<string, never>;

describeFeature(feature, (f: FeatureDescriibeCallbackParams<Context>) => {
  let mocks: SearchMocks;
  let consoleErrorSpy: MockInstance;

  f.BeforeEachScenario(async () => {
    mocks = createSearchMocks();
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  f.AfterEachScenario(async () => {
    consoleErrorSpy.mockRestore();
  });

  // @search-specs @FR3
  f.Scenario(
    "One service fails clears all results",
    ({ Given, When, Then }) => {
      let foundTasks: Task[];
      let foundGoals: Goal[];
      let foundIdeas: Idea[];

      Given(
        "taskService.searchByName throws an error",
        async (_ctx: TestContext) => {
          mocks.mockTaskService = createMockTaskService({
            searchByName: vi.fn().mockRejectedValue(new Error("Search failed")),
          });
        },
      );

      When('user searches for "buy"', async (_ctx: TestContext) => {
        const searchResult = await performSearch(mocks, "buy");
        foundTasks = searchResult.tasks;
        foundGoals = searchResult.goals;
        foundIdeas = searchResult.ideas;
      });

      Then(
        "tasks, goals, and ideas are all empty arrays",
        async (_ctx: TestContext) => {
          expect(foundTasks).toEqual([]);
          expect(foundGoals).toEqual([]);
          expect(foundIdeas).toEqual([]);
        },
      );
    },
  );

  // @search-specs @FR3
  f.Scenario("Error is logged to console", ({ Given, When, Then }) => {
    Given(
      "goalService.searchByName throws an error",
      async (_ctx: TestContext) => {
        mocks.mockGoalService = createMockGoalService({
          searchByName: vi.fn().mockRejectedValue(new Error("Search failed")),
        });
      },
    );

    When('user searches for "learn"', async (_ctx: TestContext) => {
      await performSearch(mocks, "learn");
    });

    Then("error is logged to console", async (_ctx: TestContext) => {
      expect(consoleErrorSpy).toHaveBeenCalled();
    });
  });

  // @search-specs @FR3
  f.Scenario(
    "isSearching is false after search error",
    ({ Given, When, Then }) => {
      let isSearching: boolean;

      Given(
        "ideaService.searchByName throws an error",
        async (_ctx: TestContext) => {
          mocks.mockIdeaService = createMockIdeaService({
            searchByName: vi.fn().mockRejectedValue(new Error("Search failed")),
          });
        },
      );

      When('user searches for "test"', async (_ctx: TestContext) => {
        const searchResult = await performSearch(mocks, "test");
        isSearching = searchResult.isSearching;
      });

      Then("isSearching is false", async (_ctx: TestContext) => {
        expect(isSearching).toBe(false);
      });
    },
  );
});

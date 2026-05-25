// implements FR4, FR5 of search-specs
import type { FeatureDescriibeCallbackParams } from "@amiceli/vitest-cucumber";
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import { act } from "@testing-library/react";
import { expect, type TestContext } from "vitest";
import {
  buildGoal,
  buildIdea,
  buildTask,
  createSearchMocks,
  renderUseSearch,
  type SearchMocks,
  setupSearchServiceMocks,
} from "@/hooks/useSearch.test-utils";
import type { Goal, Idea, Task } from "@/types/entities";

const feature = await loadFeature("../cross_entity_search_state.feature");

type Context = Record<string, never>;

describeFeature(feature, (f: FeatureDescriibeCallbackParams<Context>) => {
  let mocks: SearchMocks;

  f.BeforeEachScenario(async () => {
    mocks = createSearchMocks();
  });

  // @search-specs @FR5
  f.Scenario("Initial state", ({ When, Then, And }) => {
    let isSearching: boolean;
    let foundTasks: Task[];
    let foundGoals: Goal[];
    let foundIdeas: Idea[];

    When("useSearch is initialized", async (_ctx: TestContext) => {
      const { result } = renderUseSearch(mocks);
      isSearching = result.current.isSearching;
      foundTasks = result.current.tasks;
      foundGoals = result.current.goals;
      foundIdeas = result.current.ideas;
    });

    Then("isSearching is false", async (_ctx: TestContext) => {
      expect(isSearching).toBe(false);
    });

    And(
      "tasks, goals, and ideas are all empty arrays",
      async (_ctx: TestContext) => {
        expect(foundTasks).toEqual([]);
        expect(foundGoals).toEqual([]);
        expect(foundIdeas).toEqual([]);
      },
    );
  });

  // @search-specs @FR5
  f.Scenario(
    "isSearching is false after search completes",
    ({ When, Then }) => {
      let isSearching: boolean;

      When(
        'user searches for "learn" and search completes',
        async (_ctx: TestContext) => {
          const { result } = renderUseSearch(mocks);
          await act(async () => {
            await result.current.search("learn");
          });
          isSearching = result.current.isSearching;
        },
      );

      Then("isSearching is false", async (_ctx: TestContext) => {
        expect(isSearching).toBe(false);
      });
    },
  );

  // @search-specs @FR4
  f.Scenario("Clear resets all results", ({ Given, When, Then }) => {
    let foundTasks: Task[];
    let foundGoals: Goal[];
    let foundIdeas: Idea[];

    Given("previous search returned results", async (_ctx: TestContext) => {
      setupSearchServiceMocks(mocks, {
        tasks: [buildTask({ name: "Buy groceries" })],
        goals: [buildGoal({ name: "Learn piano" })],
        ideas: [buildIdea({ name: "Write book" })],
      });
    });

    When("user calls clear", async (_ctx: TestContext) => {
      const { result } = renderUseSearch(mocks);
      await act(async () => {
        await result.current.search("query");
      });
      expect(result.current.tasks).toHaveLength(1);
      await act(async () => {
        result.current.clear();
      });
      foundTasks = result.current.tasks;
      foundGoals = result.current.goals;
      foundIdeas = result.current.ideas;
    });

    Then(
      "tasks, goals, and ideas are all empty arrays",
      async (_ctx: TestContext) => {
        expect(foundTasks).toEqual([]);
        expect(foundGoals).toEqual([]);
        expect(foundIdeas).toEqual([]);
      },
    );
  });
});

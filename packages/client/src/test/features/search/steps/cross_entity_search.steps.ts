// implements FR1, FR2 of search-specs
import type { FeatureDescriibeCallbackParams } from "@amiceli/vitest-cucumber";
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import { act } from "@testing-library/react";
import { expect, type TestContext, vi } from "vitest";
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

const feature = await loadFeature("../cross_entity_search.feature");

type Context = Record<string, never>;

describeFeature(feature, (f: FeatureDescriibeCallbackParams<Context>) => {
  let mocks: SearchMocks;

  f.BeforeEachScenario(async () => {
    mocks = createSearchMocks();
  });

  // @search-specs @FR1
  f.Scenario(
    "Search returns results from all entity types",
    ({ Given, When, Then }) => {
      let foundTasks: Task[];
      let foundGoals: Goal[];
      let foundIdeas: Idea[];

      Given(
        'tasks, goals, and ideas matching "learn" exist',
        async (_ctx: TestContext) => {
          setupSearchServiceMocks(mocks, {
            tasks: [buildTask({ name: "Learn TypeScript" })],
            goals: [buildGoal({ name: "Learn piano" })],
            ideas: [buildIdea({ name: "Learn Rust" })],
          });
        },
      );

      When('user searches for "learn"', async (_ctx: TestContext) => {
        const { result } = renderUseSearch(mocks);
        await act(async () => {
          await result.current.search("learn");
        });
        foundTasks = result.current.tasks;
        foundGoals = result.current.goals;
        foundIdeas = result.current.ideas;
      });

      Then(
        "results contain matching tasks, goals, and ideas",
        async (_ctx: TestContext) => {
          expect(foundTasks).toHaveLength(1);
          expect(foundGoals).toHaveLength(1);
          expect(foundIdeas).toHaveLength(1);
        },
      );
    },
  );

  // @search-specs @FR1
  f.Scenario("Search returns partial results", ({ Given, When, Then, And }) => {
    let foundTasks: Task[];
    let foundGoals: Goal[];
    let foundIdeas: Idea[];

    Given('only tasks matching "buy" exist', async (_ctx: TestContext) => {
      setupSearchServiceMocks(mocks, {
        tasks: [buildTask({ name: "Buy groceries" })],
      });
    });

    When('user searches for "buy"', async (_ctx: TestContext) => {
      const { result } = renderUseSearch(mocks);
      await act(async () => {
        await result.current.search("buy");
      });
      foundTasks = result.current.tasks;
      foundGoals = result.current.goals;
      foundIdeas = result.current.ideas;
    });

    Then("tasks contain matches", async (_ctx: TestContext) => {
      expect(foundTasks).toHaveLength(1);
    });

    And("goals are empty", async (_ctx: TestContext) => {
      expect(foundGoals).toEqual([]);
    });

    And("ideas are empty", async (_ctx: TestContext) => {
      expect(foundIdeas).toEqual([]);
    });
  });

  // @search-specs @FR1
  f.Scenario("All services called with same query", ({ When, Then, And }) => {
    When('user searches for "meeting"', async (_ctx: TestContext) => {
      const { result } = renderUseSearch(mocks);
      await act(async () => {
        await result.current.search("meeting");
      });
    });

    Then(
      'taskService.searchByName is called with "meeting"',
      async (_ctx: TestContext) => {
        expect(mocks.mockTaskService.searchByName).toHaveBeenCalledWith(
          "meeting",
        );
      },
    );

    And(
      'goalService.searchByName is called with "meeting"',
      async (_ctx: TestContext) => {
        expect(mocks.mockGoalService.searchByName).toHaveBeenCalledWith(
          "meeting",
        );
      },
    );

    And(
      'ideaService.searchByName is called with "meeting"',
      async (_ctx: TestContext) => {
        expect(mocks.mockIdeaService.searchByName).toHaveBeenCalledWith(
          "meeting",
        );
      },
    );
  });

  // @search-specs @FR2
  f.Scenario("Empty query clears all results", ({ Given, When, Then, And }) => {
    let foundTasks: Task[], foundGoals: Goal[], foundIdeas: Idea[];
    let callsBefore: { task: number; goal: number; idea: number };

    Given("previous search returned results", async (_ctx: TestContext) => {
      setupSearchServiceMocks(mocks, {
        tasks: [buildTask({ name: "Buy" })],
        goals: [buildGoal({ name: "Learn" })],
        ideas: [buildIdea({ name: "Write" })],
      });
    });

    When("user searches with empty string", async (_ctx: TestContext) => {
      const { result } = renderUseSearch(mocks);
      await act(async () => {
        await result.current.search("query");
      });
      callsBefore = {
        task: vi.mocked(mocks.mockTaskService.searchByName).mock.calls.length,
        goal: vi.mocked(mocks.mockGoalService.searchByName).mock.calls.length,
        idea: vi.mocked(mocks.mockIdeaService.searchByName).mock.calls.length,
      };
      await act(async () => {
        await result.current.search("");
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

    And(
      "no service searchByName methods are called",
      async (_ctx: TestContext) => {
        expect(
          vi.mocked(mocks.mockTaskService.searchByName).mock.calls.length,
        ).toBe(callsBefore.task);
        expect(
          vi.mocked(mocks.mockGoalService.searchByName).mock.calls.length,
        ).toBe(callsBefore.goal);
        expect(
          vi.mocked(mocks.mockIdeaService.searchByName).mock.calls.length,
        ).toBe(callsBefore.idea);
      },
    );
  });
});

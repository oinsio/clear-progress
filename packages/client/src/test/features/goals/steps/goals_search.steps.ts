// implements FR7 of add-goals-specs
import type { FeatureDescriibeCallbackParams } from "@amiceli/vitest-cucumber";
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import { expect, type TestContext } from "vitest";
import {
  createScenarioContext,
  seedGoal,
} from "@/test/helpers/bdd/goals/helpers";
import type { Goal } from "@/types/entities";

const feature = await loadFeature("../goals_search.feature");

type Context = Record<string, never>;

describeFeature(feature, (f: FeatureDescriibeCallbackParams<Context>) => {
  const ctx = createScenarioContext();
  let searchResults: Goal[];

  const searchForLearn = async () => {
    searchResults = await ctx.goalService.searchByName("Learn");
  };

  const expectBBeforeA = () => {
    expect(searchResults).toHaveLength(2);
    expect(searchResults[0].name).toBe("Learn B");
    expect(searchResults[1].name).toBe("Learn A");
  };

  f.BeforeEachScenario(async () => {
    await ctx.reset();
    searchResults = [];
  });

  // @add-goals-specs @FR7
  f.Scenario("Search by name", ({ Given, When, Then }) => {
    Given(
      'goals "Learn Rust", "Learn Go", "Write book" exist',
      async (_ctx: TestContext) => {
        await seedGoal(ctx.goalIds, "Learn Rust", { name: "Learn Rust" });
        await seedGoal(ctx.goalIds, "Learn Go", { name: "Learn Go" });
        await seedGoal(ctx.goalIds, "Write book", { name: "Write book" });
      },
    );

    When('user searches for "learn"', async (_ctx: TestContext) => {
      searchResults = await ctx.goalService.searchByName("learn");
    });

    Then(
      'goals "Learn Rust" and "Learn Go" are returned',
      async (_ctx: TestContext) => {
        const names = searchResults.map((goal) => goal.name);
        expect(names).toHaveLength(2);
        expect(names).toContain("Learn Rust");
        expect(names).toContain("Learn Go");
      },
    );
  });

  // @add-goals-specs @FR7
  f.Scenario("Search by description", ({ Given, When, Then }) => {
    Given(
      'goal "Project" with description "Learn new frameworks" exists',
      async (_ctx: TestContext) => {
        await seedGoal(ctx.goalIds, "Project", {
          name: "Project",
          description: "Learn new frameworks",
        });
      },
    );

    When('user searches for "framework"', async (_ctx: TestContext) => {
      searchResults = await ctx.goalService.searchByName("framework");
    });

    Then('goal "Project" is returned', async (_ctx: TestContext) => {
      expect(searchResults).toHaveLength(1);
      expect(searchResults[0].name).toBe("Project");
    });
  });

  // @add-goals-specs @FR7
  f.Scenario("Case-insensitive search", ({ Given, When, Then }) => {
    Given('goal "Learn RUST" exists', async (_ctx: TestContext) => {
      await seedGoal(ctx.goalIds, "Learn RUST", { name: "Learn RUST" });
    });

    When('user searches for "rust"', async (_ctx: TestContext) => {
      searchResults = await ctx.goalService.searchByName("rust");
    });

    Then('goal "Learn RUST" is returned', async (_ctx: TestContext) => {
      expect(searchResults).toHaveLength(1);
      expect(searchResults[0].name).toBe("Learn RUST");
    });
  });

  // @add-goals-specs @FR7
  f.Scenario(
    "Results sorted by status priority then updated_at",
    ({ Given, When, Then }) => {
      Given(
        'goal "A" with status "completed" updated at "2026-01-01T11:00:00.000Z" and goal "B" with status "in_progress" updated at "2026-01-01T10:00:00.000Z" exist',
        async (_ctx: TestContext) => {
          await seedGoal(ctx.goalIds, "A", {
            name: "Learn A",
            status: "completed",
            updated_at: "2026-01-01T11:00:00.000Z",
          });
          await seedGoal(ctx.goalIds, "B", {
            name: "Learn B",
            status: "in_progress",
            updated_at: "2026-01-01T10:00:00.000Z",
          });
        },
      );

      When('user searches for "Learn"', async (_ctx: TestContext) => {
        await searchForLearn();
      });

      Then('goal "B" appears before goal "A"', async (_ctx: TestContext) => {
        expectBBeforeA();
      });
    },
  );

  // @add-goals-specs @FR7
  f.Scenario(
    "Same status sorted by updated_at descending",
    ({ Given, When, Then }) => {
      Given(
        'goal "A" with status "planning" updated at "2026-01-01T10:00:00.000Z" and goal "B" with status "planning" updated at "2026-01-01T11:00:00.000Z" exist',
        async (_ctx: TestContext) => {
          await seedGoal(ctx.goalIds, "A", {
            name: "Learn A",
            status: "planning",
            updated_at: "2026-01-01T10:00:00.000Z",
          });
          await seedGoal(ctx.goalIds, "B", {
            name: "Learn B",
            status: "planning",
            updated_at: "2026-01-01T11:00:00.000Z",
          });
        },
      );

      When('user searches for "Learn"', async (_ctx: TestContext) => {
        await searchForLearn();
      });

      Then('goal "B" appears before goal "A"', async (_ctx: TestContext) => {
        expectBBeforeA();
      });
    },
  );

  // @add-goals-specs @FR7
  f.Scenario("No matches returns empty", ({ Given, When, Then }) => {
    Given('goal "Learn Rust" exists', async (_ctx: TestContext) => {
      await seedGoal(ctx.goalIds, "Learn Rust", { name: "Learn Rust" });
    });

    When('user searches for "python"', async (_ctx: TestContext) => {
      searchResults = await ctx.goalService.searchByName("python");
    });

    Then("empty array is returned", async (_ctx: TestContext) => {
      expect(searchResults).toEqual([]);
    });
  });
});

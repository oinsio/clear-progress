// implements FR7 of add-ideas-specs
import type { FeatureDescriibeCallbackParams } from "@amiceli/vitest-cucumber";
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import { expect, type TestContext } from "vitest";
import type { Idea } from "@/types/entities";
import { createScenarioContext, seedIdea } from "./ideas_steps.helpers";

const feature = await loadFeature("../ideas_search.feature");

type Context = Record<string, never>;

describeFeature(feature, (f: FeatureDescriibeCallbackParams<Context>) => {
  const ctx = createScenarioContext();

  f.BeforeEachScenario(async () => {
    await ctx.reset();
  });

  // @add-ideas-specs @FR7
  f.Scenario("Search by name", ({ Given, When, Then }) => {
    let searchResults: Idea[];

    Given(
      'ideas "Learn Rust", "Learn Go", "Write book" exist',
      async (_ctx: TestContext) => {
        await seedIdea(ctx.ideaIds, "Learn Rust", { name: "Learn Rust" });
        await seedIdea(ctx.ideaIds, "Learn Go", { name: "Learn Go" });
        await seedIdea(ctx.ideaIds, "Write book", { name: "Write book" });
      },
    );

    When('user searches for "learn"', async (_ctx: TestContext) => {
      searchResults = await ctx.ideaService.searchByName("learn");
    });

    Then(
      'ideas "Learn Rust" and "Learn Go" are returned',
      async (_ctx: TestContext) => {
        const names = searchResults.map((idea) => idea.name);
        expect(names).toHaveLength(2);
        expect(names).toContain("Learn Rust");
        expect(names).toContain("Learn Go");
      },
    );
  });

  // @add-ideas-specs @FR7
  f.Scenario("Search by description", ({ Given, When, Then }) => {
    let searchResults: Idea[];

    Given(
      'idea "Project" with description "Learn new frameworks" exists',
      async (_ctx: TestContext) => {
        await seedIdea(ctx.ideaIds, "Project", {
          name: "Project",
          description: "Learn new frameworks",
        });
      },
    );

    When('user searches for "framework"', async (_ctx: TestContext) => {
      searchResults = await ctx.ideaService.searchByName("framework");
    });

    Then('idea "Project" is returned', async (_ctx: TestContext) => {
      expect(searchResults).toHaveLength(1);
      expect(searchResults[0].name).toBe("Project");
    });
  });

  // @add-ideas-specs @FR7
  f.Scenario("Case-insensitive search", ({ Given, When, Then }) => {
    let searchResults: Idea[];

    Given('idea "Learn RUST" exists', async (_ctx: TestContext) => {
      await seedIdea(ctx.ideaIds, "Learn RUST", { name: "Learn RUST" });
    });

    When('user searches for "rust"', async (_ctx: TestContext) => {
      searchResults = await ctx.ideaService.searchByName("rust");
    });

    Then('idea "Learn RUST" is returned', async (_ctx: TestContext) => {
      expect(searchResults).toHaveLength(1);
      expect(searchResults[0].name).toBe("Learn RUST");
    });
  });

  // @add-ideas-specs @FR7
  f.Scenario(
    "Results sorted by updated_at descending",
    ({ Given, When, Then }) => {
      let searchResults: Idea[];

      Given(
        'idea "A" updated at "2026-01-01T10:00:00.000Z" and idea "B" updated at "2026-01-01T11:00:00.000Z" exist',
        async (_ctx: TestContext) => {
          await seedIdea(ctx.ideaIds, "A", {
            name: "Learn A",
            updated_at: "2026-01-01T10:00:00.000Z",
          });
          await seedIdea(ctx.ideaIds, "B", {
            name: "Learn B",
            updated_at: "2026-01-01T11:00:00.000Z",
          });
        },
      );

      When('user searches for "Learn"', async (_ctx: TestContext) => {
        searchResults = await ctx.ideaService.searchByName("Learn");
      });

      Then('idea "B" appears before idea "A"', async (_ctx: TestContext) => {
        expect(searchResults).toHaveLength(2);
        expect(searchResults[0].name).toBe("Learn B");
        expect(searchResults[1].name).toBe("Learn A");
      });
    },
  );

  // @add-ideas-specs @FR7
  f.Scenario("No matches returns empty", ({ Given, When, Then }) => {
    let searchResults: Idea[];

    Given('idea "Learn Rust" exists', async (_ctx: TestContext) => {
      await seedIdea(ctx.ideaIds, "Learn Rust", { name: "Learn Rust" });
    });

    When('user searches for "python"', async (_ctx: TestContext) => {
      searchResults = await ctx.ideaService.searchByName("python");
    });

    Then("empty array is returned", async (_ctx: TestContext) => {
      expect(searchResults).toEqual([]);
    });
  });
});

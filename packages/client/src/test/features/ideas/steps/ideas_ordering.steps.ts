// implements FR6, FR10 of add-ideas-specs
import type { FeatureDescriibeCallbackParams } from "@amiceli/vitest-cucumber";
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import { expect, type TestContext } from "vitest";
import {
  createScenarioContext,
  getIdea,
  seedIdeasWithOrder,
} from "./ideas_steps.helpers";

const feature = await loadFeature("../ideas_ordering.feature");

type Context = Record<string, never>;

describeFeature(feature, (f: FeatureDescriibeCallbackParams<Context>) => {
  const ctx = createScenarioContext();

  f.BeforeEachScenario(async () => {
    await ctx.reset();
  });

  // @add-ideas-specs @FR6 @FR10
  f.Scenario(
    "Reorder assigns sequential sort_order",
    ({ Given, When, Then, And }) => {
      Given(
        "ideas A with sort_order 0, B with sort_order 1, C with sort_order 2",
        async (_ctx: TestContext) => {
          await seedIdeasWithOrder(ctx.ideaIds, ["A", "B", "C"]);
        },
      );

      When("user reorders ideas to B, C, A", async (_ctx: TestContext) => {
        const ideaB = await getIdea(ctx.ideaIds, "B");
        const ideaC = await getIdea(ctx.ideaIds, "C");
        const ideaA = await getIdea(ctx.ideaIds, "A");
        await ctx.ideaService.reorderIdeas([ideaB, ideaC, ideaA]);
      });

      Then("idea B has sort_order 0", async (_ctx: TestContext) => {
        const ideaB = await getIdea(ctx.ideaIds, "B");
        expect(ideaB.sort_order).toBe(0);
      });

      And("idea C has sort_order 1", async (_ctx: TestContext) => {
        const ideaC = await getIdea(ctx.ideaIds, "C");
        expect(ideaC.sort_order).toBe(1);
      });

      And("idea A has sort_order 2", async (_ctx: TestContext) => {
        const ideaA = await getIdea(ctx.ideaIds, "A");
        expect(ideaA.sort_order).toBe(2);
      });
    },
  );

  // @add-ideas-specs @FR6 @FR10
  f.Scenario(
    "Only changed ideas marked for sync",
    ({ Given, When, Then, And }) => {
      Given(
        "ideas A with sort_order 0, B with sort_order 1, C with sort_order 2",
        async (_ctx: TestContext) => {
          await seedIdeasWithOrder(ctx.ideaIds, ["A", "B", "C"]);
        },
      );

      When("user reorders ideas to A, C, B", async (_ctx: TestContext) => {
        const ideaA = await getIdea(ctx.ideaIds, "A");
        const ideaC = await getIdea(ctx.ideaIds, "C");
        const ideaB = await getIdea(ctx.ideaIds, "B");
        await ctx.ideaService.reorderIdeas([ideaA, ideaC, ideaB]);
      });

      Then("idea A has needsSync false", async (_ctx: TestContext) => {
        const ideaA = await getIdea(ctx.ideaIds, "A");
        expect(ideaA.needsSync).toBe(false);
      });

      And("idea C has needsSync true", async (_ctx: TestContext) => {
        const ideaC = await getIdea(ctx.ideaIds, "C");
        expect(ideaC.needsSync).toBe(true);
      });

      And("idea B has needsSync true", async (_ctx: TestContext) => {
        const ideaB = await getIdea(ctx.ideaIds, "B");
        expect(ideaB.needsSync).toBe(true);
      });
    },
  );

  // @add-ideas-specs @FR6 @FR10
  f.Scenario("Empty reorder is no-op", ({ Given, When, Then, And }) => {
    Given(
      "ideas A with sort_order 0, B with sort_order 1, C with sort_order 2",
      async (_ctx: TestContext) => {
        await seedIdeasWithOrder(ctx.ideaIds, ["A", "B", "C"]);
      },
    );

    When("user reorders with empty array", async (_ctx: TestContext) => {
      await ctx.ideaService.reorderIdeas([]);
    });

    Then("idea A has needsSync false", async (_ctx: TestContext) => {
      const ideaA = await getIdea(ctx.ideaIds, "A");
      expect(ideaA.needsSync).toBe(false);
    });

    And("idea B has needsSync false", async (_ctx: TestContext) => {
      const ideaB = await getIdea(ctx.ideaIds, "B");
      expect(ideaB.needsSync).toBe(false);
    });

    And("idea C has needsSync false", async (_ctx: TestContext) => {
      const ideaC = await getIdea(ctx.ideaIds, "C");
      expect(ideaC.needsSync).toBe(false);
    });
  });

  // @add-ideas-specs @FR6 @FR10
  f.Scenario("Same order is no-op", ({ Given, When, Then, And }) => {
    Given(
      "ideas A with sort_order 0, B with sort_order 1",
      async (_ctx: TestContext) => {
        await seedIdeasWithOrder(ctx.ideaIds, ["A", "B"]);
      },
    );

    When("user reorders ideas to A, B", async (_ctx: TestContext) => {
      const ideaA = await getIdea(ctx.ideaIds, "A");
      const ideaB = await getIdea(ctx.ideaIds, "B");
      await ctx.ideaService.reorderIdeas([ideaA, ideaB]);
    });

    Then("idea A has needsSync false", async (_ctx: TestContext) => {
      const ideaA = await getIdea(ctx.ideaIds, "A");
      expect(ideaA.needsSync).toBe(false);
    });

    And("idea B has needsSync false", async (_ctx: TestContext) => {
      const ideaB = await getIdea(ctx.ideaIds, "B");
      expect(ideaB.needsSync).toBe(false);
    });
  });
});

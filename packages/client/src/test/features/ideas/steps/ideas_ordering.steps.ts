// implements FR6, FR10 of add-ideas-specs
import type { FeatureDescriibeCallbackParams } from "@amiceli/vitest-cucumber";
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import { expect, type TestContext } from "vitest";
import {
  createScenarioContext,
  getIdea,
  moveIdeaBefore,
  seedIdeasWithOrder,
} from "./ideas_steps.helpers";

const feature = await loadFeature("../ideas_ordering.feature");

type Context = Record<string, never>;

describeFeature(feature, (f: FeatureDescriibeCallbackParams<Context>) => {
  const ctx = createScenarioContext();
  let caughtError: Error | undefined;

  f.BeforeEachScenario(async () => {
    await ctx.reset();
    caughtError = undefined;
  });

  // @add-ideas-specs @FR6 @FR10
  f.Scenario(
    "Reorder places idea at new position via fractional key",
    ({ Given, When, Then }) => {
      Given(
        "ideas A, B, C with ascending sort_order",
        async (_ctx: TestContext) => {
          await seedIdeasWithOrder(ctx.ideaIds, ["A", "B", "C"]);
        },
      );

      When("user moves idea C before idea A", async (_ctx: TestContext) => {
        await moveIdeaBefore(ctx.ideaIds, ctx.ideaService, "C", "A");
      });

      Then("ideas are ordered C, A, B", async (_ctx: TestContext) => {
        const allIdeas = await ctx.ideaService.getAll();
        expect(allIdeas[0].id).toBe(ctx.ideaIds.get("C"));
        expect(allIdeas[1].id).toBe(ctx.ideaIds.get("A"));
        expect(allIdeas[2].id).toBe(ctx.ideaIds.get("B"));
      });
    },
  );

  // @add-ideas-specs @FR6 @FR10
  f.Scenario(
    "Reorder marks moved idea for sync",
    ({ Given, When, Then, And }) => {
      Given(
        "ideas A, B, C with ascending sort_order",
        async (_ctx: TestContext) => {
          await seedIdeasWithOrder(ctx.ideaIds, ["A", "B", "C"]);
        },
      );

      When("user moves idea C before idea A", async (_ctx: TestContext) => {
        await moveIdeaBefore(ctx.ideaIds, ctx.ideaService, "C", "A");
      });

      Then("idea C has needsSync true", async (_ctx: TestContext) => {
        const idea = await getIdea(ctx.ideaIds, "C");
        expect(idea.needsSync).toBe(true);
      });

      And("idea A has needsSync false", async (_ctx: TestContext) => {
        const idea = await getIdea(ctx.ideaIds, "A");
        expect(idea.needsSync).toBe(false);
      });

      And("idea B has needsSync false", async (_ctx: TestContext) => {
        const idea = await getIdea(ctx.ideaIds, "B");
        expect(idea.needsSync).toBe(false);
      });
    },
  );

  // @add-ideas-specs @FR6 @FR10
  f.Scenario(
    "Reorder throws for non-existent idea",
    ({ Given, When, Then }) => {
      Given(
        "ideas A, B with ascending sort_order",
        async (_ctx: TestContext) => {
          await seedIdeasWithOrder(ctx.ideaIds, ["A", "B"]);
        },
      );

      When("user reorders non-existent idea", async (_ctx: TestContext) => {
        try {
          await ctx.ideaService.reorderIdeas("nonexistent-id", "a1");
        } catch (error) {
          caughtError = error as Error;
        }
      });

      Then("an error is thrown", async (_ctx: TestContext) => {
        expect(caughtError).toBeDefined();
      });
    },
  );
});

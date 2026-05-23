// implements FR6 of add-context-category-specs
import type { FeatureDescriibeCallbackParams } from "@amiceli/vitest-cucumber";
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import type { TestContext } from "vitest";
import {
  createScenarioContext,
  expectNeedsSync,
  expectSortOrder,
  getContext,
  seedContextsWithOrder,
} from "./contexts_steps.helpers";

const feature = await loadFeature("../contexts_ordering.feature");

type FeatureContext = Record<string, never>;

describeFeature(
  feature,
  (f: FeatureDescriibeCallbackParams<FeatureContext>) => {
    const ctx = createScenarioContext();

    f.BeforeEachScenario(async () => {
      await ctx.reset();
    });

    // @add-context-category-specs @FR6
    f.Scenario(
      "Reorder assigns sequential sort_order",
      ({ Given, When, Then, And }) => {
        Given(
          "contexts A with sort_order 0, B with sort_order 1, C with sort_order 2",
          async (_ctx: TestContext) => {
            await seedContextsWithOrder(ctx.contextIds, ["A", "B", "C"]);
          },
        );

        When("user reorders contexts to B, C, A", async (_ctx: TestContext) => {
          const contextB = await getContext(ctx.contextIds, "B");
          const contextC = await getContext(ctx.contextIds, "C");
          const contextA = await getContext(ctx.contextIds, "A");
          await ctx.contextService.reorderContexts([
            contextB,
            contextC,
            contextA,
          ]);
        });

        Then("context B has sort_order 0", async (_ctx: TestContext) => {
          await expectSortOrder(ctx.contextIds, "B", 0);
        });

        And("context C has sort_order 1", async (_ctx: TestContext) => {
          await expectSortOrder(ctx.contextIds, "C", 1);
        });

        And("context A has sort_order 2", async (_ctx: TestContext) => {
          await expectSortOrder(ctx.contextIds, "A", 2);
        });
      },
    );

    // @add-context-category-specs @FR6
    f.Scenario(
      "Only changed contexts marked for sync",
      ({ Given, When, Then, And }) => {
        Given(
          "contexts A with sort_order 0, B with sort_order 1, C with sort_order 2",
          async (_ctx: TestContext) => {
            await seedContextsWithOrder(ctx.contextIds, ["A", "B", "C"]);
          },
        );

        When("user reorders contexts to A, C, B", async (_ctx: TestContext) => {
          const contextA = await getContext(ctx.contextIds, "A");
          const contextC = await getContext(ctx.contextIds, "C");
          const contextB = await getContext(ctx.contextIds, "B");
          await ctx.contextService.reorderContexts([
            contextA,
            contextC,
            contextB,
          ]);
        });

        Then("context A has needsSync false", async (_ctx: TestContext) => {
          await expectNeedsSync(ctx.contextIds, "A", false);
        });

        And("context C has needsSync true", async (_ctx: TestContext) => {
          await expectNeedsSync(ctx.contextIds, "C", true);
        });

        And("context B has needsSync true", async (_ctx: TestContext) => {
          await expectNeedsSync(ctx.contextIds, "B", true);
        });
      },
    );

    // @add-context-category-specs @FR6
    f.Scenario("Empty reorder is no-op", ({ Given, When, Then, And }) => {
      Given(
        "contexts A with sort_order 0, B with sort_order 1, C with sort_order 2",
        async (_ctx: TestContext) => {
          await seedContextsWithOrder(ctx.contextIds, ["A", "B", "C"]);
        },
      );

      When("user reorders with empty array", async (_ctx: TestContext) => {
        await ctx.contextService.reorderContexts([]);
      });

      Then("context A has needsSync false", async (_ctx: TestContext) => {
        await expectNeedsSync(ctx.contextIds, "A", false);
      });

      And("context B has needsSync false", async (_ctx: TestContext) => {
        await expectNeedsSync(ctx.contextIds, "B", false);
      });

      And("context C has needsSync false", async (_ctx: TestContext) => {
        await expectNeedsSync(ctx.contextIds, "C", false);
      });
    });

    // @add-context-category-specs @FR6
    f.Scenario("Same order is no-op", ({ Given, When, Then, And }) => {
      Given(
        "contexts A with sort_order 0, B with sort_order 1",
        async (_ctx: TestContext) => {
          await seedContextsWithOrder(ctx.contextIds, ["A", "B"]);
        },
      );

      When("user reorders contexts to A, B", async (_ctx: TestContext) => {
        const contextA = await getContext(ctx.contextIds, "A");
        const contextB = await getContext(ctx.contextIds, "B");
        await ctx.contextService.reorderContexts([contextA, contextB]);
      });

      Then("context A has needsSync false", async (_ctx: TestContext) => {
        await expectNeedsSync(ctx.contextIds, "A", false);
      });

      And("context B has needsSync false", async (_ctx: TestContext) => {
        await expectNeedsSync(ctx.contextIds, "B", false);
      });
    });
  },
);

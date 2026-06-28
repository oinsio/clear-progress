// implements FR6 of add-context-category-specs
import type { FeatureDescriibeCallbackParams } from "@amiceli/vitest-cucumber";
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import { expect, type TestContext } from "vitest";
import {
  createScenarioContext,
  getContext,
  moveContextBefore,
  seedContextsWithOrder,
} from "./contexts_steps.helpers";

const feature = await loadFeature("../contexts_ordering.feature");

type FeatureContext = Record<string, never>;

describeFeature(
  feature,
  (f: FeatureDescriibeCallbackParams<FeatureContext>) => {
    const ctx = createScenarioContext();
    let caughtError: Error | undefined;

    f.BeforeEachScenario(async () => {
      await ctx.reset();
      caughtError = undefined;
    });

    // @add-context-category-specs @FR6
    f.Scenario(
      "Reorder places context at new position via fractional key",
      ({ Given, When, Then }) => {
        Given(
          "contexts A, B, C with ascending sort_order",
          async (_ctx: TestContext) => {
            await seedContextsWithOrder(ctx.contextIds, ["A", "B", "C"]);
          },
        );

        When(
          "user moves context C before context A",
          async (_ctx: TestContext) => {
            await moveContextBefore(
              ctx.contextIds,
              ctx.contextService,
              "C",
              "A",
            );
          },
        );

        Then("contexts are ordered C, A, B", async (_ctx: TestContext) => {
          const allContexts = await ctx.contextService.getAll();
          expect(allContexts[0].id).toBe(ctx.contextIds.get("C"));
          expect(allContexts[1].id).toBe(ctx.contextIds.get("A"));
          expect(allContexts[2].id).toBe(ctx.contextIds.get("B"));
        });
      },
    );

    // @add-context-category-specs @FR6
    f.Scenario(
      "Reorder marks moved context for sync",
      ({ Given, When, Then, And }) => {
        Given(
          "contexts A, B, C with ascending sort_order",
          async (_ctx: TestContext) => {
            await seedContextsWithOrder(ctx.contextIds, ["A", "B", "C"]);
          },
        );

        When(
          "user moves context C before context A",
          async (_ctx: TestContext) => {
            await moveContextBefore(
              ctx.contextIds,
              ctx.contextService,
              "C",
              "A",
            );
          },
        );

        Then(
          'context C has syncStatus "pending"',
          async (_ctx: TestContext) => {
            const context = await getContext(ctx.contextIds, "C");
            expect(context.syncStatus).toBe("pending");
          },
        );

        And('context A has syncStatus "synced"', async (_ctx: TestContext) => {
          const context = await getContext(ctx.contextIds, "A");
          expect(context.syncStatus).toBe("synced");
        });

        And('context B has syncStatus "synced"', async (_ctx: TestContext) => {
          const context = await getContext(ctx.contextIds, "B");
          expect(context.syncStatus).toBe("synced");
        });
      },
    );

    // @add-context-category-specs @FR6
    f.Scenario(
      "Reorder throws for non-existent context",
      ({ Given, When, Then }) => {
        Given(
          "contexts A, B with ascending sort_order",
          async (_ctx: TestContext) => {
            await seedContextsWithOrder(ctx.contextIds, ["A", "B"]);
          },
        );

        When(
          "user reorders non-existent context",
          async (_ctx: TestContext) => {
            try {
              await ctx.contextService.reorderContexts("nonexistent-id", "a1");
            } catch (error) {
              caughtError = error as Error;
            }
          },
        );

        Then("an error is thrown", async (_ctx: TestContext) => {
          expect(caughtError).toBeDefined();
        });
      },
    );
  },
);

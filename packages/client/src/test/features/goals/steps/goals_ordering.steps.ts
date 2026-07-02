// implements FR6, FR10 of add-goals-specs
import type { FeatureDescriibeCallbackParams } from "@amiceli/vitest-cucumber";
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import type { TestContext } from "vitest";
import {
  createScenarioContext,
  expectGoalNeedsSync,
  moveGoalBefore,
  seedGoalsWithOrder,
} from "@/test/helpers/bdd/goals/helpers";

const feature = await loadFeature("../goals_ordering.feature");

type Context = Record<string, never>;

describeFeature(feature, (f: FeatureDescriibeCallbackParams<Context>) => {
  const ctx = createScenarioContext();
  let caughtError: Error | undefined;

  f.BeforeEachScenario(async () => {
    await ctx.reset();
    caughtError = undefined;
  });

  // @add-goals-specs @FR6 @FR10
  f.Scenario(
    "Reorder places goal at new position via fractional key",
    ({ Given, When, Then }) => {
      Given(
        "goals A, B, C with ascending sort_order",
        async (_ctx: TestContext) => {
          await seedGoalsWithOrder(ctx.goalIds, ["A", "B", "C"]);
        },
      );

      When("user moves goal A before goal C", async (_ctx: TestContext) => {
        await moveGoalBefore(ctx.goalIds, ctx.goalService, "A", "C");
      });

      Then("goals are ordered A, C, B", async (_ctx: TestContext) => {
        const allGoals = await ctx.goalService.getAll();
        expect(allGoals[0].id).toBe(ctx.goalIds.get("A"));
        expect(allGoals[1].id).toBe(ctx.goalIds.get("C"));
        expect(allGoals[2].id).toBe(ctx.goalIds.get("B"));
      });
    },
  );

  // @add-goals-specs @FR6 @FR10
  f.Scenario(
    "Reorder marks moved goal for sync",
    ({ Given, When, Then, And }) => {
      Given(
        "goals A, B, C with ascending sort_order",
        async (_ctx: TestContext) => {
          await seedGoalsWithOrder(ctx.goalIds, ["A", "B", "C"]);
        },
      );

      When("user moves goal A before goal C", async (_ctx: TestContext) => {
        await moveGoalBefore(ctx.goalIds, ctx.goalService, "A", "C");
      });

      Then('goal A has syncStatus "pending"', async (_ctx: TestContext) => {
        await expectGoalNeedsSync(ctx.goalIds, "A", "pending");
      });

      And('goal C has syncStatus "synced"', async (_ctx: TestContext) => {
        await expectGoalNeedsSync(ctx.goalIds, "C", "synced");
      });

      And('goal B has syncStatus "synced"', async (_ctx: TestContext) => {
        await expectGoalNeedsSync(ctx.goalIds, "B", "synced");
      });
    },
  );

  // @add-goals-specs @FR6 @FR10
  f.Scenario(
    "Reorder throws for non-existent goal",
    ({ Given, When, Then }) => {
      Given(
        "goals A, B with ascending sort_order",
        async (_ctx: TestContext) => {
          await seedGoalsWithOrder(ctx.goalIds, ["A", "B"]);
        },
      );

      When("user reorders non-existent goal", async (_ctx: TestContext) => {
        try {
          await ctx.goalService.reorderGoals("nonexistent-id", "a1");
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

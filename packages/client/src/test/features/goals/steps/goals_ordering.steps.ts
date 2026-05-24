// implements FR6, FR10 of add-goals-specs
import type { FeatureDescriibeCallbackParams } from "@amiceli/vitest-cucumber";
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import type { TestContext } from "vitest";
import {
  createScenarioContext,
  expectGoalNeedsSync,
  expectGoalSortOrder,
  getGoal,
  seedGoalsWithOrder,
} from "@/test/helpers/bdd/goals/helpers";

const feature = await loadFeature("../goals_ordering.feature");

type Context = Record<string, never>;

describeFeature(feature, (f: FeatureDescriibeCallbackParams<Context>) => {
  const ctx = createScenarioContext();

  f.BeforeEachScenario(async () => {
    await ctx.reset();
  });

  // @add-goals-specs @FR6 @FR10
  f.Scenario(
    "Reorder assigns sequential sort_order",
    ({ Given, When, Then, And }) => {
      Given(
        "goals A with sort_order 0, B with sort_order 1, C with sort_order 2",
        async (_ctx: TestContext) => {
          await seedGoalsWithOrder(ctx.goalIds, ["A", "B", "C"]);
        },
      );

      When("user reorders goals to B, C, A", async (_ctx: TestContext) => {
        const goalB = await getGoal(ctx.goalIds, "B");
        const goalC = await getGoal(ctx.goalIds, "C");
        const goalA = await getGoal(ctx.goalIds, "A");
        await ctx.goalService.reorderGoals([goalB, goalC, goalA]);
      });

      Then("goal B has sort_order 0", async (_ctx: TestContext) => {
        await expectGoalSortOrder(ctx.goalIds, "B", 0);
      });

      And("goal C has sort_order 1", async (_ctx: TestContext) => {
        await expectGoalSortOrder(ctx.goalIds, "C", 1);
      });

      And("goal A has sort_order 2", async (_ctx: TestContext) => {
        await expectGoalSortOrder(ctx.goalIds, "A", 2);
      });
    },
  );

  // @add-goals-specs @FR6 @FR10
  f.Scenario(
    "Only changed goals marked for sync",
    ({ Given, When, Then, And }) => {
      Given(
        "goals A with sort_order 0, B with sort_order 1, C with sort_order 2",
        async (_ctx: TestContext) => {
          await seedGoalsWithOrder(ctx.goalIds, ["A", "B", "C"]);
        },
      );

      When("user reorders goals to A, C, B", async (_ctx: TestContext) => {
        const goalA = await getGoal(ctx.goalIds, "A");
        const goalC = await getGoal(ctx.goalIds, "C");
        const goalB = await getGoal(ctx.goalIds, "B");
        await ctx.goalService.reorderGoals([goalA, goalC, goalB]);
      });

      Then("goal A has needsSync false", async (_ctx: TestContext) => {
        await expectGoalNeedsSync(ctx.goalIds, "A", false);
      });

      And("goal C has needsSync true", async (_ctx: TestContext) => {
        await expectGoalNeedsSync(ctx.goalIds, "C", true);
      });

      And("goal B has needsSync true", async (_ctx: TestContext) => {
        await expectGoalNeedsSync(ctx.goalIds, "B", true);
      });
    },
  );

  // @add-goals-specs @FR6 @FR10
  f.Scenario("Empty reorder is no-op", ({ Given, When, Then, And }) => {
    Given(
      "goals A with sort_order 0, B with sort_order 1, C with sort_order 2",
      async (_ctx: TestContext) => {
        await seedGoalsWithOrder(ctx.goalIds, ["A", "B", "C"]);
      },
    );

    When("user reorders with empty array", async (_ctx: TestContext) => {
      await ctx.goalService.reorderGoals([]);
    });

    Then("goal A has needsSync false", async (_ctx: TestContext) => {
      await expectGoalNeedsSync(ctx.goalIds, "A", false);
    });

    And("goal B has needsSync false", async (_ctx: TestContext) => {
      await expectGoalNeedsSync(ctx.goalIds, "B", false);
    });

    And("goal C has needsSync false", async (_ctx: TestContext) => {
      await expectGoalNeedsSync(ctx.goalIds, "C", false);
    });
  });

  // @add-goals-specs @FR6 @FR10
  f.Scenario("Same order is no-op", ({ Given, When, Then, And }) => {
    Given(
      "goals A with sort_order 0, B with sort_order 1",
      async (_ctx: TestContext) => {
        await seedGoalsWithOrder(ctx.goalIds, ["A", "B"]);
      },
    );

    When("user reorders goals to A, B", async (_ctx: TestContext) => {
      const goalA = await getGoal(ctx.goalIds, "A");
      const goalB = await getGoal(ctx.goalIds, "B");
      await ctx.goalService.reorderGoals([goalA, goalB]);
    });

    Then("goal A has needsSync false", async (_ctx: TestContext) => {
      await expectGoalNeedsSync(ctx.goalIds, "A", false);
    });

    And("goal B has needsSync false", async (_ctx: TestContext) => {
      await expectGoalNeedsSync(ctx.goalIds, "B", false);
    });
  });
});

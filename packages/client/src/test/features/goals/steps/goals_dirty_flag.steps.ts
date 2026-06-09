// implements FR9, FR10 of add-goals-specs
import type { FeatureDescriibeCallbackParams } from "@amiceli/vitest-cucumber";
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import { expect, type TestContext } from "vitest";
import { db } from "@/db/database";
import { generateKeyBetween } from "@/services/SortOrderService";
import {
  createScenarioContext,
  getGoal,
  seedGoal,
  seedGoalsWithOrder,
} from "@/test/helpers/bdd/goals/helpers";
import { getIdOrThrow } from "@/test/helpers/getIdOrThrow";

const feature = await loadFeature("../goals_dirty_flag.feature");

type Context = Record<string, never>;

describeFeature(feature, (f: FeatureDescriibeCallbackParams<Context>) => {
  const ctx = createScenarioContext();

  f.BeforeEachScenario(async () => {
    await ctx.reset();
  });

  // @add-goals-specs @FR9
  f.Scenario(
    "No-op update does not trigger sync",
    ({ Given, When, Then, And }) => {
      let originalUpdatedAt: string;

      Given(
        'goal "Learn Rust" exists with needsSync false',
        async (_ctx: TestContext) => {
          await seedGoal(ctx.goalIds, "Learn Rust", {
            name: "Learn Rust",
            needsSync: false,
          });
          const existingGoal = await getGoal(ctx.goalIds, "Learn Rust");
          originalUpdatedAt = existingGoal.updated_at;
        },
      );

      When(
        'user updates goal name to "Learn Rust"',
        async (_ctx: TestContext) => {
          await ctx.goalService.update(
            getIdOrThrow(ctx.goalIds, "Learn Rust"),
            { name: "Learn Rust" },
          );
        },
      );

      Then("goal needsSync remains false", async (_ctx: TestContext) => {
        const goal = await db.goals.get(
          getIdOrThrow(ctx.goalIds, "Learn Rust"),
        );
        expect(goal?.needsSync).toBe(false);
      });

      And("goal updated_at is unchanged", async (_ctx: TestContext) => {
        const goal = await db.goals.get(
          getIdOrThrow(ctx.goalIds, "Learn Rust"),
        );
        expect(goal?.updated_at).toBe(originalUpdatedAt);
      });
    },
  );

  // @add-goals-specs @FR10
  f.Scenario(
    "Reorder marks only moved goal for sync",
    ({ Given, When, Then, And }) => {
      Given(
        "goals A, B, C with ascending sort_order",
        async (_ctx: TestContext) => {
          await seedGoalsWithOrder(ctx.goalIds, ["A", "B", "C"]);
        },
      );

      When("user moves goal C between A and B", async (_ctx: TestContext) => {
        const goalA = await getGoal(ctx.goalIds, "A");
        const goalB = await getGoal(ctx.goalIds, "B");
        const goalC = await getGoal(ctx.goalIds, "C");
        const newKey = generateKeyBetween(
          String(goalA.sort_order),
          String(goalB.sort_order),
        );
        await ctx.goalService.reorderGoals(goalC.id, newKey);
      });

      Then("goal A has needsSync false", async (_ctx: TestContext) => {
        const goalA = await db.goals.get(getIdOrThrow(ctx.goalIds, "A"));
        expect(goalA?.needsSync).toBe(false);
      });

      And("goal B has needsSync false", async (_ctx: TestContext) => {
        const goalB = await db.goals.get(getIdOrThrow(ctx.goalIds, "B"));
        expect(goalB?.needsSync).toBe(false);
      });

      And("goal C has needsSync true", async (_ctx: TestContext) => {
        const goalC = await db.goals.get(getIdOrThrow(ctx.goalIds, "C"));
        expect(goalC?.needsSync).toBe(true);
      });
    },
  );
});

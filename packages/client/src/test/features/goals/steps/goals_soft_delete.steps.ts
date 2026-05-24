// implements FR4, FR5 of add-goals-specs
import type { FeatureDescriibeCallbackParams } from "@amiceli/vitest-cucumber";
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import { expect, type TestContext } from "vitest";
import { db } from "@/db/database";
import {
  createScenarioContext,
  seedGoal,
} from "@/test/helpers/bdd/goals/helpers";
import { getIdOrThrow } from "@/test/helpers/getIdOrThrow";
import type { Goal } from "@/types/entities";

const feature = await loadFeature("../goals_soft_delete.feature");

type Context = Record<string, never>;

describeFeature(feature, (f: FeatureDescriibeCallbackParams<Context>) => {
  const ctx = createScenarioContext();

  f.BeforeEachScenario(async () => {
    await ctx.reset();
  });

  // @add-goals-specs @FR4
  f.Scenario("Soft-delete a goal", ({ Given, When, Then, And }) => {
    Given('active goal "Learn Rust" exists', async (_ctx: TestContext) => {
      await seedGoal(ctx.goalIds, "Learn Rust");
    });

    When('user soft-deletes goal "Learn Rust"', async (_ctx: TestContext) => {
      const goalId = getIdOrThrow(ctx.goalIds, "Learn Rust");
      await ctx.goalService.softDelete(goalId);
    });

    Then('goal "Learn Rust" has is_deleted true', async (_ctx: TestContext) => {
      const goalId = getIdOrThrow(ctx.goalIds, "Learn Rust");
      const persistedGoal = await db.goals.get(goalId);
      expect(persistedGoal?.is_deleted).toBe(true);
    });

    And('goal "Learn Rust" has needsSync true', async (_ctx: TestContext) => {
      const goalId = getIdOrThrow(ctx.goalIds, "Learn Rust");
      const persistedGoal = await db.goals.get(goalId);
      expect(persistedGoal?.needsSync).toBe(true);
    });
  });

  // @add-goals-specs @FR5
  f.Scenario("Restore a soft-deleted goal", ({ Given, When, Then, And }) => {
    Given(
      'soft-deleted goal "Learn Rust" exists',
      async (_ctx: TestContext) => {
        await seedGoal(ctx.goalIds, "Learn Rust", { is_deleted: true });
      },
    );

    When('user restores goal "Learn Rust"', async (_ctx: TestContext) => {
      const goalId = getIdOrThrow(ctx.goalIds, "Learn Rust");
      await ctx.goalService.restore(goalId);
    });

    Then(
      'goal "Learn Rust" has is_deleted false',
      async (_ctx: TestContext) => {
        const goalId = getIdOrThrow(ctx.goalIds, "Learn Rust");
        const persistedGoal = await db.goals.get(goalId);
        expect(persistedGoal?.is_deleted).toBe(false);
      },
    );

    And('goal "Learn Rust" has needsSync true', async (_ctx: TestContext) => {
      const goalId = getIdOrThrow(ctx.goalIds, "Learn Rust");
      const persistedGoal = await db.goals.get(goalId);
      expect(persistedGoal?.needsSync).toBe(true);
    });
  });

  // @add-goals-specs @FR4 @FR2
  f.Scenario(
    "Soft-deleted goal excluded from active list",
    ({ Given, When, Then }) => {
      let returnedGoals: Goal[];

      Given(
        'active goal "Learn Rust" is soft-deleted',
        async (_ctx: TestContext) => {
          await seedGoal(ctx.goalIds, "Learn Rust", { is_deleted: true });
        },
      );

      When("user views goal list", async (_ctx: TestContext) => {
        returnedGoals = await ctx.goalService.getAll();
      });

      Then(
        '"Learn Rust" does not appear in the list',
        async (_ctx: TestContext) => {
          const goalNames = returnedGoals.map((goal) => goal.name);
          expect(goalNames).not.toContain("Learn Rust");
        },
      );
    },
  );
});

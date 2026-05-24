// implements FR8 of add-goals-specs
import type { FeatureDescriibeCallbackParams } from "@amiceli/vitest-cucumber";
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import { expect, type TestContext } from "vitest";
import {
  createScenarioContext,
  getGoal,
  seedGoal,
} from "@/test/helpers/bdd/goals/helpers";
import { getIdOrThrow } from "@/test/helpers/getIdOrThrow";
import type { GoalStatus } from "@/types/common";
import type { Goal } from "@/types/entities";

const feature = await loadFeature("../goals_status.feature");

type Context = Record<string, never>;

const GOAL_NAME = "Test Goal";

function defineStatusTransitionSteps(
  ctx: ReturnType<typeof createScenarioContext>,
  steps: {
    When: (...args: never) => unknown;
    Then: (...args: never) => unknown;
    And: (...args: never) => unknown;
  },
  targetStatus: GoalStatus,
) {
  let updatedGoal: Goal;

  steps.When(
    `user updates goal status to "${targetStatus}"`,
    async (_ctx: TestContext) => {
      updatedGoal = await ctx.goalService.updateStatus(
        getIdOrThrow(ctx.goalIds, GOAL_NAME),
        targetStatus,
      );
    },
  );

  steps.Then(`goal has status "${targetStatus}"`, async (_ctx: TestContext) => {
    expect(updatedGoal.status).toBe(targetStatus);
  });

  steps.And("goal has needsSync true", async (_ctx: TestContext) => {
    expect(updatedGoal.needsSync).toBe(true);
  });

  return { getUpdatedGoal: () => updatedGoal };
}

describeFeature(feature, (f: FeatureDescriibeCallbackParams<Context>) => {
  const ctx = createScenarioContext();

  f.BeforeEachScenario(async () => {
    await ctx.reset();
  });

  // @add-goals-specs @FR8
  f.Scenario(
    "Change status from planning to in_progress",
    ({ Given, When, Then, And }) => {
      let originalUpdatedAt: string;

      Given('goal with status "planning" exists', async (_ctx: TestContext) => {
        await seedGoal(ctx.goalIds, GOAL_NAME, {
          status: "planning",
          updated_at: "2025-01-01T00:00:00.000Z",
        });
        const goal = await getGoal(ctx.goalIds, GOAL_NAME);
        originalUpdatedAt = goal.updated_at;
      });

      const { getUpdatedGoal } = defineStatusTransitionSteps(
        ctx,
        { When, Then, And },
        "in_progress",
      );

      And("goal updated_at is refreshed", async (_ctx: TestContext) => {
        expect(getUpdatedGoal().updated_at).not.toBe(originalUpdatedAt);
      });
    },
  );

  // @add-goals-specs @FR8
  f.Scenario(
    "Change status from completed back to in_progress",
    ({ Given, When, Then, And }) => {
      Given(
        'goal with status "completed" exists',
        async (_ctx: TestContext) => {
          await seedGoal(ctx.goalIds, GOAL_NAME, { status: "completed" });
        },
      );

      defineStatusTransitionSteps(ctx, { When, Then, And }, "in_progress");
    },
  );

  // @add-goals-specs @FR8
  f.Scenario(
    "Change status from cancelled to planning",
    ({ Given, When, Then, And }) => {
      Given(
        'goal with status "cancelled" exists',
        async (_ctx: TestContext) => {
          await seedGoal(ctx.goalIds, GOAL_NAME, { status: "cancelled" });
        },
      );

      defineStatusTransitionSteps(ctx, { When, Then, And }, "planning");
    },
  );

  // @add-goals-specs @FR8
  f.Scenario("No-op status update", ({ Given, When, Then, And }) => {
    let originalUpdatedAt: string;

    Given(
      'goal with status "in_progress" and needsSync false exists',
      async (_ctx: TestContext) => {
        await seedGoal(ctx.goalIds, GOAL_NAME, {
          status: "in_progress",
          needsSync: false,
        });
        const goal = await getGoal(ctx.goalIds, GOAL_NAME);
        originalUpdatedAt = goal.updated_at;
      },
    );

    When(
      'user updates goal status to "in_progress"',
      async (_ctx: TestContext) => {
        await ctx.goalService.updateStatus(
          getIdOrThrow(ctx.goalIds, GOAL_NAME),
          "in_progress",
        );
      },
    );

    Then("goal needsSync remains false", async (_ctx: TestContext) => {
      const goal = await getGoal(ctx.goalIds, GOAL_NAME);
      expect(goal.needsSync).toBe(false);
    });

    And("goal updated_at is unchanged", async (_ctx: TestContext) => {
      const goal = await getGoal(ctx.goalIds, GOAL_NAME);
      expect(goal.updated_at).toBe(originalUpdatedAt);
    });
  });
});

// implements FR11 of add-goals-specs
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

const feature = await loadFeature("../goals_cover.feature");

type Context = Record<string, never>;

describeFeature(feature, (f: FeatureDescriibeCallbackParams<Context>) => {
  const ctx = createScenarioContext();

  f.BeforeEachScenario(async () => {
    await ctx.reset();
  });

  // @add-goals-specs @FR11
  f.Scenario("Set goal cover", ({ Given, When, Then, And }) => {
    let updatedGoal: Goal;

    Given('goal with cover_hash "" exists', async (_ctx: TestContext) => {
      await seedGoal(ctx.goalIds, "Test Goal", { cover_hash: "" });
    });

    When(
      'user updates goal cover_hash to "abc123def456"',
      async (_ctx: TestContext) => {
        updatedGoal = await ctx.goalService.update(
          getIdOrThrow(ctx.goalIds, "Test Goal"),
          { cover_hash: "abc123def456" },
        );
      },
    );

    Then('goal has cover_hash "abc123def456"', async (_ctx: TestContext) => {
      expect(updatedGoal.cover_hash).toBe("abc123def456");
    });

    And('goal has syncStatus "pending"', async (_ctx: TestContext) => {
      expect(updatedGoal.syncStatus).toBe("pending");
    });
  });

  // @add-goals-specs @FR11
  f.Scenario("Remove goal cover", ({ Given, When, Then, And }) => {
    let updatedGoal: Goal;

    Given(
      'goal with cover_hash "abc123def456" exists',
      async (_ctx: TestContext) => {
        await seedGoal(ctx.goalIds, "Test Goal", {
          cover_hash: "abc123def456",
        });
      },
    );

    When('user updates goal cover_hash to ""', async (_ctx: TestContext) => {
      updatedGoal = await ctx.goalService.update(
        getIdOrThrow(ctx.goalIds, "Test Goal"),
        { cover_hash: "" },
      );
    });

    Then('goal has cover_hash ""', async (_ctx: TestContext) => {
      expect(updatedGoal.cover_hash).toBe("");
    });

    And('goal has syncStatus "pending"', async (_ctx: TestContext) => {
      expect(updatedGoal.syncStatus).toBe("pending");
    });
  });

  // @add-goals-specs @FR11
  f.Scenario("Replace goal cover", ({ Given, When, Then, And }) => {
    let updatedGoal: Goal;

    Given(
      'goal with cover_hash "old_hash" exists',
      async (_ctx: TestContext) => {
        await seedGoal(ctx.goalIds, "Test Goal", { cover_hash: "old_hash" });
      },
    );

    When(
      'user updates goal cover_hash to "new_hash"',
      async (_ctx: TestContext) => {
        updatedGoal = await ctx.goalService.update(
          getIdOrThrow(ctx.goalIds, "Test Goal"),
          { cover_hash: "new_hash" },
        );
      },
    );

    Then('goal has cover_hash "new_hash"', async (_ctx: TestContext) => {
      expect(updatedGoal.cover_hash).toBe("new_hash");
    });

    And('goal has syncStatus "pending"', async (_ctx: TestContext) => {
      expect(updatedGoal.syncStatus).toBe("pending");
    });
  });

  // @add-goals-specs @FR11
  f.Scenario("No-op cover update", ({ Given, When, Then, And }) => {
    let originalUpdatedAt: string;

    Given(
      'goal with cover_hash "abc123" and syncStatus "synced" exists',
      async (_ctx: TestContext) => {
        await seedGoal(ctx.goalIds, "Test Goal", {
          cover_hash: "abc123",
          syncStatus: "synced" as const,
        });
        const goal = await db.goals.get(getIdOrThrow(ctx.goalIds, "Test Goal"));
        expect(goal).toBeDefined();
        originalUpdatedAt = goal?.updated_at ?? "";
      },
    );

    When(
      'user updates goal cover_hash to "abc123"',
      async (_ctx: TestContext) => {
        await ctx.goalService.update(getIdOrThrow(ctx.goalIds, "Test Goal"), {
          cover_hash: "abc123",
        });
      },
    );

    Then('goal syncStatus remains "synced"', async (_ctx: TestContext) => {
      const goal = await db.goals.get(getIdOrThrow(ctx.goalIds, "Test Goal"));
      expect(goal?.syncStatus).toBe("synced");
    });

    And("goal updated_at is unchanged", async (_ctx: TestContext) => {
      const goal = await db.goals.get(getIdOrThrow(ctx.goalIds, "Test Goal"));
      expect(goal?.updated_at).toBe(originalUpdatedAt);
    });
  });
});

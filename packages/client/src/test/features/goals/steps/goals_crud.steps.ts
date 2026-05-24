// implements FR1, FR2, FR3 of add-goals-specs
import type { FeatureDescriibeCallbackParams } from "@amiceli/vitest-cucumber";
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import { expect, type TestContext } from "vitest";
import { db } from "@/db/database";
import {
  createScenarioContext,
  getGoal,
  seedGoal,
} from "@/test/helpers/bdd/goals/helpers";
import { getIdOrThrow } from "@/test/helpers/getIdOrThrow";
import type { Goal } from "@/types/entities";

const feature = await loadFeature("../goals_crud.feature");

const UUID_V4_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const ISO_TIMESTAMP_REGEX = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;

type Context = Record<string, never>;

describeFeature(feature, (f: FeatureDescriibeCallbackParams<Context>) => {
  const ctx = createScenarioContext();

  f.BeforeEachScenario(async () => {
    await ctx.reset();
  });

  // @add-goals-specs @FR1
  f.Scenario("Create goal with name only", ({ When, Then, And }) => {
    let createdGoal: Goal;

    When('user creates goal "Learn Rust"', async (_ctx: TestContext) => {
      createdGoal = await ctx.goalService.create({ name: "Learn Rust" });
    });

    Then(
      'goal is persisted with name "Learn Rust"',
      async (_ctx: TestContext) => {
        const persistedGoal = await db.goals.get(createdGoal.id);
        expect(persistedGoal?.name).toBe("Learn Rust");
      },
    );

    And('goal has description ""', async (_ctx: TestContext) => {
      expect(createdGoal.description).toBe("");
    });

    And('goal has cover_hash ""', async (_ctx: TestContext) => {
      expect(createdGoal.cover_hash).toBe("");
    });

    And('goal has status "planning"', async (_ctx: TestContext) => {
      expect(createdGoal.status).toBe("planning");
    });

    And("goal has revision 0", async (_ctx: TestContext) => {
      expect(createdGoal.revision).toBe(0);
    });

    And("goal has needsSync true", async (_ctx: TestContext) => {
      expect(createdGoal.needsSync).toBe(true);
    });

    And("goal has is_deleted false", async (_ctx: TestContext) => {
      expect(createdGoal.is_deleted).toBe(false);
    });
  });

  // @add-goals-specs @FR1
  f.Scenario("Create goal with name and description", ({ When, Then, And }) => {
    let createdGoal: Goal;

    When(
      'user creates goal "Learn Rust" with description "Systems programming"',
      async (_ctx: TestContext) => {
        createdGoal = await ctx.goalService.create({
          name: "Learn Rust",
          description: "Systems programming",
        });
      },
    );

    Then(
      'goal is persisted with name "Learn Rust"',
      async (_ctx: TestContext) => {
        expect(createdGoal.name).toBe("Learn Rust");
      },
    );

    And(
      'goal has description "Systems programming"',
      async (_ctx: TestContext) => {
        expect(createdGoal.description).toBe("Systems programming");
      },
    );
  });

  // @add-goals-specs @FR1
  f.Scenario("Create goal with explicit status", ({ When, Then }) => {
    let createdGoal: Goal;

    When(
      'user creates goal "Active project" with status "in_progress"',
      async (_ctx: TestContext) => {
        createdGoal = await ctx.goalService.create({
          name: "Active project",
          status: "in_progress",
        });
      },
    );

    Then('goal has status "in_progress"', async (_ctx: TestContext) => {
      expect(createdGoal.status).toBe("in_progress");
    });
  });

  // @add-goals-specs @FR1
  f.Scenario("Sort order defaults to end of list", ({ Given, When, Then }) => {
    let createdGoal: Goal;

    Given("3 active goals exist", async (_ctx: TestContext) => {
      await seedGoal(ctx.goalIds, "Goal A", { sort_order: 0 });
      await seedGoal(ctx.goalIds, "Goal B", { sort_order: 1 });
      await seedGoal(ctx.goalIds, "Goal C", { sort_order: 2 });
    });

    When('user creates goal "New Goal"', async (_ctx: TestContext) => {
      createdGoal = await ctx.goalService.create({ name: "New Goal" });
    });

    Then("goal has sort_order 3", async (_ctx: TestContext) => {
      expect(createdGoal.sort_order).toBe(3);
    });
  });

  // @add-goals-specs @FR1
  f.Scenario("UUID generated client-side", ({ When, Then }) => {
    let createdGoal: Goal;

    When('user creates goal "Learn Rust"', async (_ctx: TestContext) => {
      createdGoal = await ctx.goalService.create({ name: "Learn Rust" });
    });

    Then("goal id is valid UUID v4", async (_ctx: TestContext) => {
      expect(createdGoal.id).toMatch(UUID_V4_REGEX);
    });
  });

  // @add-goals-specs @FR1
  f.Scenario("Timestamps set on creation", ({ When, Then, And }) => {
    let createdGoal: Goal;

    When('user creates goal "Learn Rust"', async (_ctx: TestContext) => {
      createdGoal = await ctx.goalService.create({ name: "Learn Rust" });
    });

    Then(
      "goal created_at and updated_at are equal",
      async (_ctx: TestContext) => {
        expect(createdGoal.created_at).toBe(createdGoal.updated_at);
      },
    );

    And(
      "goal timestamps are ISO 8601 with Z suffix",
      async (_ctx: TestContext) => {
        expect(createdGoal.created_at).toMatch(ISO_TIMESTAMP_REGEX);
        expect(createdGoal.updated_at).toMatch(ISO_TIMESTAMP_REGEX);
      },
    );
  });

  // @add-goals-specs @FR2
  f.Scenario("List sorted by sort_order", ({ Given, When, Then }) => {
    let returnedGoals: Goal[];

    Given("goals with sort_order 2, 0, 1", async (_ctx: TestContext) => {
      await seedGoal(ctx.goalIds, "Goal A", { sort_order: 2 });
      await seedGoal(ctx.goalIds, "Goal B", { sort_order: 0 });
      await seedGoal(ctx.goalIds, "Goal C", { sort_order: 1 });
    });

    When("user requests all goals", async (_ctx: TestContext) => {
      returnedGoals = await ctx.goalService.getAll();
    });

    Then("goals are returned in order 0, 1, 2", async (_ctx: TestContext) => {
      const sortOrders = returnedGoals.map((goal) => goal.sort_order);
      expect(sortOrders).toEqual([0, 1, 2]);
    });
  });

  // @add-goals-specs @FR2
  f.Scenario("Empty list", ({ Given, When, Then }) => {
    let returnedGoals: Goal[];

    Given("no goals exist", async (_ctx: TestContext) => {
      // DB is already cleared in BeforeEachScenario
    });

    When("user requests all goals", async (_ctx: TestContext) => {
      returnedGoals = await ctx.goalService.getAll();
    });

    Then("empty array is returned", async (_ctx: TestContext) => {
      expect(returnedGoals).toEqual([]);
    });
  });

  // @add-goals-specs @FR2
  f.Scenario("Soft-deleted goals excluded", ({ Given, When, Then }) => {
    let returnedGoals: Goal[];

    Given("2 active and 1 deleted goals", async (_ctx: TestContext) => {
      await seedGoal(ctx.goalIds, "Active A", { is_deleted: false });
      await seedGoal(ctx.goalIds, "Active B", { is_deleted: false });
      await seedGoal(ctx.goalIds, "Deleted C", { is_deleted: true });
    });

    When("user requests all goals", async (_ctx: TestContext) => {
      returnedGoals = await ctx.goalService.getAll();
    });

    Then("only 2 goals are returned", async (_ctx: TestContext) => {
      expect(returnedGoals).toHaveLength(2);
    });
  });

  // @add-goals-specs @FR3
  f.Scenario("Update goal name", ({ Given, When, Then, And }) => {
    let updatedGoal: Goal;
    let originalUpdatedAt: string;

    Given('goal "Learn Rust" exists', async (_ctx: TestContext) => {
      await seedGoal(ctx.goalIds, "Learn Rust", {
        updated_at: "2025-01-01T00:00:00.000Z",
      });
      const existingGoal = await getGoal(ctx.goalIds, "Learn Rust");
      originalUpdatedAt = existingGoal.updated_at;
    });

    When('user updates goal name to "Learn Go"', async (_ctx: TestContext) => {
      updatedGoal = await ctx.goalService.update(
        getIdOrThrow(ctx.goalIds, "Learn Rust"),
        { name: "Learn Go" },
      );
    });

    Then('goal name is "Learn Go"', async (_ctx: TestContext) => {
      expect(updatedGoal.name).toBe("Learn Go");
    });

    And("goal has needsSync true", async (_ctx: TestContext) => {
      expect(updatedGoal.needsSync).toBe(true);
    });

    And("goal updated_at is refreshed", async (_ctx: TestContext) => {
      expect(updatedGoal.updated_at).not.toBe(originalUpdatedAt);
    });
  });

  // @add-goals-specs @FR3
  f.Scenario("Update goal description", ({ Given, When, Then, And }) => {
    let updatedGoal: Goal;

    Given('goal with description "Old" exists', async (_ctx: TestContext) => {
      await seedGoal(ctx.goalIds, "Test Goal", { description: "Old" });
    });

    When(
      'user updates goal description to "New"',
      async (_ctx: TestContext) => {
        updatedGoal = await ctx.goalService.update(
          getIdOrThrow(ctx.goalIds, "Test Goal"),
          { description: "New" },
        );
      },
    );

    Then('goal description is "New"', async (_ctx: TestContext) => {
      expect(updatedGoal.description).toBe("New");
    });

    And("goal has needsSync true", async (_ctx: TestContext) => {
      expect(updatedGoal.needsSync).toBe(true);
    });
  });

  // @add-goals-specs @FR3
  f.Scenario("Update nonexistent goal throws error", ({ When, Then }) => {
    const nonexistentId = crypto.randomUUID();
    let thrownError: Error;

    When("user updates nonexistent goal", async (_ctx: TestContext) => {
      try {
        await ctx.goalService.update(nonexistentId, { name: "New Name" });
      } catch (error) {
        thrownError = error as Error;
      }
    });

    Then('error "Goal not found" is thrown', async (_ctx: TestContext) => {
      expect(thrownError).toBeDefined();
      expect(thrownError.message).toContain("Goal not found");
    });
  });
});

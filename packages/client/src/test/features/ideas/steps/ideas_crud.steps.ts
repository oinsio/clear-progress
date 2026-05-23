// implements FR1, FR2, FR3, FR8 of add-ideas-specs
import type { FeatureDescriibeCallbackParams } from "@amiceli/vitest-cucumber";
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import { expect, type TestContext } from "vitest";
import { db } from "@/db/database";
import { getIdOrThrow } from "@/test/helpers/getIdOrThrow";
import type { Idea } from "@/types/entities";
import {
  createScenarioContext,
  getIdea,
  seedIdea,
} from "./ideas_steps.helpers";

const feature = await loadFeature("../ideas_crud.feature");

const UUID_V4_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const ISO_TIMESTAMP_REGEX = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;

type Context = Record<string, never>;

describeFeature(feature, (f: FeatureDescriibeCallbackParams<Context>) => {
  const ctx = createScenarioContext();

  f.BeforeEachScenario(async () => {
    await ctx.reset();
  });

  // @add-ideas-specs @FR1 @FR8
  f.Scenario("Create idea with name only", ({ When, Then, And }) => {
    let createdIdea: Idea;

    When('user creates idea "Learn Rust"', async (_ctx: TestContext) => {
      createdIdea = await ctx.ideaService.create({ name: "Learn Rust" });
    });

    Then(
      'idea is persisted with name "Learn Rust"',
      async (_ctx: TestContext) => {
        const persistedIdea = await db.ideas.get(createdIdea.id);
        expect(persistedIdea?.name).toBe("Learn Rust");
      },
    );

    And('idea has description ""', async (_ctx: TestContext) => {
      expect(createdIdea.description).toBe("");
    });

    And("idea has revision 0", async (_ctx: TestContext) => {
      expect(createdIdea.revision).toBe(0);
    });

    And("idea has needsSync true", async (_ctx: TestContext) => {
      expect(createdIdea.needsSync).toBe(true);
    });

    And("idea has is_deleted false", async (_ctx: TestContext) => {
      expect(createdIdea.is_deleted).toBe(false);
    });
  });

  // @add-ideas-specs @FR1 @FR8
  f.Scenario("Create idea with name and description", ({ When, Then, And }) => {
    let createdIdea: Idea;

    When(
      'user creates idea "Learn Rust" with description "Systems programming"',
      async (_ctx: TestContext) => {
        createdIdea = await ctx.ideaService.create({
          name: "Learn Rust",
          description: "Systems programming",
        });
      },
    );

    Then(
      'idea is persisted with name "Learn Rust"',
      async (_ctx: TestContext) => {
        expect(createdIdea.name).toBe("Learn Rust");
      },
    );

    And(
      'idea has description "Systems programming"',
      async (_ctx: TestContext) => {
        expect(createdIdea.description).toBe("Systems programming");
      },
    );
  });

  // @add-ideas-specs @FR1 @FR8
  f.Scenario("Sort order defaults to end of list", ({ Given, When, Then }) => {
    let createdIdea: Idea;

    Given("3 active ideas exist", async (_ctx: TestContext) => {
      await seedIdea(ctx.ideaIds, "Idea A", { sort_order: 0 });
      await seedIdea(ctx.ideaIds, "Idea B", { sort_order: 1 });
      await seedIdea(ctx.ideaIds, "Idea C", { sort_order: 2 });
    });

    When('user creates idea "New Idea"', async (_ctx: TestContext) => {
      createdIdea = await ctx.ideaService.create({ name: "New Idea" });
    });

    Then("idea has sort_order 3", async (_ctx: TestContext) => {
      expect(createdIdea.sort_order).toBe(3);
    });
  });

  // @add-ideas-specs @FR1 @FR8
  f.Scenario("UUID generated client-side", ({ When, Then }) => {
    let createdIdea: Idea;

    When('user creates idea "Learn Rust"', async (_ctx: TestContext) => {
      createdIdea = await ctx.ideaService.create({ name: "Learn Rust" });
    });

    Then("idea id is valid UUID v4", async (_ctx: TestContext) => {
      expect(createdIdea.id).toMatch(UUID_V4_REGEX);
    });
  });

  // @add-ideas-specs @FR1 @FR8
  f.Scenario("Timestamps set on creation", ({ When, Then, And }) => {
    let createdIdea: Idea;

    When('user creates idea "Learn Rust"', async (_ctx: TestContext) => {
      createdIdea = await ctx.ideaService.create({ name: "Learn Rust" });
    });

    Then(
      "idea created_at and updated_at are equal",
      async (_ctx: TestContext) => {
        expect(createdIdea.created_at).toBe(createdIdea.updated_at);
      },
    );

    And(
      "idea timestamps are ISO 8601 with Z suffix",
      async (_ctx: TestContext) => {
        expect(createdIdea.created_at).toMatch(ISO_TIMESTAMP_REGEX);
        expect(createdIdea.updated_at).toMatch(ISO_TIMESTAMP_REGEX);
      },
    );
  });

  // @add-ideas-specs @FR2
  f.Scenario("List sorted by sort_order", ({ Given, When, Then }) => {
    let returnedIdeas: Idea[];

    Given("ideas with sort_order 2, 0, 1", async (_ctx: TestContext) => {
      await seedIdea(ctx.ideaIds, "Idea A", { sort_order: 2 });
      await seedIdea(ctx.ideaIds, "Idea B", { sort_order: 0 });
      await seedIdea(ctx.ideaIds, "Idea C", { sort_order: 1 });
    });

    When("user requests all ideas", async (_ctx: TestContext) => {
      returnedIdeas = await ctx.ideaService.getAll();
    });

    Then("ideas are returned in order 0, 1, 2", async (_ctx: TestContext) => {
      const sortOrders = returnedIdeas.map((idea) => idea.sort_order);
      expect(sortOrders).toEqual([0, 1, 2]);
    });
  });

  // @add-ideas-specs @FR2
  f.Scenario("Empty list", ({ Given, When, Then }) => {
    let returnedIdeas: Idea[];

    Given("no ideas exist", async (_ctx: TestContext) => {
      // DB is already cleared in BeforeEachScenario
    });

    When("user requests all ideas", async (_ctx: TestContext) => {
      returnedIdeas = await ctx.ideaService.getAll();
    });

    Then("empty array is returned", async (_ctx: TestContext) => {
      expect(returnedIdeas).toEqual([]);
    });
  });

  // @add-ideas-specs @FR2
  f.Scenario("Soft-deleted ideas excluded", ({ Given, When, Then }) => {
    let returnedIdeas: Idea[];

    Given("2 active and 1 deleted ideas", async (_ctx: TestContext) => {
      await seedIdea(ctx.ideaIds, "Active A", { is_deleted: false });
      await seedIdea(ctx.ideaIds, "Active B", { is_deleted: false });
      await seedIdea(ctx.ideaIds, "Deleted C", { is_deleted: true });
    });

    When("user requests all ideas", async (_ctx: TestContext) => {
      returnedIdeas = await ctx.ideaService.getAll();
    });

    Then("only 2 ideas are returned", async (_ctx: TestContext) => {
      expect(returnedIdeas).toHaveLength(2);
    });
  });

  // @add-ideas-specs @FR3
  f.Scenario("Update idea name", ({ Given, When, Then, And }) => {
    let updatedIdea: Idea;
    let originalUpdatedAt: string;

    Given('idea "Learn Rust" exists', async (_ctx: TestContext) => {
      await seedIdea(ctx.ideaIds, "Learn Rust");
      const existingIdea = await getIdea(ctx.ideaIds, "Learn Rust");
      originalUpdatedAt = existingIdea.updated_at;
    });

    When('user updates idea name to "Learn Go"', async (_ctx: TestContext) => {
      updatedIdea = await ctx.ideaService.update(
        getIdOrThrow(ctx.ideaIds, "Learn Rust"),
        { name: "Learn Go" },
      );
    });

    Then('idea name is "Learn Go"', async (_ctx: TestContext) => {
      expect(updatedIdea.name).toBe("Learn Go");
    });

    And("idea has needsSync true", async (_ctx: TestContext) => {
      expect(updatedIdea.needsSync).toBe(true);
    });

    And("idea updated_at is refreshed", async (_ctx: TestContext) => {
      expect(updatedIdea.updated_at).not.toBe(originalUpdatedAt);
    });
  });

  // @add-ideas-specs @FR3
  f.Scenario("Update idea description", ({ Given, When, Then, And }) => {
    let updatedIdea: Idea;

    Given('idea with description "Old" exists', async (_ctx: TestContext) => {
      await seedIdea(ctx.ideaIds, "Test Idea", { description: "Old" });
    });

    When(
      'user updates idea description to "New"',
      async (_ctx: TestContext) => {
        updatedIdea = await ctx.ideaService.update(
          getIdOrThrow(ctx.ideaIds, "Test Idea"),
          { description: "New" },
        );
      },
    );

    Then('idea description is "New"', async (_ctx: TestContext) => {
      expect(updatedIdea.description).toBe("New");
    });

    And("idea has needsSync true", async (_ctx: TestContext) => {
      expect(updatedIdea.needsSync).toBe(true);
    });
  });

  // @add-ideas-specs @FR3
  f.Scenario("Update nonexistent idea throws error", ({ When, Then }) => {
    const nonexistentId = crypto.randomUUID();
    let thrownError: Error;

    When("user updates nonexistent idea", async (_ctx: TestContext) => {
      try {
        await ctx.ideaService.update(nonexistentId, { name: "New Name" });
      } catch (error) {
        thrownError = error as Error;
      }
    });

    Then('error "Idea not found" is thrown', async (_ctx: TestContext) => {
      expect(thrownError).toBeDefined();
      expect(thrownError.message).toContain("Idea not found");
    });
  });
});

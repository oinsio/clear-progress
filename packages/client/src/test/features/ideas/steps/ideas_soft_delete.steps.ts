// implements FR4, FR5 of add-ideas-specs
import type { FeatureDescriibeCallbackParams } from "@amiceli/vitest-cucumber";
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import { expect, type TestContext } from "vitest";
import { db } from "@/db/database";
import { getIdOrThrow } from "@/test/helpers/getIdOrThrow";
import type { Idea } from "@/types/entities";
import { createScenarioContext, seedIdea } from "./ideas_steps.helpers";

const feature = await loadFeature("../ideas_soft_delete.feature");

type Context = Record<string, never>;

describeFeature(feature, (f: FeatureDescriibeCallbackParams<Context>) => {
  const ctx = createScenarioContext();

  f.BeforeEachScenario(async () => {
    await ctx.reset();
  });

  // @add-ideas-specs @FR4
  f.Scenario("Soft-delete an idea", ({ Given, When, Then, And }) => {
    Given('active idea "Learn Rust" exists', async (_ctx: TestContext) => {
      await seedIdea(ctx.ideaIds, "Learn Rust");
    });

    When('user soft-deletes idea "Learn Rust"', async (_ctx: TestContext) => {
      const ideaId = getIdOrThrow(ctx.ideaIds, "Learn Rust");
      await ctx.ideaService.softDelete(ideaId);
    });

    Then('idea "Learn Rust" has is_deleted true', async (_ctx: TestContext) => {
      const ideaId = getIdOrThrow(ctx.ideaIds, "Learn Rust");
      const persistedIdea = await db.ideas.get(ideaId);
      expect(persistedIdea?.is_deleted).toBe(true);
    });

    And(
      'idea "Learn Rust" has syncStatus "pending"',
      async (_ctx: TestContext) => {
        const ideaId = getIdOrThrow(ctx.ideaIds, "Learn Rust");
        const persistedIdea = await db.ideas.get(ideaId);
        expect(persistedIdea?.syncStatus).toBe("pending");
      },
    );
  });

  // @add-ideas-specs @FR5
  f.Scenario("Restore a soft-deleted idea", ({ Given, When, Then, And }) => {
    Given(
      'soft-deleted idea "Learn Rust" exists',
      async (_ctx: TestContext) => {
        await seedIdea(ctx.ideaIds, "Learn Rust", { is_deleted: true });
      },
    );

    When('user restores idea "Learn Rust"', async (_ctx: TestContext) => {
      const ideaId = getIdOrThrow(ctx.ideaIds, "Learn Rust");
      await ctx.ideaService.restore(ideaId);
    });

    Then(
      'idea "Learn Rust" has is_deleted false',
      async (_ctx: TestContext) => {
        const ideaId = getIdOrThrow(ctx.ideaIds, "Learn Rust");
        const persistedIdea = await db.ideas.get(ideaId);
        expect(persistedIdea?.is_deleted).toBe(false);
      },
    );

    And(
      'idea "Learn Rust" has syncStatus "pending"',
      async (_ctx: TestContext) => {
        const ideaId = getIdOrThrow(ctx.ideaIds, "Learn Rust");
        const persistedIdea = await db.ideas.get(ideaId);
        expect(persistedIdea?.syncStatus).toBe("pending");
      },
    );
  });

  // @add-ideas-specs @FR4 @FR2
  f.Scenario(
    "Soft-deleted idea excluded from active list",
    ({ Given, When, Then }) => {
      let returnedIdeas: Idea[];

      Given(
        'active idea "Learn Rust" is soft-deleted',
        async (_ctx: TestContext) => {
          await seedIdea(ctx.ideaIds, "Learn Rust", { is_deleted: true });
        },
      );

      When("user views idea list", async (_ctx: TestContext) => {
        returnedIdeas = await ctx.ideaService.getAll();
      });

      Then(
        '"Learn Rust" does not appear in the list',
        async (_ctx: TestContext) => {
          const ideaNames = returnedIdeas.map((idea) => idea.name);
          expect(ideaNames).not.toContain("Learn Rust");
        },
      );
    },
  );
});

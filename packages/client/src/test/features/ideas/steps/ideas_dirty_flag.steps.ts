// implements FR9, FR10 of add-ideas-specs
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

const feature = await loadFeature("../ideas_dirty_flag.feature");

type Context = Record<string, never>;

describeFeature(feature, (f: FeatureDescriibeCallbackParams<Context>) => {
  const ctx = createScenarioContext();

  f.BeforeEachScenario(async () => {
    await ctx.reset();
  });

  // @add-ideas-specs @FR9
  f.Scenario(
    "No-op update does not trigger sync",
    ({ Given, When, Then, And }) => {
      let originalUpdatedAt: string;

      Given(
        'idea "Learn Rust" exists with needsSync false',
        async (_ctx: TestContext) => {
          await seedIdea(ctx.ideaIds, "Learn Rust", {
            name: "Learn Rust",
            needsSync: false,
          });
          const existingIdea = await getIdea(ctx.ideaIds, "Learn Rust");
          originalUpdatedAt = existingIdea.updated_at;
        },
      );

      When(
        'user updates idea name to "Learn Rust"',
        async (_ctx: TestContext) => {
          await ctx.ideaService.update(
            getIdOrThrow(ctx.ideaIds, "Learn Rust"),
            { name: "Learn Rust" },
          );
        },
      );

      Then("idea needsSync remains false", async (_ctx: TestContext) => {
        const idea = await db.ideas.get(
          getIdOrThrow(ctx.ideaIds, "Learn Rust"),
        );
        expect(idea?.needsSync).toBe(false);
      });

      And("idea updated_at is unchanged", async (_ctx: TestContext) => {
        const idea = await db.ideas.get(
          getIdOrThrow(ctx.ideaIds, "Learn Rust"),
        );
        expect(idea?.updated_at).toBe(originalUpdatedAt);
      });
    },
  );

  // @add-ideas-specs @FR10
  f.Scenario(
    "Reorder marks only changed ideas for sync",
    ({ Given, When, Then, And }) => {
      Given(
        "ideas A, B, C with sort_order 0, 1, 2",
        async (_ctx: TestContext) => {
          await seedIdea(ctx.ideaIds, "A", {
            sort_order: 0,
            needsSync: false,
          });
          await seedIdea(ctx.ideaIds, "B", {
            sort_order: 1,
            needsSync: false,
          });
          await seedIdea(ctx.ideaIds, "C", {
            sort_order: 2,
            needsSync: false,
          });
        },
      );

      When("user reorders to A, C, B", async (_ctx: TestContext) => {
        const ideaA = (await db.ideas.get(
          getIdOrThrow(ctx.ideaIds, "A"),
        )) as Idea;
        const ideaC = (await db.ideas.get(
          getIdOrThrow(ctx.ideaIds, "C"),
        )) as Idea;
        const ideaB = (await db.ideas.get(
          getIdOrThrow(ctx.ideaIds, "B"),
        )) as Idea;
        await ctx.ideaService.reorderIdeas([ideaA, ideaC, ideaB]);
      });

      Then("idea A has needsSync false", async (_ctx: TestContext) => {
        const ideaA = await db.ideas.get(getIdOrThrow(ctx.ideaIds, "A"));
        expect(ideaA?.needsSync).toBe(false);
      });

      And("idea C has needsSync true", async (_ctx: TestContext) => {
        const ideaC = await db.ideas.get(getIdOrThrow(ctx.ideaIds, "C"));
        expect(ideaC?.needsSync).toBe(true);
      });

      And("idea B has needsSync true", async (_ctx: TestContext) => {
        const ideaB = await db.ideas.get(getIdOrThrow(ctx.ideaIds, "B"));
        expect(ideaB?.needsSync).toBe(true);
      });
    },
  );
});

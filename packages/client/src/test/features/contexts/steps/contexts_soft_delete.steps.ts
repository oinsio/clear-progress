// implements FR4, FR5 of add-context-category-specs
import type { FeatureDescriibeCallbackParams } from "@amiceli/vitest-cucumber";
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import { expect, type TestContext } from "vitest";
import { db } from "@/db/database";
import { getIdOrThrow } from "@/test/helpers/getIdOrThrow";
import type { Context as ContextEntity } from "@/types/entities";
import { createScenarioContext, seedContext } from "./contexts_steps.helpers";

const feature = await loadFeature("../contexts_soft_delete.feature");

type FeatureContext = Record<string, never>;

describeFeature(
  feature,
  (f: FeatureDescriibeCallbackParams<FeatureContext>) => {
    const ctx = createScenarioContext();

    f.BeforeEachScenario(async () => {
      await ctx.reset();
    });

    // @add-context-category-specs @FR4
    f.Scenario("Soft-delete a context", ({ Given, When, Then, And }) => {
      Given('active context "@home" exists', async (_ctx: TestContext) => {
        await seedContext(ctx.contextIds, "@home");
      });

      When('user soft-deletes context "@home"', async (_ctx: TestContext) => {
        const contextId = getIdOrThrow(ctx.contextIds, "@home");
        await ctx.contextService.softDelete(contextId);
      });

      Then('context "@home" has is_deleted true', async (_ctx: TestContext) => {
        const contextId = getIdOrThrow(ctx.contextIds, "@home");
        const persistedContext = await db.contexts.get(contextId);
        expect(persistedContext?.is_deleted).toBe(true);
      });

      And('context "@home" has needsSync true', async (_ctx: TestContext) => {
        const contextId = getIdOrThrow(ctx.contextIds, "@home");
        const persistedContext = await db.contexts.get(contextId);
        expect(persistedContext?.needsSync).toBe(true);
      });
    });

    // @add-context-category-specs @FR5
    f.Scenario(
      "Restore a soft-deleted context",
      ({ Given, When, Then, And }) => {
        Given(
          'soft-deleted context "@home" exists',
          async (_ctx: TestContext) => {
            await seedContext(ctx.contextIds, "@home", { is_deleted: true });
          },
        );

        When('user restores context "@home"', async (_ctx: TestContext) => {
          const contextId = getIdOrThrow(ctx.contextIds, "@home");
          await ctx.contextService.restore(contextId);
        });

        Then(
          'context "@home" has is_deleted false',
          async (_ctx: TestContext) => {
            const contextId = getIdOrThrow(ctx.contextIds, "@home");
            const persistedContext = await db.contexts.get(contextId);
            expect(persistedContext?.is_deleted).toBe(false);
          },
        );

        And('context "@home" has needsSync true', async (_ctx: TestContext) => {
          const contextId = getIdOrThrow(ctx.contextIds, "@home");
          const persistedContext = await db.contexts.get(contextId);
          expect(persistedContext?.needsSync).toBe(true);
        });
      },
    );

    // @add-context-category-specs @FR4 @FR2
    f.Scenario(
      "Soft-deleted context excluded from active list",
      ({ Given, When, Then }) => {
        let returnedContexts: ContextEntity[];

        Given(
          'active context "@home" is soft-deleted',
          async (_ctx: TestContext) => {
            await seedContext(ctx.contextIds, "@home", { is_deleted: true });
          },
        );

        When("user views context list", async (_ctx: TestContext) => {
          returnedContexts = await ctx.contextService.getAll();
        });

        Then(
          '"@home" does not appear in the list',
          async (_ctx: TestContext) => {
            const contextNames = returnedContexts.map(
              (context) => context.name,
            );
            expect(contextNames).not.toContain("@home");
          },
        );
      },
    );
  },
);

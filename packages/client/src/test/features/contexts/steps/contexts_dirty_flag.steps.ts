// implements FR3 of add-context-category-specs
import type { FeatureDescriibeCallbackParams } from "@amiceli/vitest-cucumber";
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import { expect, type TestContext } from "vitest";
import { db } from "@/db/database";
import { getIdOrThrow } from "@/test/helpers/getIdOrThrow";
import {
  createScenarioContext,
  getContext,
  seedContext,
} from "./contexts_steps.helpers";

const feature = await loadFeature("../contexts_dirty_flag.feature");

type FeatureContext = Record<string, never>;

describeFeature(
  feature,
  (f: FeatureDescriibeCallbackParams<FeatureContext>) => {
    const ctx = createScenarioContext();

    f.BeforeEachScenario(async () => {
      await ctx.reset();
    });

    // @add-context-category-specs @FR3
    f.Scenario(
      "No-op update does not trigger sync",
      ({ Given, When, Then, And }) => {
        let originalUpdatedAt: string;

        Given(
          'context "@home" exists with syncStatus "synced"',
          async (_ctx: TestContext) => {
            await seedContext(ctx.contextIds, "@home", {
              name: "@home",
              syncStatus: "synced" as const,
            });
            const existingContext = await getContext(ctx.contextIds, "@home");
            originalUpdatedAt = existingContext.updated_at;
          },
        );

        When(
          'user updates context name to "@home"',
          async (_ctx: TestContext) => {
            await ctx.contextService.update(
              getIdOrThrow(ctx.contextIds, "@home"),
              "@home",
            );
          },
        );

        Then(
          'context syncStatus remains "synced"',
          async (_ctx: TestContext) => {
            const context = await db.contexts.get(
              getIdOrThrow(ctx.contextIds, "@home"),
            );
            expect(context?.syncStatus).toBe("synced");
          },
        );

        And("context updated_at is unchanged", async (_ctx: TestContext) => {
          const context = await db.contexts.get(
            getIdOrThrow(ctx.contextIds, "@home"),
          );
          expect(context?.updated_at).toBe(originalUpdatedAt);
        });
      },
    );
  },
);

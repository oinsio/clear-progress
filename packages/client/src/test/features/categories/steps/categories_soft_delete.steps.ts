// implements FR4, FR5 of add-context-category-specs
import type { FeatureDescriibeCallbackParams } from "@amiceli/vitest-cucumber";
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import { expect, type TestContext } from "vitest";
import { db } from "@/db/database";
import { getIdOrThrow } from "@/test/helpers/getIdOrThrow";
import type { Category } from "@/types/entities";
import {
  createScenarioContext,
  seedCategory,
} from "./categories_steps.helpers";

const feature = await loadFeature("../categories_soft_delete.feature");

type FeatureContext = Record<string, never>;

describeFeature(
  feature,
  (f: FeatureDescriibeCallbackParams<FeatureContext>) => {
    const ctx = createScenarioContext();

    f.BeforeEachScenario(async () => {
      await ctx.reset();
    });

    // @add-context-category-specs @FR4
    f.Scenario("Soft-delete a category", ({ Given, When, Then, And }) => {
      Given('active category "Work" exists', async (_ctx: TestContext) => {
        await seedCategory(ctx.categoryIds, "Work");
      });

      When('user soft-deletes category "Work"', async (_ctx: TestContext) => {
        const categoryId = getIdOrThrow(ctx.categoryIds, "Work");
        await ctx.categoryService.softDelete(categoryId);
      });

      Then('category "Work" has is_deleted true', async (_ctx: TestContext) => {
        const categoryId = getIdOrThrow(ctx.categoryIds, "Work");
        const persistedCategory = await db.categories.get(categoryId);
        expect(persistedCategory?.is_deleted).toBe(true);
      });

      And(
        'category "Work" has syncStatus "pending"',
        async (_ctx: TestContext) => {
          const categoryId = getIdOrThrow(ctx.categoryIds, "Work");
          const persistedCategory = await db.categories.get(categoryId);
          expect(persistedCategory?.syncStatus).toBe("pending");
        },
      );
    });

    // @add-context-category-specs @FR5
    f.Scenario(
      "Restore a soft-deleted category",
      ({ Given, When, Then, And }) => {
        Given(
          'soft-deleted category "Work" exists',
          async (_ctx: TestContext) => {
            await seedCategory(ctx.categoryIds, "Work", { is_deleted: true });
          },
        );

        When('user restores category "Work"', async (_ctx: TestContext) => {
          const categoryId = getIdOrThrow(ctx.categoryIds, "Work");
          await ctx.categoryService.restore(categoryId);
        });

        Then(
          'category "Work" has is_deleted false',
          async (_ctx: TestContext) => {
            const categoryId = getIdOrThrow(ctx.categoryIds, "Work");
            const persistedCategory = await db.categories.get(categoryId);
            expect(persistedCategory?.is_deleted).toBe(false);
          },
        );

        And(
          'category "Work" has syncStatus "pending"',
          async (_ctx: TestContext) => {
            const categoryId = getIdOrThrow(ctx.categoryIds, "Work");
            const persistedCategory = await db.categories.get(categoryId);
            expect(persistedCategory?.syncStatus).toBe("pending");
          },
        );
      },
    );

    // @add-context-category-specs @FR4 @FR2
    f.Scenario(
      "Soft-deleted category excluded from active list",
      ({ Given, When, Then }) => {
        let returnedCategories: Category[];

        Given(
          'active category "Work" is soft-deleted',
          async (_ctx: TestContext) => {
            await seedCategory(ctx.categoryIds, "Work", { is_deleted: true });
          },
        );

        When("user views category list", async (_ctx: TestContext) => {
          returnedCategories = await ctx.categoryService.getAll();
        });

        Then(
          '"Work" does not appear in the list',
          async (_ctx: TestContext) => {
            const categoryNames = returnedCategories.map(
              (category) => category.name,
            );
            expect(categoryNames).not.toContain("Work");
          },
        );
      },
    );
  },
);

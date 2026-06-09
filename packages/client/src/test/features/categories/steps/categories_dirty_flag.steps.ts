// implements FR3, FR6 of add-context-category-specs
import type { FeatureDescriibeCallbackParams } from "@amiceli/vitest-cucumber";
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import { expect, type TestContext } from "vitest";
import { generateKeyBetween } from "@/services/SortOrderService";
import { getIdOrThrow } from "@/test/helpers/getIdOrThrow";
import {
  createScenarioContext,
  expectCategoryNeedsSync,
  getCategory,
  seedCategoriesWithOrder,
  seedCategory,
} from "./categories_steps.helpers";

const feature = await loadFeature("../categories_dirty_flag.feature");

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
          'category "Work" exists with needsSync false',
          async (_ctx: TestContext) => {
            await seedCategory(ctx.categoryIds, "Work", {
              name: "Work",
              needsSync: false,
            });
            const existingCategory = await getCategory(ctx.categoryIds, "Work");
            originalUpdatedAt = existingCategory.updated_at;
          },
        );

        When(
          'user updates category name to "Work"',
          async (_ctx: TestContext) => {
            await ctx.categoryService.update(
              getIdOrThrow(ctx.categoryIds, "Work"),
              "Work",
            );
          },
        );

        Then("category needsSync remains false", async (_ctx: TestContext) => {
          await expectCategoryNeedsSync(ctx.categoryIds, "Work", false);
        });

        And("category updated_at is unchanged", async (_ctx: TestContext) => {
          const category = await getCategory(ctx.categoryIds, "Work");
          expect(category.updated_at).toBe(originalUpdatedAt);
        });
      },
    );

    // @add-context-category-specs @FR6
    f.Scenario(
      "Reorder marks only moved category for sync",
      ({ Given, When, Then, And }) => {
        Given(
          "categories A, B, C with ascending sort_order",
          async (_ctx: TestContext) => {
            await seedCategoriesWithOrder(ctx.categoryIds, ["A", "B", "C"]);
          },
        );

        When(
          "user moves category C between A and B",
          async (_ctx: TestContext) => {
            const categoryA = await getCategory(ctx.categoryIds, "A");
            const categoryB = await getCategory(ctx.categoryIds, "B");
            const categoryC = await getCategory(ctx.categoryIds, "C");
            const newKey = generateKeyBetween(
              String(categoryA.sort_order),
              String(categoryB.sort_order),
            );
            await ctx.categoryService.reorderCategories(categoryC.id, newKey);
          },
        );

        Then("category A has needsSync false", async (_ctx: TestContext) => {
          await expectCategoryNeedsSync(ctx.categoryIds, "A", false);
        });

        And("category B has needsSync false", async (_ctx: TestContext) => {
          await expectCategoryNeedsSync(ctx.categoryIds, "B", false);
        });

        And("category C has needsSync true", async (_ctx: TestContext) => {
          await expectCategoryNeedsSync(ctx.categoryIds, "C", true);
        });
      },
    );
  },
);

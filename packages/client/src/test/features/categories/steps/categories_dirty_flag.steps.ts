// implements FR3, FR6 of add-context-category-specs
import type { FeatureDescriibeCallbackParams } from "@amiceli/vitest-cucumber";
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import { expect, type TestContext } from "vitest";
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
      "Reorder marks only changed categories for sync",
      ({ Given, When, Then, And }) => {
        Given(
          "categories A, B, C with sort_order 0, 1, 2",
          async (_ctx: TestContext) => {
            await seedCategoriesWithOrder(ctx.categoryIds, ["A", "B", "C"]);
          },
        );

        When("user reorders to A, C, B", async (_ctx: TestContext) => {
          const categoryA = await getCategory(ctx.categoryIds, "A");
          const categoryC = await getCategory(ctx.categoryIds, "C");
          const categoryB = await getCategory(ctx.categoryIds, "B");
          await ctx.categoryService.reorderCategories([
            categoryA,
            categoryC,
            categoryB,
          ]);
        });

        Then("category A has needsSync false", async (_ctx: TestContext) => {
          await expectCategoryNeedsSync(ctx.categoryIds, "A", false);
        });

        And("category C has needsSync true", async (_ctx: TestContext) => {
          await expectCategoryNeedsSync(ctx.categoryIds, "C", true);
        });

        And("category B has needsSync true", async (_ctx: TestContext) => {
          await expectCategoryNeedsSync(ctx.categoryIds, "B", true);
        });
      },
    );
  },
);

// implements FR6 of add-context-category-specs
import type { FeatureDescriibeCallbackParams } from "@amiceli/vitest-cucumber";
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import type { TestContext } from "vitest";
import {
  createScenarioContext,
  expectCategoryNeedsSync,
  expectCategorySortOrder,
  getCategory,
  seedCategoriesWithOrder,
} from "./categories_steps.helpers";

const feature = await loadFeature("../categories_ordering.feature");

type FeatureContext = Record<string, never>;

describeFeature(
  feature,
  (f: FeatureDescriibeCallbackParams<FeatureContext>) => {
    const ctx = createScenarioContext();

    f.BeforeEachScenario(async () => {
      await ctx.reset();
    });

    // @add-context-category-specs @FR6
    f.Scenario(
      "Reorder assigns sequential sort_order",
      ({ Given, When, Then, And }) => {
        Given(
          "categories A with sort_order 0, B with sort_order 1, C with sort_order 2",
          async (_ctx: TestContext) => {
            await seedCategoriesWithOrder(ctx.categoryIds, ["A", "B", "C"]);
          },
        );

        When(
          "user reorders categories to B, C, A",
          async (_ctx: TestContext) => {
            const categoryB = await getCategory(ctx.categoryIds, "B");
            const categoryC = await getCategory(ctx.categoryIds, "C");
            const categoryA = await getCategory(ctx.categoryIds, "A");
            await ctx.categoryService.reorderCategories([
              categoryB,
              categoryC,
              categoryA,
            ]);
          },
        );

        Then("category B has sort_order 0", async (_ctx: TestContext) => {
          await expectCategorySortOrder(ctx.categoryIds, "B", 0);
        });

        And("category C has sort_order 1", async (_ctx: TestContext) => {
          await expectCategorySortOrder(ctx.categoryIds, "C", 1);
        });

        And("category A has sort_order 2", async (_ctx: TestContext) => {
          await expectCategorySortOrder(ctx.categoryIds, "A", 2);
        });
      },
    );

    // @add-context-category-specs @FR6
    f.Scenario(
      "Only changed categories marked for sync",
      ({ Given, When, Then, And }) => {
        Given(
          "categories A with sort_order 0, B with sort_order 1, C with sort_order 2",
          async (_ctx: TestContext) => {
            await seedCategoriesWithOrder(ctx.categoryIds, ["A", "B", "C"]);
          },
        );

        When(
          "user reorders categories to A, C, B",
          async (_ctx: TestContext) => {
            const categoryA = await getCategory(ctx.categoryIds, "A");
            const categoryC = await getCategory(ctx.categoryIds, "C");
            const categoryB = await getCategory(ctx.categoryIds, "B");
            await ctx.categoryService.reorderCategories([
              categoryA,
              categoryC,
              categoryB,
            ]);
          },
        );

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

    // @add-context-category-specs @FR6
    f.Scenario("Empty reorder is no-op", ({ Given, When, Then, And }) => {
      Given(
        "categories A with sort_order 0, B with sort_order 1, C with sort_order 2",
        async (_ctx: TestContext) => {
          await seedCategoriesWithOrder(ctx.categoryIds, ["A", "B", "C"]);
        },
      );

      When("user reorders with empty array", async (_ctx: TestContext) => {
        await ctx.categoryService.reorderCategories([]);
      });

      Then("category A has needsSync false", async (_ctx: TestContext) => {
        await expectCategoryNeedsSync(ctx.categoryIds, "A", false);
      });

      And("category B has needsSync false", async (_ctx: TestContext) => {
        await expectCategoryNeedsSync(ctx.categoryIds, "B", false);
      });

      And("category C has needsSync false", async (_ctx: TestContext) => {
        await expectCategoryNeedsSync(ctx.categoryIds, "C", false);
      });
    });

    // @add-context-category-specs @FR6
    f.Scenario("Same order is no-op", ({ Given, When, Then, And }) => {
      Given(
        "categories A with sort_order 0, B with sort_order 1",
        async (_ctx: TestContext) => {
          await seedCategoriesWithOrder(ctx.categoryIds, ["A", "B"]);
        },
      );

      When("user reorders categories to A, B", async (_ctx: TestContext) => {
        const categoryA = await getCategory(ctx.categoryIds, "A");
        const categoryB = await getCategory(ctx.categoryIds, "B");
        await ctx.categoryService.reorderCategories([categoryA, categoryB]);
      });

      Then("category A has needsSync false", async (_ctx: TestContext) => {
        await expectCategoryNeedsSync(ctx.categoryIds, "A", false);
      });

      And("category B has needsSync false", async (_ctx: TestContext) => {
        await expectCategoryNeedsSync(ctx.categoryIds, "B", false);
      });
    });
  },
);

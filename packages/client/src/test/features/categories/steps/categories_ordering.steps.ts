// implements FR6 of add-context-category-specs
import type { FeatureDescriibeCallbackParams } from "@amiceli/vitest-cucumber";
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import { expect, type TestContext } from "vitest";
import {
  createScenarioContext,
  getCategory,
  moveCategoryBefore,
  seedCategoriesWithOrder,
} from "./categories_steps.helpers";

const feature = await loadFeature("../categories_ordering.feature");

type FeatureContext = Record<string, never>;

describeFeature(
  feature,
  (f: FeatureDescriibeCallbackParams<FeatureContext>) => {
    const ctx = createScenarioContext();
    let caughtError: Error | undefined;

    f.BeforeEachScenario(async () => {
      await ctx.reset();
      caughtError = undefined;
    });

    // @add-context-category-specs @FR6
    f.Scenario(
      "Reorder places category at new position via fractional key",
      ({ Given, When, Then }) => {
        Given(
          "categories A, B, C with ascending sort_order",
          async (_ctx: TestContext) => {
            await seedCategoriesWithOrder(ctx.categoryIds, ["A", "B", "C"]);
          },
        );

        When(
          "user moves category C before category A",
          async (_ctx: TestContext) => {
            await moveCategoryBefore(
              ctx.categoryIds,
              ctx.categoryService,
              "C",
              "A",
            );
          },
        );

        Then("categories are ordered C, A, B", async (_ctx: TestContext) => {
          const allCategories = await ctx.categoryService.getAll();
          expect(allCategories[0].id).toBe(ctx.categoryIds.get("C"));
          expect(allCategories[1].id).toBe(ctx.categoryIds.get("A"));
          expect(allCategories[2].id).toBe(ctx.categoryIds.get("B"));
        });
      },
    );

    // @add-context-category-specs @FR6
    f.Scenario(
      "Reorder marks moved category for sync",
      ({ Given, When, Then, And }) => {
        Given(
          "categories A, B, C with ascending sort_order",
          async (_ctx: TestContext) => {
            await seedCategoriesWithOrder(ctx.categoryIds, ["A", "B", "C"]);
          },
        );

        When(
          "user moves category C before category A",
          async (_ctx: TestContext) => {
            await moveCategoryBefore(
              ctx.categoryIds,
              ctx.categoryService,
              "C",
              "A",
            );
          },
        );

        Then("category C has needsSync true", async (_ctx: TestContext) => {
          const category = await getCategory(ctx.categoryIds, "C");
          expect(category.needsSync).toBe(true);
        });

        And("category A has needsSync false", async (_ctx: TestContext) => {
          const category = await getCategory(ctx.categoryIds, "A");
          expect(category.needsSync).toBe(false);
        });

        And("category B has needsSync false", async (_ctx: TestContext) => {
          const category = await getCategory(ctx.categoryIds, "B");
          expect(category.needsSync).toBe(false);
        });
      },
    );

    // @add-context-category-specs @FR6
    f.Scenario(
      "Reorder throws for non-existent category",
      ({ Given, When, Then }) => {
        Given(
          "categories A, B with ascending sort_order",
          async (_ctx: TestContext) => {
            await seedCategoriesWithOrder(ctx.categoryIds, ["A", "B"]);
          },
        );

        When(
          "user reorders non-existent category",
          async (_ctx: TestContext) => {
            try {
              await ctx.categoryService.reorderCategories(
                "nonexistent-id",
                "a1",
              );
            } catch (error) {
              caughtError = error as Error;
            }
          },
        );

        Then("an error is thrown", async (_ctx: TestContext) => {
          expect(caughtError).toBeDefined();
        });
      },
    );
  },
);

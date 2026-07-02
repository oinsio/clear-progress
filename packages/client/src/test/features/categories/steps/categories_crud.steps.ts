// implements FR1, FR2, FR3 of add-context-category-specs
import type { FeatureDescriibeCallbackParams } from "@amiceli/vitest-cucumber";
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import { expect, type TestContext } from "vitest";
import { db } from "@/db/database";
import { getIdOrThrow } from "@/test/helpers/getIdOrThrow";
import type { Category, ISOTimestamp } from "@/types/entities";
import {
  createScenarioContext,
  getCategory,
  seedCategory,
} from "./categories_steps.helpers";

const feature = await loadFeature("../categories_crud.feature");

const UUID_V4_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const ISO_TIMESTAMP_REGEX = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;

type FeatureContext = Record<string, never>;

describeFeature(
  feature,
  (f: FeatureDescriibeCallbackParams<FeatureContext>) => {
    const ctx = createScenarioContext();

    f.BeforeEachScenario(async () => {
      await ctx.reset();
    });

    // @add-context-category-specs @FR1
    f.Scenario("Create category with name", ({ When, Then, And }) => {
      let createdCategory: Category;

      When('user creates category "Work"', async (_ctx: TestContext) => {
        createdCategory = await ctx.categoryService.create("Work");
      });

      Then(
        'category is persisted with name "Work"',
        async (_ctx: TestContext) => {
          const persistedCategory = await db.categories.get(createdCategory.id);
          expect(persistedCategory?.name).toBe("Work");
        },
      );

      And("category has revision 0", async (_ctx: TestContext) => {
        expect(createdCategory.revision).toBe(0);
      });

      And('category has syncStatus "pending"', async (_ctx: TestContext) => {
        expect(createdCategory.syncStatus).toBe("pending");
      });

      And("category has is_deleted false", async (_ctx: TestContext) => {
        expect(createdCategory.is_deleted).toBe(false);
      });
    });

    // @add-context-category-specs @FR1
    f.Scenario(
      "Sort order defaults to end of list",
      ({ Given, When, Then }) => {
        let createdCategory: Category;

        Given("3 active categories exist", async (_ctx: TestContext) => {
          await seedCategory(ctx.categoryIds, "Cat A", { sort_order: "a0" });
          await seedCategory(ctx.categoryIds, "Cat B", { sort_order: "a1" });
          await seedCategory(ctx.categoryIds, "Cat C", { sort_order: "a2" });
        });

        When(
          'user creates category "New Category"',
          async (_ctx: TestContext) => {
            createdCategory = await ctx.categoryService.create("New Category");
          },
        );

        Then(
          "category has sort_order above existing maximum",
          async (_ctx: TestContext) => {
            expect(typeof createdCategory.sort_order).toBe("string");
            const allCategories = await ctx.categoryService.getAll();
            const others = allCategories.filter(
              (entity) => entity.id !== createdCategory.id,
            );
            for (const other of others) {
              expect(
                String(createdCategory.sort_order) > String(other.sort_order),
              ).toBe(true);
            }
          },
        );
      },
    );

    // @add-context-category-specs @FR1
    f.Scenario("UUID generated client-side", ({ When, Then }) => {
      let createdCategory: Category;

      When('user creates category "Work"', async (_ctx: TestContext) => {
        createdCategory = await ctx.categoryService.create("Work");
      });

      Then("category id is valid UUID v4", async (_ctx: TestContext) => {
        expect(createdCategory.id).toMatch(UUID_V4_REGEX);
      });
    });

    // @add-context-category-specs @FR1
    f.Scenario("Timestamps set on creation", ({ When, Then, And }) => {
      let createdCategory: Category;

      When('user creates category "Work"', async (_ctx: TestContext) => {
        createdCategory = await ctx.categoryService.create("Work");
      });

      Then(
        "category created_at and updated_at are equal",
        async (_ctx: TestContext) => {
          expect(createdCategory.created_at).toBe(createdCategory.updated_at);
        },
      );

      And(
        "category timestamps are ISO 8601 with Z suffix",
        async (_ctx: TestContext) => {
          expect(createdCategory.created_at).toMatch(ISO_TIMESTAMP_REGEX);
          expect(createdCategory.updated_at).toMatch(ISO_TIMESTAMP_REGEX);
        },
      );
    });

    // @add-context-category-specs @FR2
    f.Scenario("List sorted by sort_order", ({ Given, When, Then }) => {
      let returnedCategories: Category[];

      Given("categories with sort_order 2, 0, 1", async (_ctx: TestContext) => {
        await seedCategory(ctx.categoryIds, "Cat A", { sort_order: "2" });
        await seedCategory(ctx.categoryIds, "Cat B", { sort_order: "0" });
        await seedCategory(ctx.categoryIds, "Cat C", { sort_order: "1" });
      });

      When("user requests all categories", async (_ctx: TestContext) => {
        returnedCategories = await ctx.categoryService.getAll();
      });

      Then(
        "categories are returned in order 2, 1, 0",
        async (_ctx: TestContext) => {
          const sortOrders = returnedCategories.map(
            (category) => category.sort_order,
          );
          expect(sortOrders).toEqual(["2", "1", "0"]);
        },
      );
    });

    // @add-context-category-specs @FR2
    f.Scenario("Empty list", ({ Given, When, Then }) => {
      let returnedCategories: Category[];

      Given("no categories exist", async (_ctx: TestContext) => {
        // DB is already cleared in BeforeEachScenario
      });

      When("user requests all categories", async (_ctx: TestContext) => {
        returnedCategories = await ctx.categoryService.getAll();
      });

      Then("empty array is returned", async (_ctx: TestContext) => {
        expect(returnedCategories).toEqual([]);
      });
    });

    // @add-context-category-specs @FR2
    f.Scenario("Soft-deleted categories excluded", ({ Given, When, Then }) => {
      let returnedCategories: Category[];

      Given("2 active and 1 deleted categories", async (_ctx: TestContext) => {
        await seedCategory(ctx.categoryIds, "Active A", { is_deleted: false });
        await seedCategory(ctx.categoryIds, "Active B", { is_deleted: false });
        await seedCategory(ctx.categoryIds, "Deleted C", { is_deleted: true });
      });

      When("user requests all categories", async (_ctx: TestContext) => {
        returnedCategories = await ctx.categoryService.getAll();
      });

      Then("only 2 categories are returned", async (_ctx: TestContext) => {
        expect(returnedCategories).toHaveLength(2);
      });
    });

    // @add-context-category-specs @FR3
    f.Scenario("Update category name", ({ Given, When, Then, And }) => {
      let updatedCategory: Category;
      let originalUpdatedAt: string;

      Given('category "Work" exists', async (_ctx: TestContext) => {
        const pastTimestamp = "2020-01-01T00:00:00.000Z" as ISOTimestamp;
        await seedCategory(ctx.categoryIds, "Work", {
          updated_at: pastTimestamp,
        });
        const existingCategory = await getCategory(ctx.categoryIds, "Work");
        originalUpdatedAt = existingCategory.updated_at;
      });

      When(
        'user updates category name to "Personal"',
        async (_ctx: TestContext) => {
          updatedCategory = await ctx.categoryService.update(
            getIdOrThrow(ctx.categoryIds, "Work"),
            "Personal",
          );
        },
      );

      Then('category name is "Personal"', async (_ctx: TestContext) => {
        expect(updatedCategory.name).toBe("Personal");
      });

      And('category has syncStatus "pending"', async (_ctx: TestContext) => {
        expect(updatedCategory.syncStatus).toBe("pending");
      });

      And("category updated_at is refreshed", async (_ctx: TestContext) => {
        expect(updatedCategory.updated_at).not.toBe(originalUpdatedAt);
      });
    });

    // @add-context-category-specs @FR3
    f.Scenario("Update nonexistent category throws error", ({ When, Then }) => {
      const nonexistentId = crypto.randomUUID();
      let thrownError: Error;

      When("user updates nonexistent category", async (_ctx: TestContext) => {
        try {
          await ctx.categoryService.update(nonexistentId, "New Name");
        } catch (error) {
          thrownError = error as Error;
        }
      });

      Then(
        'error "Category not found" is thrown',
        async (_ctx: TestContext) => {
          expect(thrownError).toBeDefined();
          expect(thrownError.message).toContain("Category not found");
        },
      );
    });
  },
);

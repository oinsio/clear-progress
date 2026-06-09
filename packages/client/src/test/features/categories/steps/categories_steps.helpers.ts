import { expect } from "vitest";
import { db } from "@/db/database";
import { CategoryRepository } from "@/db/repositories/CategoryRepository";
import { CategoryService } from "@/services/CategoryService";
import { buildCategory } from "@/test/factories/categoryFactory";
import { getIdOrThrow } from "@/test/helpers/getIdOrThrow";
import type { Category } from "@/types/entities";

export function createScenarioContext() {
  const categoryIds = new Map<string, string>();
  let categoryService: CategoryService;

  const reset = async () => {
    await db.categories.clear();
    categoryIds.clear();
    categoryService = new CategoryService(new CategoryRepository());
  };

  return {
    categoryIds,
    get categoryService() {
      return categoryService;
    },
    reset,
  };
}

export async function seedCategory(
  categoryIds: Map<string, string>,
  name: string,
  overrides: Partial<Category> = {},
) {
  const categoryId = crypto.randomUUID();
  categoryIds.set(name, categoryId);
  await db.categories.add(buildCategory({ id: categoryId, ...overrides }));
  return categoryId;
}

export async function getCategory(
  categoryIds: Map<string, string>,
  name: string,
): Promise<Category> {
  return (await db.categories.get(getIdOrThrow(categoryIds, name))) as Category;
}

export async function expectCategoryNeedsSync(
  categoryIds: Map<string, string>,
  name: string,
  expectedNeedsSync: boolean,
) {
  const category = await getCategory(categoryIds, name);
  expect(category.needsSync).toBe(expectedNeedsSync);
}

export async function seedCategoriesWithOrder(
  categoryIds: Map<string, string>,
  names: string[],
) {
  const { rebalanceKeys } = await import("@/services/SortOrderService");
  const keys = rebalanceKeys(names.length);
  for (let i = 0; i < names.length; i++) {
    await seedCategory(categoryIds, names[i], {
      sort_order: keys[i],
      needsSync: false,
    });
  }
}

import { beforeEach } from "vitest";
import { db } from "../database";
import { CategoryRepository } from "./CategoryRepository";

export function createCategoryRepositorySetup(): {
  getRepository: () => CategoryRepository;
} {
  let categoryRepository: CategoryRepository;

  beforeEach(async () => {
    await db.categories.clear();
    categoryRepository = new CategoryRepository();
  });

  return {
    getRepository: () => categoryRepository,
  };
}

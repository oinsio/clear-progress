import type { CategoryRepository } from "@/db/repositories/CategoryRepository";
import { createRepositoryMock } from "./createRepositoryMock";

export function createMockCategoryRepository(
  overrides: Partial<Record<keyof CategoryRepository, unknown>> = {},
): CategoryRepository {
  return createRepositoryMock<CategoryRepository>(overrides);
}

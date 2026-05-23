import { beforeEach, describe, expect, it } from "vitest";
import type { CategoryRepository } from "@/db/repositories/CategoryRepository";
import { createMockCategoryRepository } from "@/test/mocks/categoryRepositoryMock";
import { CategoryService } from "./CategoryService";

describe("CategoryService", () => {
  let mockCategoryRepository: CategoryRepository;

  beforeEach(() => {
    mockCategoryRepository = createMockCategoryRepository();
  });

  describe("create", () => {
    let createdCategory: Awaited<ReturnType<CategoryService["create"]>>;

    beforeEach(async () => {
      const categoryService = new CategoryService(mockCategoryRepository);
      createdCategory = await categoryService.create("Work");
    });

    it("should create category with given name", () => {
      expect(createdCategory.name).toBe("Work");
    });

    it("should create category with is_deleted false", () => {
      expect(createdCategory.is_deleted).toBe(false);
    });

    it("should create category with a UUID id", () => {
      expect(createdCategory.id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
      );
    });

    it("should create category with sort_order 0", () => {
      expect(createdCategory.sort_order).toBe(0);
    });

    it("should create category with needsSync true", () => {
      expect(createdCategory.needsSync).toBe(true);
    });

    it("should create category with revision 0", () => {
      expect(createdCategory.revision).toBe(0);
    });

    it("should call repository.create with the constructed category", () => {
      expect(mockCategoryRepository.create).toHaveBeenCalledWith(
        createdCategory,
      );
    });
  });
});

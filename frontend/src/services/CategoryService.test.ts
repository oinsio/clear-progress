import { describe, it, expect, vi, beforeEach } from "vitest";
import { CategoryService } from "./CategoryService";
import type { CategoryRepository } from "@/db/repositories/CategoryRepository";
import { buildCategory } from "@/test/factories/categoryFactory";
import { createMockCategoryRepository } from "@/test/mocks/categoryRepositoryMock";

describe("CategoryService", () => {
  let mockCategoryRepository: CategoryRepository;

  beforeEach(() => {
    mockCategoryRepository = createMockCategoryRepository();
  });

  describe("getAll", () => {
    it("should return empty array when no categories exist", async () => {
      const categoryService = new CategoryService(mockCategoryRepository);
      const categories = await categoryService.getAll();
      expect(categories).toEqual([]);
    });

    it("should return categories sorted by sort_order ascending", async () => {
      const unsortedCategories = [
        buildCategory({ sort_order: 3 }),
        buildCategory({ sort_order: 1 }),
        buildCategory({ sort_order: 2 }),
      ];
      mockCategoryRepository = createMockCategoryRepository({
        getActive: vi.fn().mockResolvedValue(unsortedCategories),
      });
      const categoryService = new CategoryService(mockCategoryRepository);
      const categories = await categoryService.getAll();
      expect(categories[0].sort_order).toBe(1);
      expect(categories[1].sort_order).toBe(2);
      expect(categories[2].sort_order).toBe(3);
    });

    it("should call repository.getActive", async () => {
      const categoryService = new CategoryService(mockCategoryRepository);
      await categoryService.getAll();
      expect(mockCategoryRepository.getActive).toHaveBeenCalled();
    });
  });

  describe("getById", () => {
    it("should return category when found", async () => {
      const category = buildCategory();
      mockCategoryRepository = createMockCategoryRepository({
        getById: vi.fn().mockResolvedValue(category),
      });
      const categoryService = new CategoryService(mockCategoryRepository);
      const result = await categoryService.getById(category.id);
      expect(result).toEqual(category);
    });

    it("should return undefined when category not found", async () => {
      const categoryService = new CategoryService(mockCategoryRepository);
      const result = await categoryService.getById("nonexistent");
      expect(result).toBeUndefined();
    });

    it("should call repository.getById with the id", async () => {
      const categoryService = new CategoryService(mockCategoryRepository);
      await categoryService.getById("test-id");
      expect(mockCategoryRepository.getById).toHaveBeenCalledWith("test-id");
    });
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

    it("should create category with version 1", () => {
      expect(createdCategory.version).toBe(1);
    });

    it("should create category with a UUID id", () => {
      expect(createdCategory.id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
      );
    });

    it("should create category with sort_order 0", () => {
      expect(createdCategory.sort_order).toBe(0);
    });

    it("should create category with _dirty true", () => {
      expect(createdCategory._dirty).toBe(true);
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

  describe("update", () => {
    it("should update category name", async () => {
      const category = buildCategory({ name: "Old name" });
      mockCategoryRepository = createMockCategoryRepository({
        getById: vi.fn().mockResolvedValue(category),
      });
      const categoryService = new CategoryService(mockCategoryRepository);
      const updated = await categoryService.update(category.id, "New name");
      expect(updated.name).toBe("New name");
    });

    it("should increment version on update", async () => {
      const category = buildCategory({ version: 2 });
      mockCategoryRepository = createMockCategoryRepository({
        getById: vi.fn().mockResolvedValue(category),
      });
      const categoryService = new CategoryService(mockCategoryRepository);
      const updated = await categoryService.update(category.id, "X");
      expect(updated.version).toBe(3);
    });

    it("should update updated_at timestamp", async () => {
      const category = buildCategory({
        updated_at: "2025-01-01T00:00:00.000Z",
      });
      mockCategoryRepository = createMockCategoryRepository({
        getById: vi.fn().mockResolvedValue(category),
      });
      const categoryService = new CategoryService(mockCategoryRepository);
      const updated = await categoryService.update(category.id, "X");
      expect(updated.updated_at).not.toBe("2025-01-01T00:00:00.000Z");
    });

    it("should set _dirty to true", async () => {
      const category = buildCategory({ _dirty: false });
      mockCategoryRepository = createMockCategoryRepository({
        getById: vi.fn().mockResolvedValue(category),
      });
      const categoryService = new CategoryService(mockCategoryRepository);
      const updated = await categoryService.update(category.id, "X");
      expect(updated._dirty).toBe(true);
    });

    it("should throw when category not found", async () => {
      const categoryService = new CategoryService(mockCategoryRepository);
      await expect(categoryService.update("nonexistent", "X")).rejects.toThrow(
        "Category not found: nonexistent",
      );
    });

    it("should call repository.update with the updated category", async () => {
      const category = buildCategory();
      mockCategoryRepository = createMockCategoryRepository({
        getById: vi.fn().mockResolvedValue(category),
      });
      const categoryService = new CategoryService(mockCategoryRepository);
      await categoryService.update(category.id, "Updated");
      expect(mockCategoryRepository.update).toHaveBeenCalled();
    });

    it("should preserve id when updating", async () => {
      const category = buildCategory();
      mockCategoryRepository = createMockCategoryRepository({
        getById: vi.fn().mockResolvedValue(category),
      });
      const categoryService = new CategoryService(mockCategoryRepository);
      const updated = await categoryService.update(category.id, "X");
      expect(updated.id).toBe(category.id);
    });
  });

  describe("softDelete", () => {
    it("should set is_deleted to true", async () => {
      const category = buildCategory({ is_deleted: false });
      mockCategoryRepository = createMockCategoryRepository({
        getById: vi.fn().mockResolvedValue(category),
      });
      const categoryService = new CategoryService(mockCategoryRepository);
      const deleted = await categoryService.softDelete(category.id);
      expect(deleted.is_deleted).toBe(true);
    });

    it("should increment version on soft delete", async () => {
      const category = buildCategory({ version: 3 });
      mockCategoryRepository = createMockCategoryRepository({
        getById: vi.fn().mockResolvedValue(category),
      });
      const categoryService = new CategoryService(mockCategoryRepository);
      const deleted = await categoryService.softDelete(category.id);
      expect(deleted.version).toBe(4);
    });

    it("should throw when category not found", async () => {
      const categoryService = new CategoryService(mockCategoryRepository);
      await expect(
        categoryService.softDelete("nonexistent-id"),
      ).rejects.toThrow("Category not found: nonexistent-id");
    });
  });

  describe("restore", () => {
    it("should set is_deleted to false", async () => {
      const category = buildCategory({ is_deleted: true });
      mockCategoryRepository = createMockCategoryRepository({
        getById: vi.fn().mockResolvedValue(category),
      });
      const categoryService = new CategoryService(mockCategoryRepository);
      const restored = await categoryService.restore(category.id);
      expect(restored.is_deleted).toBe(false);
    });

    it("should increment version on restore", async () => {
      const category = buildCategory({ is_deleted: true, version: 5 });
      mockCategoryRepository = createMockCategoryRepository({
        getById: vi.fn().mockResolvedValue(category),
      });
      const categoryService = new CategoryService(mockCategoryRepository);
      const restored = await categoryService.restore(category.id);
      expect(restored.version).toBe(6);
    });

    it("should throw when category not found", async () => {
      const categoryService = new CategoryService(mockCategoryRepository);
      await expect(categoryService.restore("nonexistent-id")).rejects.toThrow(
        "Category not found: nonexistent-id",
      );
    });
  });

  describe("reorderCategories", () => {
    const getUpsertedCategories = () =>
      (mockCategoryRepository.bulkUpsert as ReturnType<typeof vi.fn>).mock
        .calls[0][0];

    it("should call bulkUpsert with categories assigned sort_order by position", async () => {
      const categoryA = buildCategory({ sort_order: 2 });
      const categoryB = buildCategory({ sort_order: 0 });
      const categoryC = buildCategory({ sort_order: 1 });
      const categoryService = new CategoryService(mockCategoryRepository);
      await categoryService.reorderCategories([
        categoryA,
        categoryB,
        categoryC,
      ]);
      const upserted = getUpsertedCategories();
      expect(upserted[0].sort_order).toBe(0);
      expect(upserted[1].sort_order).toBe(1);
      expect(upserted[2].sort_order).toBe(2);
    });

    it("should increment version for each reordered category", async () => {
      const categoryA = buildCategory({ version: 3 });
      const categoryB = buildCategory({ version: 5 });
      const categoryService = new CategoryService(mockCategoryRepository);
      await categoryService.reorderCategories([categoryA, categoryB]);
      const upserted = getUpsertedCategories();
      expect(upserted[0].version).toBe(4);
      expect(upserted[1].version).toBe(6);
    });

    it("should update updated_at for each reordered category", async () => {
      const categoryA = buildCategory({
        updated_at: "2025-01-01T00:00:00.000Z",
      });
      const categoryService = new CategoryService(mockCategoryRepository);
      await categoryService.reorderCategories([categoryA]);
      const upserted = getUpsertedCategories();
      expect(upserted[0].updated_at).not.toBe("2025-01-01T00:00:00.000Z");
    });

    it("should set _dirty to true for each reordered category", async () => {
      const categoryA = buildCategory({ _dirty: false });
      const categoryService = new CategoryService(mockCategoryRepository);
      await categoryService.reorderCategories([categoryA]);
      const upserted = getUpsertedCategories();
      expect(upserted[0]._dirty).toBe(true);
    });

    it("should preserve category ids after reorder", async () => {
      const categoryA = buildCategory();
      const categoryB = buildCategory();
      const categoryService = new CategoryService(mockCategoryRepository);
      await categoryService.reorderCategories([categoryA, categoryB]);
      const upserted = getUpsertedCategories();
      expect(upserted[0].id).toBe(categoryA.id);
      expect(upserted[1].id).toBe(categoryB.id);
    });

    it("should not call bulkUpsert when given empty array", async () => {
      const categoryService = new CategoryService(mockCategoryRepository);
      await categoryService.reorderCategories([]);
      expect(mockCategoryRepository.bulkUpsert).not.toHaveBeenCalled();
    });

    it("should use same timestamp for all categories in batch", async () => {
      const categoryA = buildCategory();
      const categoryB = buildCategory();
      const categoryService = new CategoryService(mockCategoryRepository);
      await categoryService.reorderCategories([categoryA, categoryB]);
      const upserted = getUpsertedCategories();
      expect(upserted[0].updated_at).toBe(upserted[1].updated_at);
    });
  });
});

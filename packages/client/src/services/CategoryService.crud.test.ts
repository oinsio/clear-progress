import { beforeEach, describe, expect, it, vi } from "vitest";
import type { CategoryRepository } from "@/db/repositories/CategoryRepository";
import { Temporal } from "@/lib/temporal";
import { buildCategory } from "@/test/factories/categoryFactory";
import { createMockCategoryRepository } from "@/test/mocks/categoryRepositoryMock";
import { toISOTimestamp } from "@/utils/dateHelpers";
import { CategoryService } from "./CategoryService";

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

    it("should update updated_at timestamp", async () => {
      const category = buildCategory({
        updated_at: toISOTimestamp(
          Temporal.Instant.from("2025-01-01T00:00:00.000Z"),
        ),
      });
      mockCategoryRepository = createMockCategoryRepository({
        getById: vi.fn().mockResolvedValue(category),
      });
      const categoryService = new CategoryService(mockCategoryRepository);
      const updated = await categoryService.update(category.id, "X");
      expect(updated.updated_at).not.toBe(
        toISOTimestamp(Temporal.Instant.from("2025-01-01T00:00:00.000Z")),
      );
    });

    it("should set needsSync to true", async () => {
      const category = buildCategory({ needsSync: false });
      mockCategoryRepository = createMockCategoryRepository({
        getById: vi.fn().mockResolvedValue(category),
      });
      const categoryService = new CategoryService(mockCategoryRepository);
      const updated = await categoryService.update(category.id, "X");
      expect(updated.needsSync).toBe(true);
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

    it("should throw when category not found", async () => {
      const categoryService = new CategoryService(mockCategoryRepository);
      await expect(categoryService.restore("nonexistent-id")).rejects.toThrow(
        "Category not found: nonexistent-id",
      );
    });
  });
});

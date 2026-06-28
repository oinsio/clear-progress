import { describe, expect, it, vi } from "vitest";
import { SORT_ORDER_REBALANCE_THRESHOLD } from "@/constants";
import { buildCategory } from "@/test/factories/categoryFactory";
import { createMockCategoryRepository } from "@/test/mocks/categoryRepositoryMock";
import { CategoryService } from "./CategoryService";

describe("CategoryService", () => {
  describe("reorderCategories", () => {
    it("should update category with new sort_order", async () => {
      const category = buildCategory({ sort_order: "a0" });
      const mockCategoryRepository = createMockCategoryRepository({
        getById: vi.fn().mockResolvedValue(category),
      });
      const categoryService = new CategoryService(mockCategoryRepository);

      await categoryService.reorderCategories(category.id, "a1");

      expect(mockCategoryRepository.update).toHaveBeenCalledWith(
        expect.objectContaining({
          id: category.id,
          sort_order: "a1",
          syncStatus: "pending" as const,
        }),
      );
    });

    it("should update updated_at when reordering", async () => {
      const category = buildCategory({
        sort_order: "a0",
        updated_at: "2025-01-01T00:00:00.000Z",
      });
      const mockCategoryRepository = createMockCategoryRepository({
        getById: vi.fn().mockResolvedValue(category),
      });
      const categoryService = new CategoryService(mockCategoryRepository);

      await categoryService.reorderCategories(category.id, "a1");

      const updatedCategory = (
        mockCategoryRepository.update as ReturnType<typeof vi.fn>
      ).mock.calls[0][0];
      expect(updatedCategory.updated_at).not.toBe("2025-01-01T00:00:00.000Z");
    });

    it("should throw when category not found", async () => {
      const mockCategoryRepository = createMockCategoryRepository();
      const categoryService = new CategoryService(mockCategoryRepository);
      await expect(
        categoryService.reorderCategories("nonexistent", "a1"),
      ).rejects.toThrow("Category not found: nonexistent");
    });

    it("should not trigger rebalancing when key is short", async () => {
      const category = buildCategory({ sort_order: "a0" });
      const mockCategoryRepository = createMockCategoryRepository({
        getById: vi.fn().mockResolvedValue(category),
      });
      const categoryService = new CategoryService(mockCategoryRepository);

      await categoryService.reorderCategories(category.id, "a1");

      expect(mockCategoryRepository.bulkUpsert).not.toHaveBeenCalled();
    });

    it("should trigger rebalancing when key exceeds threshold", async () => {
      const longKey = "a".repeat(SORT_ORDER_REBALANCE_THRESHOLD + 1);
      const category = buildCategory({ sort_order: "a0" });
      const allCategories = [
        buildCategory({ sort_order: "a0" }),
        buildCategory({ sort_order: "a1" }),
      ];
      const mockCategoryRepository = createMockCategoryRepository({
        getById: vi.fn().mockResolvedValue(category),
        getActive: vi.fn().mockResolvedValue(allCategories),
      });
      const categoryService = new CategoryService(mockCategoryRepository);

      await categoryService.reorderCategories(category.id, longKey);

      expect(mockCategoryRepository.bulkUpsert).toHaveBeenCalled();
    });

    it("should rebalance all categories with fresh keys", async () => {
      const longKey = "a".repeat(SORT_ORDER_REBALANCE_THRESHOLD + 1);
      const category = buildCategory({ sort_order: "a0" });
      const allCategories = [
        buildCategory({ sort_order: "b0" }),
        buildCategory({ sort_order: "a0" }),
      ];
      const mockCategoryRepository = createMockCategoryRepository({
        getById: vi.fn().mockResolvedValue(category),
        getActive: vi.fn().mockResolvedValue(allCategories),
      });
      const categoryService = new CategoryService(mockCategoryRepository);

      await categoryService.reorderCategories(category.id, longKey);

      const rebalancedCategories = (
        mockCategoryRepository.bulkUpsert as ReturnType<typeof vi.fn>
      ).mock.calls[0][0];
      expect(rebalancedCategories).toHaveLength(2);
      for (const rebalancedCategory of rebalancedCategories) {
        expect(typeof rebalancedCategory.sort_order).toBe("string");
        expect(rebalancedCategory.syncStatus).toBe("pending");
      }
    });
  });
});

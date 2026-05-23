import { beforeEach, describe, expect, it, type vi } from "vitest";
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

    it("should update updated_at for each reordered category", async () => {
      const categoryA = buildCategory({
        updated_at: toISOTimestamp(
          Temporal.Instant.from("2025-01-01T00:00:00.000Z"),
        ),
      });
      const categoryService = new CategoryService(mockCategoryRepository);
      await categoryService.reorderCategories([categoryA]);
      const upserted = getUpsertedCategories();
      expect(upserted[0].updated_at).not.toBe(
        toISOTimestamp(Temporal.Instant.from("2025-01-01T00:00:00.000Z")),
      );
    });

    it("should set needsSync to true for each reordered category", async () => {
      const categoryA = buildCategory({ needsSync: false });
      const categoryService = new CategoryService(mockCategoryRepository);
      await categoryService.reorderCategories([categoryA]);
      const upserted = getUpsertedCategories();
      expect(upserted[0].needsSync).toBe(true);
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

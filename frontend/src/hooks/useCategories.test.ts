import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { db } from "@/db/database";
import { CategoryRepository } from "@/db/repositories/CategoryRepository";
import { CategoryService } from "@/services/CategoryService";
import { buildCategory } from "@/test/factories/categoryFactory";
import { useCategories } from "./useCategories";

const mockSchedulePush = vi.fn();

vi.mock("@/app/providers/SyncProvider", () => ({
  useSync: () => ({
    syncVersion: 0,
    syncStatus: "idle",
    pull: vi.fn(),
    push: vi.fn(),
    schedulePush: mockSchedulePush,
    lastSyncedAt: null,
  }),
}));

const categoryService = new CategoryService(new CategoryRepository());

describe("useCategories", () => {
  beforeEach(async () => {
    await db.categories.clear();
    mockSchedulePush.mockClear();
  });

  it("should set isLoading to true on initial render", () => {
    const { result } = renderHook(() => useCategories(categoryService));
    expect(result.current.isLoading).toBe(true);
  });

  it("should set isLoading to false after categories are loaded", async () => {
    const { result } = renderHook(() => useCategories(categoryService));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
  });

  it("should return empty array when no categories exist", async () => {
    const { result } = renderHook(() => useCategories(categoryService));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.categories).toEqual([]);
  });

  it("should return categories after loading", async () => {
    const category = buildCategory();
    await db.categories.add(category);
    const { result } = renderHook(() => useCategories(categoryService));
    await waitFor(() => expect(result.current.categories).toHaveLength(1));
    expect(result.current.categories[0].id).toBe(category.id);
  });

  it("should not return deleted categories", async () => {
    await db.categories.add(buildCategory({ is_deleted: true }));
    const { result } = renderHook(() => useCategories(categoryService));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.categories).toHaveLength(0);
  });

  it("should reactively update when a category is written to DB externally", async () => {
    const { result } = renderHook(() => useCategories(categoryService));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.categories).toHaveLength(0);

    await act(async () => {
      await db.categories.add(buildCategory());
    });

    await waitFor(() => expect(result.current.categories).toHaveLength(1));
  });

  describe("createCategory", () => {
    let result: { current: ReturnType<typeof useCategories> };

    beforeEach(async () => {
      ({ result } = renderHook(() => useCategories(categoryService)));
      await waitFor(() => expect(result.current.isLoading).toBe(false));
      await act(async () => {
        await result.current.createCategory("Work");
      });
    });

    it("should add category and show it in list", async () => {
      await waitFor(() => expect(result.current.categories).toHaveLength(1));
      expect(result.current.categories[0].name).toBe("Work");
    });

    it("should schedule push", () => {
      expect(mockSchedulePush).toHaveBeenCalledTimes(1);
    });
  });

  describe("updateCategory", () => {
    let category: ReturnType<typeof buildCategory>;
    let result: { current: ReturnType<typeof useCategories> };

    beforeEach(async () => {
      category = buildCategory({ name: "Old" });
      await db.categories.add(category);
      ({ result } = renderHook(() => useCategories(categoryService)));
      await waitFor(() => expect(result.current.categories).toHaveLength(1));
      await act(async () => {
        await result.current.updateCategory(category.id, "New");
      });
    });

    it("should update category name", async () => {
      await waitFor(() =>
        expect(result.current.categories[0].name).toBe("New"),
      );
    });

    it("should schedule push", () => {
      expect(mockSchedulePush).toHaveBeenCalledTimes(1);
    });
  });

  describe("deleteCategory", () => {
    let category: ReturnType<typeof buildCategory>;
    let result: { current: ReturnType<typeof useCategories> };

    beforeEach(async () => {
      category = buildCategory();
      await db.categories.add(category);
      ({ result } = renderHook(() => useCategories(categoryService)));
      await waitFor(() => expect(result.current.categories).toHaveLength(1));
      await act(async () => {
        await result.current.deleteCategory(category.id);
      });
    });

    it("should remove category from list", async () => {
      await waitFor(() => expect(result.current.categories).toHaveLength(0));
    });

    it("should schedule push", () => {
      expect(mockSchedulePush).toHaveBeenCalledTimes(1);
    });
  });
});

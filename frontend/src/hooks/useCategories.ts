import { useState, useEffect, useCallback } from "react";
import { liveQuery } from "dexie";
import type { Category } from "@/types/entities";
import { CategoryService } from "@/services/CategoryService";
import { CategoryRepository } from "@/db/repositories/CategoryRepository";
import { useSync } from "@/app/providers/SyncProvider";

const defaultCategoryService = new CategoryService(new CategoryRepository());

export interface UseCategoriesReturn {
  categories: Category[];
  isLoading: boolean;
  createCategory: (name: string) => Promise<void>;
  updateCategory: (id: string, name: string) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  reorderCategories: (orderedCategories: Category[]) => Promise<void>;
}

export function useCategories(
  categoryService: CategoryService = defaultCategoryService,
): UseCategoriesReturn {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { schedulePush } = useSync();

  useEffect(() => {
    setIsLoading(true);
    const subscription = liveQuery(() => categoryService.getAll()).subscribe({
      next: (allCategories) => {
        setCategories(allCategories);
        setIsLoading(false);
      },
    });
    return () => subscription.unsubscribe();
  }, [categoryService]);

  const createCategory = useCallback(
    async (name: string) => {
      await categoryService.create(name);
      schedulePush();
    },
    [categoryService, schedulePush],
  );

  const updateCategory = useCallback(
    async (id: string, name: string) => {
      await categoryService.update(id, name);
      schedulePush();
    },
    [categoryService, schedulePush],
  );

  const deleteCategory = useCallback(
    async (id: string) => {
      await categoryService.softDelete(id);
      schedulePush();
    },
    [categoryService, schedulePush],
  );

  const reorderCategories = useCallback(
    async (orderedCategories: Category[]) => {
      await categoryService.reorderCategories(orderedCategories);
      schedulePush();
    },
    [categoryService, schedulePush],
  );

  return {
    categories,
    isLoading,
    createCategory,
    updateCategory,
    deleteCategory,
    reorderCategories,
  };
}

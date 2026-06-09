import type { CategoryRepository } from "@/db/repositories/CategoryRepository";
import { type Clock, systemClock } from "@/lib/temporal";
import {
  compareSortKeys,
  generateAppendKey,
  needsRebalancing,
  rebalanceKeys,
} from "@/services/SortOrderService";
import type { Category } from "@/types/entities";
import { toISOTimestamp } from "@/utils/dateHelpers";
import { hasEntityChanged } from "@/utils/deepEqual";

export class CategoryService {
  constructor(
    private readonly categoryRepository: CategoryRepository,
    private readonly clock: Clock = systemClock,
  ) {}

  async getAll(): Promise<Category[]> {
    const categories = await this.categoryRepository.getActive();
    return categories.sort((categoryA, categoryB) =>
      compareSortKeys(
        String(categoryA.sort_order),
        String(categoryB.sort_order),
      ),
    );
  }

  async getById(id: string): Promise<Category | undefined> {
    return this.categoryRepository.getById(id);
  }

  async create(name: string): Promise<Category> {
    const existingCategories = await this.categoryRepository.getActive();
    const existingKeys = existingCategories.map((category) =>
      String(category.sort_order),
    );
    const now = toISOTimestamp(this.clock);
    const category: Category = {
      id: crypto.randomUUID(),
      name,
      sort_order: generateAppendKey(existingKeys),
      is_deleted: false,
      created_at: now,
      updated_at: now,
      revision: 0,
      needsSync: true,
    };
    await this.categoryRepository.create(category);
    return category;
  }

  async update(id: string, name: string): Promise<Category> {
    return this.applyChanges(id, { name });
  }

  async softDelete(id: string): Promise<Category> {
    return this.applyChanges(id, { is_deleted: true });
  }

  async restore(id: string): Promise<Category> {
    return this.applyChanges(id, { is_deleted: false });
  }

  async reorderCategories(
    categoryId: string,
    newSortOrder: string,
  ): Promise<void> {
    const category = await this.categoryRepository.getById(categoryId);
    if (!category) throw new Error(`Category not found: ${categoryId}`);

    const now = toISOTimestamp(this.clock);
    await this.categoryRepository.update({
      ...category,
      sort_order: newSortOrder,
      updated_at: now,
      needsSync: true,
    });

    if (needsRebalancing(newSortOrder)) {
      await this.rebalanceAllCategories();
    }
  }

  private async rebalanceAllCategories(): Promise<void> {
    const categories = await this.categoryRepository.getActive();
    const sorted = categories.sort((categoryA, categoryB) =>
      compareSortKeys(
        String(categoryA.sort_order),
        String(categoryB.sort_order),
      ),
    );
    const newKeys = rebalanceKeys(sorted.length);
    const now = toISOTimestamp(this.clock);
    const rebalancedCategories = sorted.map((category, index) => ({
      ...category,
      sort_order: newKeys[index],
      updated_at: now,
      needsSync: true,
    }));
    await this.categoryRepository.bulkUpsert(rebalancedCategories);
  }

  private async applyChanges(
    id: string,
    changes: Partial<Category>,
  ): Promise<Category> {
    const existingCategory = await this.categoryRepository.getById(id);
    if (!existingCategory) {
      throw new Error(`Category not found: ${id}`);
    }

    // Build the updated version without modifying metadata
    const candidateCategory: Category = {
      ...existingCategory,
      ...changes,
      id,
    };

    // Check whether anything actually changed
    const hasChanged = hasEntityChanged(existingCategory, candidateCategory);

    // Apply metadata only if there are changes
    const updatedCategory: Category = {
      ...candidateCategory,
      updated_at: hasChanged
        ? toISOTimestamp(this.clock)
        : existingCategory.updated_at,
      needsSync: hasChanged,
    };

    await this.categoryRepository.update(updatedCategory);
    return updatedCategory;
  }
}

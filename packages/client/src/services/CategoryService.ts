import type { CategoryRepository } from "@/db/repositories/CategoryRepository";
import { type Clock, systemClock } from "@/lib/temporal";
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
    return categories.sort(
      (categoryA, categoryB) => categoryA.sort_order - categoryB.sort_order,
    );
  }

  async getById(id: string): Promise<Category | undefined> {
    return this.categoryRepository.getById(id);
  }

  async create(name: string): Promise<Category> {
    const existingCategories = await this.categoryRepository.getActive();
    const now = toISOTimestamp(this.clock);
    const category: Category = {
      id: crypto.randomUUID(),
      name,
      sort_order: existingCategories.length,
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

  async reorderCategories(orderedCategories: Category[]): Promise<void> {
    if (orderedCategories.length === 0) return;

    // Check if at least one sort_order has changed
    const hasAnyOrderChanged = orderedCategories.some(
      (category, index) => category.sort_order !== index,
    );
    if (!hasAnyOrderChanged) {
      return; // Nothing changed, skip sync
    }

    const now = toISOTimestamp(this.clock);
    const updated = orderedCategories.map((category, index) => {
      const orderChanged = category.sort_order !== index;
      return {
        ...category,
        sort_order: index,
        updated_at: orderChanged ? now : category.updated_at,
        needsSync: orderChanged,
      };
    });
    await this.categoryRepository.bulkUpsert(updated);
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

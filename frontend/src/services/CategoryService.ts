import type { Category } from "@/types/entities";
import { CategoryRepository } from "@/db/repositories/CategoryRepository";
import { hasEntityChanged } from "@/utils/deepEqual";

export class CategoryService {
  constructor(private readonly categoryRepository: CategoryRepository) {}

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
    const now = new Date().toISOString();
    const category: Category = {
      id: crypto.randomUUID(),
      name,
      sort_order: existingCategories.length,
      is_deleted: false,
      created_at: now,
      updated_at: now,
      version: 1,
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

    // Проверяем, изменился ли хотя бы один sort_order
    const hasAnyOrderChanged = orderedCategories.some(
      (category, index) => category.sort_order !== index,
    );
    if (!hasAnyOrderChanged) {
      return; // Ничего не изменилось, не синхронизируем
    }

    const now = new Date().toISOString();
    const updated = orderedCategories.map((category, index) => {
      const orderChanged = category.sort_order !== index;
      return {
        ...category,
        sort_order: index,
        updated_at: orderChanged ? now : category.updated_at,
        version: orderChanged ? category.version + 1 : category.version,
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

    // Создаем обновленную версию без изменения метаданных
    const candidateCategory: Category = {
      ...existingCategory,
      ...changes,
      id,
    };

    // Проверяем, действительно ли что-то изменилось
    const hasChanged = hasEntityChanged(existingCategory, candidateCategory);

    // Применяем метаданные только если есть изменения
    const updatedCategory: Category = {
      ...candidateCategory,
      updated_at: hasChanged
        ? new Date().toISOString()
        : existingCategory.updated_at,
      version: hasChanged
        ? existingCategory.version + 1
        : existingCategory.version,
      needsSync: hasChanged,
    };

    await this.categoryRepository.update(updatedCategory);
    return updatedCategory;
  }
}

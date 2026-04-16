import type { ChecklistItem } from "@/types/entities";
import { ChecklistRepository } from "@/db/repositories/ChecklistRepository";
import { hasEntityChanged } from "@/utils/deepEqual";
import { toISOTimestamp } from "@/utils/dateHelpers";

export interface ChecklistProgress {
  completed: number;
  total: number;
}

export class ChecklistService {
  constructor(private readonly checklistRepository: ChecklistRepository) {}

  async getByTaskId(taskId: string): Promise<ChecklistItem[]> {
    const items = await this.checklistRepository.getByTaskId(taskId);
    return items.sort((itemA, itemB) => itemA.sort_order - itemB.sort_order);
  }

  async getById(id: string): Promise<ChecklistItem | undefined> {
    return this.checklistRepository.getById(id);
  }

  async create(taskId: string, name: string): Promise<ChecklistItem> {
    const existingItems = await this.checklistRepository.getByTaskId(taskId);
    const now = toISOTimestamp();
    const item: ChecklistItem = {
      id: crypto.randomUUID(),
      task_id: taskId,
      name,
      is_completed: false,
      sort_order: existingItems.length,
      is_deleted: false,
      created_at: now,
      updated_at: now,
      version: 1,
      revision: 0,
      needsSync: true,
    };
    await this.checklistRepository.create(item);
    return item;
  }

  async update(
    id: string,
    changes: Partial<ChecklistItem>,
  ): Promise<ChecklistItem> {
    return this.applyChanges(id, changes);
  }

  async toggle(id: string): Promise<ChecklistItem> {
    const existingItem = await this.checklistRepository.getById(id);
    if (!existingItem) {
      throw new Error(`ChecklistItem not found: ${id}`);
    }
    return this.applyChanges(id, { is_completed: !existingItem.is_completed });
  }

  async softDelete(id: string): Promise<ChecklistItem> {
    return this.applyChanges(id, { is_deleted: true });
  }

  async restore(id: string): Promise<ChecklistItem> {
    return this.applyChanges(id, { is_deleted: false });
  }

  async reorderItems(items: ChecklistItem[]): Promise<void> {
    if (items.length === 0) return;

    // Проверяем, изменился ли хотя бы один sort_order
    const hasAnyOrderChanged = items.some(
      (item, index) => item.sort_order !== index,
    );
    if (!hasAnyOrderChanged) {
      return; // Ничего не изменилось, не синхронизируем
    }

    const now = toISOTimestamp();
    const updatedItems = items.map((item, index) => {
      const orderChanged = item.sort_order !== index;
      return {
        ...item,
        sort_order: index,
        version: orderChanged ? item.version + 1 : item.version,
        updated_at: orderChanged ? now : item.updated_at,
        needsSync: orderChanged,
      };
    });
    await this.checklistRepository.bulkUpsert(updatedItems);
  }

  async getProgress(taskId: string): Promise<ChecklistProgress> {
    const items = await this.checklistRepository.getByTaskId(taskId);
    return {
      completed: items.filter((item) => item.is_completed).length,
      total: items.length,
    };
  }

  private async applyChanges(
    id: string,
    changes: Partial<ChecklistItem>,
  ): Promise<ChecklistItem> {
    const existingItem = await this.checklistRepository.getById(id);
    if (!existingItem) {
      throw new Error(`ChecklistItem not found: ${id}`);
    }

    // Создаем обновленную версию без изменения метаданных
    const candidateItem: ChecklistItem = {
      ...existingItem,
      ...changes,
      id,
    };

    // Проверяем, действительно ли что-то изменилось
    const hasChanged = hasEntityChanged(existingItem, candidateItem);

    // Применяем метаданные только если есть изменения
    const updatedItem: ChecklistItem = {
      ...candidateItem,
      updated_at: hasChanged
        ? toISOTimestamp()
        : existingItem.updated_at,
      version: hasChanged ? existingItem.version + 1 : existingItem.version,
      needsSync: hasChanged,
    };

    await this.checklistRepository.update(updatedItem);
    return updatedItem;
  }
}

import type { ChecklistRepository } from "@/db/repositories/ChecklistRepository";
import {
  compareSortKeys,
  generateAppendKey,
  needsRebalancing,
  rebalanceKeys,
} from "@/services/SortOrderService";
import type { ChecklistItem } from "@/types/entities";
import { toISOTimestamp } from "@/utils/dateHelpers";
import { hasEntityChanged } from "@/utils/deepEqual";

export interface ChecklistProgress {
  completed: number;
  total: number;
}

export class ChecklistService {
  constructor(private readonly checklistRepository: ChecklistRepository) {}

  async getByTaskId(taskId: string): Promise<ChecklistItem[]> {
    const items = await this.checklistRepository.getActiveByTaskId(taskId);
    return items.sort((itemA, itemB) =>
      compareSortKeys(String(itemA.sort_order), String(itemB.sort_order)),
    );
  }

  async getById(id: string): Promise<ChecklistItem | undefined> {
    return this.checklistRepository.getById(id);
  }

  async create(taskId: string, name: string): Promise<ChecklistItem> {
    const existingItems =
      await this.checklistRepository.getActiveByTaskId(taskId);
    const existingKeys = existingItems.map((item) => String(item.sort_order));
    const now = toISOTimestamp();
    const item: ChecklistItem = {
      id: crypto.randomUUID(),
      task_id: taskId,
      name,
      is_completed: false,
      sort_order: generateAppendKey(existingKeys),
      is_deleted: false,
      created_at: now,
      updated_at: now,
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

  async reorderItems(itemId: string, newSortOrder: string): Promise<void> {
    const item = await this.checklistRepository.getById(itemId);
    if (!item) throw new Error(`ChecklistItem not found: ${itemId}`);

    const now = toISOTimestamp();
    await this.checklistRepository.update({
      ...item,
      sort_order: newSortOrder,
      updated_at: now,
      needsSync: true,
    });

    if (needsRebalancing(newSortOrder)) {
      await this.rebalanceTaskItems(item.task_id);
    }
  }

  private async rebalanceTaskItems(taskId: string): Promise<void> {
    const items = await this.checklistRepository.getActiveByTaskId(taskId);
    const sorted = items.sort((itemA, itemB) =>
      compareSortKeys(String(itemA.sort_order), String(itemB.sort_order)),
    );
    const newKeys = rebalanceKeys(sorted.length);
    const now = toISOTimestamp();
    const rebalancedItems = sorted.map((item, index) => ({
      ...item,
      sort_order: newKeys[index],
      updated_at: now,
      needsSync: true,
    }));
    await this.checklistRepository.bulkUpsert(rebalancedItems);
  }

  async getProgress(taskId: string): Promise<ChecklistProgress> {
    const items = await this.checklistRepository.getActiveByTaskId(taskId);
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

    // Build the updated version without modifying metadata
    const candidateItem: ChecklistItem = {
      ...existingItem,
      ...changes,
      id,
    };

    // Check whether anything actually changed
    const hasChanged = hasEntityChanged(existingItem, candidateItem);

    // Apply metadata only if there are changes
    const updatedItem: ChecklistItem = {
      ...candidateItem,
      updated_at: hasChanged ? toISOTimestamp() : existingItem.updated_at,
      needsSync: hasChanged,
    };

    await this.checklistRepository.update(updatedItem);
    return updatedItem;
  }
}

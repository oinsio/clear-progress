import type { WireChecklistItem } from "@clear-progress/contract";
import type { ChecklistItem, ISOTimestamp } from "@/types/entities";
import { db } from "../database";

export class ChecklistRepository {
  async getAll(): Promise<ChecklistItem[]> {
    return db.checklist_items.toArray();
  }

  async getByTaskId(taskId: string): Promise<ChecklistItem[]> {
    return db.checklist_items
      .where("task_id")
      .equals(taskId)
      .filter((item) => !item.is_deleted)
      .toArray();
  }

  async getById(id: string): Promise<ChecklistItem | undefined> {
    return db.checklist_items.get(id);
  }

  async create(item: ChecklistItem): Promise<void> {
    await db.checklist_items.add(item);
  }

  async update(item: ChecklistItem): Promise<void> {
    await db.checklist_items.put(item);
  }

  async bulkUpsert(items: ChecklistItem[]): Promise<void> {
    await db.checklist_items.bulkPut(items);
  }

  async getChangedSince(since: string): Promise<ChecklistItem[]> {
    return db.checklist_items.where("updated_at").above(since).toArray();
  }

  async getNeedingSync(): Promise<ChecklistItem[]> {
    return db.checklist_items.filter((item) => item.needsSync).toArray();
  }

  async applyServerRecords(records: WireChecklistItem[]): Promise<void> {
    await db.transaction("rw", db.checklist_items, async () => {
      for (const serverRecord of records) {
        const localRecord = await db.checklist_items.get(serverRecord.id);
        if (!localRecord?.needsSync) {
          const item: ChecklistItem = {
            ...serverRecord,
            created_at: serverRecord.created_at as ISOTimestamp,
            updated_at: serverRecord.updated_at as ISOTimestamp,
            needsSync: false,
          };
          await db.checklist_items.put(item);
        }
      }
    });
  }
}

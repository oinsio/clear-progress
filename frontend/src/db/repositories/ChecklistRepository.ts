import type { ChecklistItem } from "@/types/entities";
import { db } from "../database";

export class ChecklistRepository {
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

  async getDirty(): Promise<ChecklistItem[]> {
    return db.checklist_items.filter((item) => item._dirty).toArray();
  }

  async applyServerRecords(records: ChecklistItem[]): Promise<void> {
    await db.transaction("rw", db.checklist_items, async () => {
      for (const serverRecord of records) {
        const localRecord = await db.checklist_items.get(serverRecord.id);
        if (!localRecord || !localRecord._dirty) {
          await db.checklist_items.put({ ...serverRecord, _dirty: false });
        }
      }
    });
  }
}

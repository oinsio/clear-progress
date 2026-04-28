import type { Category, ISOTimestamp } from "@/types/entities";
import type { WireCategory } from "@clear-progress/contract";
import { db } from "../database";

export class CategoryRepository {
  async getAll(): Promise<Category[]> {
    return db.categories.toArray();
  }

  async getActive(): Promise<Category[]> {
    return db.categories.filter((category) => !category.is_deleted).toArray();
  }

  async getById(id: string): Promise<Category | undefined> {
    return db.categories.get(id);
  }

  async create(category: Category): Promise<void> {
    await db.categories.add(category);
  }

  async update(category: Category): Promise<void> {
    await db.categories.put(category);
  }

  async bulkUpsert(categories: Category[]): Promise<void> {
    await db.categories.bulkPut(categories);
  }

  async getChangedSince(since: string): Promise<Category[]> {
    return db.categories.where("updated_at").above(since).toArray();
  }

  async getNeedingSync(): Promise<Category[]> {
    return db.categories.filter((category) => category.needsSync).toArray();
  }

  async applyServerRecords(records: WireCategory[]): Promise<void> {
    await db.transaction("rw", db.categories, async () => {
      for (const serverRecord of records) {
        const localRecord = await db.categories.get(serverRecord.id);
        if (!localRecord?.needsSync) {
          const category: Category = {
            ...serverRecord,
            created_at: serverRecord.created_at as ISOTimestamp,
            updated_at: serverRecord.updated_at as ISOTimestamp,
            needsSync: false,
          };
          await db.categories.put(category);
        }
      }
    });
  }
}

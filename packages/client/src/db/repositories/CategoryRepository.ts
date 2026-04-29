import type { WireCategory } from "@clear-progress/contract";
import { ClientCategorySchema } from "@/schemas/entities";
import type { Category, ISOTimestamp } from "@/types/entities";
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
    const result = ClientCategorySchema.safeParse(category);
    if (!result.success) {
      console.error("Invalid category before IndexedDB write:", result.error);
      throw new Error(`Invalid category data: ${result.error.message}`);
    }
    await db.categories.add(category);
  }

  async update(category: Category): Promise<void> {
    const result = ClientCategorySchema.safeParse(category);
    if (!result.success) {
      console.error("Invalid category before IndexedDB write:", result.error);
      throw new Error(`Invalid category data: ${result.error.message}`);
    }
    await db.categories.put(category);
  }

  async bulkUpsert(categories: Category[]): Promise<void> {
    for (const category of categories) {
      const result = ClientCategorySchema.safeParse(category);
      if (!result.success) {
        console.error("Invalid category in bulk operation:", result.error);
        throw new Error(`Invalid category data: ${result.error.message}`);
      }
    }
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

import type { WireCategory } from "@clear-progress/contract";
import { ClientCategorySchema } from "@/schemas/entities";
import type { Category, ISOTimestamp } from "@/types/entities";
import { db } from "../database";
import { shouldOverwritePendingLocalRecord } from "./applyServerRecordLww";

const CATEGORY_ENTITY_NAME = "category";

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

  async getNeedingSync(): Promise<Category[]> {
    return db.categories
      .filter((category) => category.syncStatus === "pending")
      .toArray();
  }

  /**
   * Implements FR5 of fix-stale-sync-overwrites.
   * A local `pending` record is overwritten only when the server record's
   * `updated_at` is strictly newer (LWW pull protection). Local records with
   * any other syncStatus, or no local record at all, are always overwritten.
   */
  async applyServerRecords(records: WireCategory[]): Promise<void> {
    await db.transaction("rw", db.categories, async () => {
      for (const serverRecord of records) {
        const localRecord = await db.categories.get(serverRecord.id);
        const shouldWrite =
          localRecord?.syncStatus !== "pending" ||
          shouldOverwritePendingLocalRecord({
            entityName: CATEGORY_ENTITY_NAME,
            id: serverRecord.id,
            localUpdatedAt: localRecord.updated_at,
            serverUpdatedAt: serverRecord.updated_at,
          });

        if (shouldWrite) {
          const category: Category = {
            ...serverRecord,
            created_at: serverRecord.created_at as ISOTimestamp,
            updated_at: serverRecord.updated_at as ISOTimestamp,
            syncStatus: "synced" as const,
          };
          await db.categories.put(category);
        }
      }
    });
  }
}

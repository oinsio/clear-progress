import type { Context } from "@/types/entities";
import { db } from "../database";

export class ContextRepository {
  async getActive(): Promise<Context[]> {
    return db.contexts.filter((context) => !context.is_deleted).toArray();
  }

  async getById(id: string): Promise<Context | undefined> {
    return db.contexts.get(id);
  }

  async create(context: Context): Promise<void> {
    await db.contexts.add(context);
  }

  async update(context: Context): Promise<void> {
    await db.contexts.put(context);
  }

  async bulkUpsert(contexts: Context[]): Promise<void> {
    await db.contexts.bulkPut(contexts);
  }

  async getChangedSince(since: string): Promise<Context[]> {
    return db.contexts.where("updated_at").above(since).toArray();
  }

  async getDirty(): Promise<Context[]> {
    return db.contexts.filter((context) => context._dirty).toArray();
  }

  async applyServerRecords(records: Context[]): Promise<void> {
    await db.transaction("rw", db.contexts, async () => {
      for (const serverRecord of records) {
        const localRecord = await db.contexts.get(serverRecord.id);
        if (!localRecord || !localRecord._dirty) {
          await db.contexts.put({ ...serverRecord, _dirty: false });
        }
      }
    });
  }
}

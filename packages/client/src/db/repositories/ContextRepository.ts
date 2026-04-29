import type { WireContext } from "@clear-progress/contract";
import { ClientContextSchema } from "@/schemas/entities";
import type { Context, ISOTimestamp } from "@/types/entities";
import { db } from "../database";

export class ContextRepository {
  async getAll(): Promise<Context[]> {
    return db.contexts.toArray();
  }

  async getActive(): Promise<Context[]> {
    return db.contexts.filter((context) => !context.is_deleted).toArray();
  }

  async getById(id: string): Promise<Context | undefined> {
    return db.contexts.get(id);
  }

  async create(context: Context): Promise<void> {
    const result = ClientContextSchema.safeParse(context);
    if (!result.success) {
      console.error("Invalid context before IndexedDB write:", result.error);
      throw new Error(`Invalid context data: ${result.error.message}`);
    }
    await db.contexts.add(context);
  }

  async update(context: Context): Promise<void> {
    const result = ClientContextSchema.safeParse(context);
    if (!result.success) {
      console.error("Invalid context before IndexedDB write:", result.error);
      throw new Error(`Invalid context data: ${result.error.message}`);
    }
    await db.contexts.put(context);
  }

  async bulkUpsert(contexts: Context[]): Promise<void> {
    for (const context of contexts) {
      const result = ClientContextSchema.safeParse(context);
      if (!result.success) {
        console.error("Invalid context in bulk operation:", result.error);
        throw new Error(`Invalid context data: ${result.error.message}`);
      }
    }
    await db.contexts.bulkPut(contexts);
  }

  async getChangedSince(since: string): Promise<Context[]> {
    return db.contexts.where("updated_at").above(since).toArray();
  }

  async getNeedingSync(): Promise<Context[]> {
    return db.contexts.filter((context) => context.needsSync).toArray();
  }

  async applyServerRecords(records: WireContext[]): Promise<void> {
    await db.transaction("rw", db.contexts, async () => {
      for (const serverRecord of records) {
        const localRecord = await db.contexts.get(serverRecord.id);
        if (!localRecord?.needsSync) {
          const context: Context = {
            ...serverRecord,
            created_at: serverRecord.created_at as ISOTimestamp,
            updated_at: serverRecord.updated_at as ISOTimestamp,
            needsSync: false,
          };
          await db.contexts.put(context);
        }
      }
    });
  }
}

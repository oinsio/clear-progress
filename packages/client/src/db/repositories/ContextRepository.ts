import type { WireContext } from "@clear-progress/contract";
import { ClientContextSchema } from "@/schemas/entities";
import type { Context, ISOTimestamp } from "@/types/entities";
import { db } from "../database";
import { shouldOverwritePendingLocalRecord } from "./applyServerRecordLww";

const CONTEXT_ENTITY_NAME = "context";

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
    return db.contexts
      .filter((context) => context.syncStatus === "pending")
      .toArray();
  }

  /**
   * Implements FR5 of fix-stale-sync-overwrites.
   * A local `pending` record is overwritten only when the server record's
   * `updated_at` is strictly newer (LWW pull protection). Local records with
   * any other syncStatus, or no local record at all, are always overwritten.
   */
  async applyServerRecords(records: WireContext[]): Promise<void> {
    await db.transaction("rw", db.contexts, async () => {
      for (const serverRecord of records) {
        const localRecord = await db.contexts.get(serverRecord.id);
        const shouldWrite =
          localRecord?.syncStatus !== "pending" ||
          shouldOverwritePendingLocalRecord({
            entityName: CONTEXT_ENTITY_NAME,
            id: serverRecord.id,
            localUpdatedAt: localRecord.updated_at,
            serverUpdatedAt: serverRecord.updated_at,
          });

        if (shouldWrite) {
          const context: Context = {
            ...serverRecord,
            created_at: serverRecord.created_at as ISOTimestamp,
            updated_at: serverRecord.updated_at as ISOTimestamp,
            syncStatus: "synced" as const,
          };
          await db.contexts.put(context);
        }
      }
    });
  }
}

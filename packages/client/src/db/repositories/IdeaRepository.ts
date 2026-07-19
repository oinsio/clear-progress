import type { WireIdea } from "@clear-progress/contract";
import { ClientIdeaSchema } from "@/schemas/entities";
import type { Idea, ISOTimestamp } from "@/types/entities";
import { db } from "../database";
import { shouldOverwritePendingLocalRecord } from "./applyServerRecordLww";

const IDEA_ENTITY_NAME = "idea";

export class IdeaRepository {
  async getAll(): Promise<Idea[]> {
    return db.ideas.toArray();
  }

  async getActive(): Promise<Idea[]> {
    return db.ideas.filter((idea) => !idea.is_deleted).toArray();
  }

  async getById(id: string): Promise<Idea | undefined> {
    return db.ideas.get(id);
  }

  async create(idea: Idea): Promise<void> {
    const result = ClientIdeaSchema.safeParse(idea);
    if (!result.success) {
      console.error("Invalid idea before IndexedDB write:", result.error);
      throw new Error(`Invalid idea data: ${result.error.message}`);
    }
    await db.ideas.add(idea);
  }

  async update(idea: Idea): Promise<void> {
    const result = ClientIdeaSchema.safeParse(idea);
    if (!result.success) {
      console.error("Invalid idea before IndexedDB write:", result.error);
      throw new Error(`Invalid idea data: ${result.error.message}`);
    }
    await db.ideas.put(idea);
  }

  async bulkUpsert(ideas: Idea[]): Promise<void> {
    for (const idea of ideas) {
      const result = ClientIdeaSchema.safeParse(idea);
      if (!result.success) {
        console.error("Invalid idea in bulk operation:", result.error);
        throw new Error(`Invalid idea data: ${result.error.message}`);
      }
    }
    await db.ideas.bulkPut(ideas);
  }

  async getNeedingSync(): Promise<Idea[]> {
    return db.ideas.filter((idea) => idea.syncStatus === "pending").toArray();
  }

  /**
   * Implements FR5 of fix-stale-sync-overwrites.
   * A local `pending` record is overwritten only when the server record's
   * `updated_at` is strictly newer (LWW pull protection). Local records with
   * any other syncStatus, or no local record at all, are always overwritten.
   */
  async applyServerRecords(records: WireIdea[]): Promise<void> {
    await db.transaction("rw", db.ideas, async () => {
      for (const serverRecord of records) {
        const localRecord = await db.ideas.get(serverRecord.id);
        const shouldWrite =
          localRecord?.syncStatus !== "pending" ||
          shouldOverwritePendingLocalRecord({
            entityName: IDEA_ENTITY_NAME,
            id: serverRecord.id,
            localUpdatedAt: localRecord.updated_at,
            serverUpdatedAt: serverRecord.updated_at,
          });

        if (shouldWrite) {
          const idea: Idea = {
            ...serverRecord,
            created_at: serverRecord.created_at as ISOTimestamp,
            updated_at: serverRecord.updated_at as ISOTimestamp,
            syncStatus: "synced" as const,
          };
          await db.ideas.put(idea);
        }
      }
    });
  }
}

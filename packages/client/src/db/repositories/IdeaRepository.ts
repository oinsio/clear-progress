import type { WireIdea } from "@clear-progress/contract";
import { ClientIdeaSchema } from "@/schemas/entities";
import type { Idea, ISOTimestamp } from "@/types/entities";
import { db } from "../database";

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

  async getChangedSince(since: string): Promise<Idea[]> {
    return db.ideas.where("updated_at").above(since).toArray();
  }

  async getNeedingSync(): Promise<Idea[]> {
    return db.ideas.filter((idea) => idea.syncStatus === "pending").toArray();
  }

  async applyServerRecords(records: WireIdea[]): Promise<void> {
    await db.transaction("rw", db.ideas, async () => {
      for (const serverRecord of records) {
        const localRecord = await db.ideas.get(serverRecord.id);
        if (localRecord?.syncStatus !== "pending") {
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

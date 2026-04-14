import type { Idea } from "@/types/entities";
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
    await db.ideas.add(idea);
  }

  async update(idea: Idea): Promise<void> {
    await db.ideas.put(idea);
  }

  async bulkUpsert(ideas: Idea[]): Promise<void> {
    await db.ideas.bulkPut(ideas);
  }

  async getChangedSince(since: string): Promise<Idea[]> {
    return db.ideas.where("updated_at").above(since).toArray();
  }

  async getNeedingSync(): Promise<Idea[]> {
    return db.ideas.filter((idea) => idea.needsSync).toArray();
  }

  async applyServerRecords(records: Idea[]): Promise<void> {
    await db.transaction("rw", db.ideas, async () => {
      for (const serverRecord of records) {
        const localRecord = await db.ideas.get(serverRecord.id);
        if (!localRecord || !localRecord.needsSync) {
          await db.ideas.put({ ...serverRecord, needsSync: false });
        }
      }
    });
  }
}

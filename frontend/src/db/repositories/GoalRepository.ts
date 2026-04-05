import type { Goal } from "@/types/entities";
import { db } from "../database";

export class GoalRepository {
  async getAll(): Promise<Goal[]> {
    return db.goals.toArray();
  }

  async getActive(): Promise<Goal[]> {
    return db.goals.filter((goal) => !goal.is_deleted).toArray();
  }

  async getById(id: string): Promise<Goal | undefined> {
    return db.goals.get(id);
  }

  async create(goal: Goal): Promise<void> {
    await db.goals.add(goal);
  }

  async update(goal: Goal): Promise<void> {
    await db.goals.put(goal);
  }

  async bulkUpsert(goals: Goal[]): Promise<void> {
    await db.goals.bulkPut(goals);
  }

  async getChangedSince(since: string): Promise<Goal[]> {
    return db.goals.where("updated_at").above(since).toArray();
  }

  async getDirty(): Promise<Goal[]> {
    return db.goals.filter((goal) => goal._dirty).toArray();
  }

  async applyServerRecords(records: Goal[]): Promise<void> {
    await db.transaction("rw", db.goals, async () => {
      for (const serverRecord of records) {
        const localRecord = await db.goals.get(serverRecord.id);
        if (!localRecord || !localRecord._dirty) {
          await db.goals.put({ ...serverRecord, _dirty: false });
        }
      }
    });
  }
}

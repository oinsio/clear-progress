import type { Goal, ISOTimestamp } from "@/types/entities";
import { db } from "../database";
import type { WireGoal } from "@clear-progress/contract";

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

  async getNeedingSync(): Promise<Goal[]> {
    return db.goals.filter((goal) => goal.needsSync).toArray();
  }

  async applyServerRecords(records: WireGoal[]): Promise<void> {
    await db.transaction("rw", db.goals, async () => {
      for (const serverRecord of records) {
        const localRecord = await db.goals.get(serverRecord.id);
        if (!localRecord?.needsSync) {
          const goal: Goal = {
            ...serverRecord,
            created_at: serverRecord.created_at as ISOTimestamp,
            updated_at: serverRecord.updated_at as ISOTimestamp,
            needsSync: false,
          };
          await db.goals.put(goal);
        }
      }
    });
  }
}

import type { WireGoal } from "@clear-progress/contract";
import { ClientGoalSchema } from "@/schemas/entities";
import type { Goal, ISOTimestamp } from "@/types/entities";
import { db } from "../database";
import { shouldOverwritePendingLocalRecord } from "./applyServerRecordLww";

const GOAL_ENTITY_NAME = "goal";

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
    const result = ClientGoalSchema.safeParse(goal);
    if (!result.success) {
      console.error("Invalid goal before IndexedDB write:", result.error);
      throw new Error(`Invalid goal data: ${result.error.message}`);
    }
    await db.goals.add(goal);
  }

  async update(goal: Goal): Promise<void> {
    const result = ClientGoalSchema.safeParse(goal);
    if (!result.success) {
      console.error("Invalid goal before IndexedDB write:", result.error);
      throw new Error(`Invalid goal data: ${result.error.message}`);
    }
    await db.goals.put(goal);
  }

  async bulkUpsert(goals: Goal[]): Promise<void> {
    for (const goal of goals) {
      const result = ClientGoalSchema.safeParse(goal);
      if (!result.success) {
        console.error("Invalid goal in bulk operation:", result.error);
        throw new Error(`Invalid goal data: ${result.error.message}`);
      }
    }
    await db.goals.bulkPut(goals);
  }

  async getNeedingSync(): Promise<Goal[]> {
    return db.goals.filter((goal) => goal.syncStatus === "pending").toArray();
  }

  /**
   * Implements FR5 of fix-stale-sync-overwrites.
   * A local `pending` record is overwritten only when the server record's
   * `updated_at` is strictly newer (LWW pull protection). Local records with
   * any other syncStatus, or no local record at all, are always overwritten.
   */
  async applyServerRecords(records: WireGoal[]): Promise<void> {
    await db.transaction("rw", db.goals, async () => {
      for (const serverRecord of records) {
        const localRecord = await db.goals.get(serverRecord.id);
        const shouldWrite =
          localRecord?.syncStatus !== "pending" ||
          shouldOverwritePendingLocalRecord({
            entityName: GOAL_ENTITY_NAME,
            id: serverRecord.id,
            localUpdatedAt: localRecord.updated_at,
            serverUpdatedAt: serverRecord.updated_at,
          });

        if (shouldWrite) {
          const goal: Goal = {
            ...serverRecord,
            created_at: serverRecord.created_at as ISOTimestamp,
            updated_at: serverRecord.updated_at as ISOTimestamp,
            syncStatus: "synced" as const,
          };
          await db.goals.put(goal);
        }
      }
    });
  }
}

import type { WireTask } from "@clear-progress/contract";
import { Temporal } from "@/lib/temporal";
import { ClientTaskSchema } from "@/schemas/entities";
import type { Box } from "@/types/common";
import type { ISODate, ISOTimestamp, Task } from "@/types/entities";
import { sanitizeDateOnly } from "@/utils/dateHelpers";
import { db } from "../database";

export class TaskRepository {
  async getAll(): Promise<Task[]> {
    return db.tasks.toArray();
  }

  async getActive(): Promise<Task[]> {
    return db.tasks
      .filter((task) => !task.is_deleted && !task.is_hidden)
      .toArray();
  }

  async getByBox(box: Box): Promise<Task[]> {
    return db.tasks
      .where("box")
      .equals(box)
      .filter((task) => !task.is_deleted)
      .toArray();
  }

  async getById(id: string): Promise<Task | undefined> {
    return db.tasks.get(id);
  }

  async getByGoalId(goalId: string): Promise<Task[]> {
    return db.tasks
      .where("goal_id")
      .equals(goalId)
      .filter((task) => !task.is_deleted && !task.is_hidden)
      .toArray();
  }

  async getActiveIncomplete(): Promise<Task[]> {
    return db.tasks
      .filter(
        (task) => !task.is_deleted && !task.is_completed && !task.is_hidden,
      )
      .toArray();
  }

  async getByCategoryId(categoryId: string): Promise<Task[]> {
    return db.tasks
      .where("category_id")
      .equals(categoryId)
      .filter(
        (task) => !task.is_deleted && !task.is_completed && !task.is_hidden,
      )
      .toArray();
  }

  async getByContextId(contextId: string): Promise<Task[]> {
    return db.tasks
      .where("context_id")
      .equals(contextId)
      .filter(
        (task) => !task.is_deleted && !task.is_completed && !task.is_hidden,
      )
      .toArray();
  }

  async create(task: Task): Promise<void> {
    const result = ClientTaskSchema.safeParse(task);
    if (!result.success) {
      console.error("Invalid task before IndexedDB write:", result.error);
      throw new Error(`Invalid task data: ${result.error.message}`);
    }
    await db.tasks.add(task);
  }

  async update(task: Task): Promise<void> {
    const result = ClientTaskSchema.safeParse(task);
    if (!result.success) {
      console.error("Invalid task before IndexedDB write:", result.error);
      throw new Error(`Invalid task data: ${result.error.message}`);
    }
    await db.tasks.put(task);
  }

  async bulkUpsert(tasks: Task[]): Promise<void> {
    for (const task of tasks) {
      const result = ClientTaskSchema.safeParse(task);
      if (!result.success) {
        console.error("Invalid task in bulk operation:", result.error);
        throw new Error(`Invalid task data: ${result.error.message}`);
      }
    }
    await db.tasks.bulkPut(tasks);
  }

  async getByMinVersion(minVersion: number): Promise<Task[]> {
    return db.tasks.where("version").above(minVersion).toArray();
  }

  async getCompleted(): Promise<Task[]> {
    return db.tasks
      .filter(
        (task) => !task.is_deleted && task.is_completed && !task.is_hidden,
      )
      .toArray();
  }

  async getChangedSince(since: string): Promise<Task[]> {
    return db.tasks.where("updated_at").above(since).toArray();
  }

  async getNeedingSync(): Promise<Task[]> {
    return db.tasks.filter((task) => task.needsSync).toArray();
  }

  async getTasksToReveal(currentDate: string): Promise<Task[]> {
    return db.tasks
      .filter((task) => {
        if (!task.is_hidden || task.is_deleted || task.is_completed)
          return false;
        if (task.appear_date === "") return false;
        const sanitized = sanitizeDateOnly(task.appear_date);
        if (!sanitized) return false;
        return (
          Temporal.PlainDate.compare(
            Temporal.PlainDate.from(sanitized),
            Temporal.PlainDate.from(currentDate),
          ) <= 0
        );
      })
      .toArray();
  }

  async applyServerRecords(records: WireTask[]): Promise<void> {
    await db.transaction("rw", db.tasks, async () => {
      for (const serverRecord of records) {
        const localRecord = await db.tasks.get(serverRecord.id);
        if (!localRecord?.needsSync) {
          const sanitizedRecord: Task = {
            ...serverRecord,
            next_date: (sanitizeDateOnly(serverRecord.next_date) || "") as
              | ISODate
              | "",
            appear_date: (sanitizeDateOnly(serverRecord.appear_date) || "") as
              | ISODate
              | "",
            created_at: serverRecord.created_at as ISOTimestamp,
            updated_at: serverRecord.updated_at as ISOTimestamp,
            completed_at: serverRecord.completed_at as ISOTimestamp | "",
            needsSync: false,
          };
          await db.tasks.put(sanitizedRecord);
        }
      }
    });
  }

  async findHiddenRecurringTask(
    originalTaskId: string,
  ): Promise<Task | undefined> {
    const hiddenTasks = await db.tasks
      .where("original_task_id")
      .equals(originalTaskId)
      .filter(
        (task) => task.is_hidden && !task.is_deleted && !task.is_completed,
      )
      .toArray();
    return hiddenTasks[0];
  }

  async findByOriginalTaskId(originalTaskId: string): Promise<Task[]> {
    return db.tasks.where("original_task_id").equals(originalTaskId).toArray();
  }
}

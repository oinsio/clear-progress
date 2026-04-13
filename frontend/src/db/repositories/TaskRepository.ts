import type { Task } from "@/types/entities";
import type { Box } from "@/types/common";
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
      .filter((task) => !task.is_deleted && !task.is_completed && !task.is_hidden)
      .toArray();
  }

  async getByCategoryId(categoryId: string): Promise<Task[]> {
    return db.tasks
      .where("category_id")
      .equals(categoryId)
      .filter((task) => !task.is_deleted && !task.is_completed && !task.is_hidden)
      .toArray();
  }

  async getByContextId(contextId: string): Promise<Task[]> {
    return db.tasks
      .where("context_id")
      .equals(contextId)
      .filter((task) => !task.is_deleted && !task.is_completed && !task.is_hidden)
      .toArray();
  }

  async create(task: Task): Promise<void> {
    await db.tasks.add(task);
  }

  async update(task: Task): Promise<void> {
    await db.tasks.put(task);
  }

  async bulkUpsert(tasks: Task[]): Promise<void> {
    await db.tasks.bulkPut(tasks);
  }

  async getByMinVersion(minVersion: number): Promise<Task[]> {
    return db.tasks.where("version").above(minVersion).toArray();
  }

  async getCompleted(): Promise<Task[]> {
    return db.tasks
      .filter((task) => !task.is_deleted && task.is_completed && !task.is_hidden)
      .toArray();
  }

  async getChangedSince(since: string): Promise<Task[]> {
    return db.tasks.where("updated_at").above(since).toArray();
  }

  async getDirty(): Promise<Task[]> {
    return db.tasks.filter((task) => task._dirty).toArray();
  }

  async getTasksToReveal(currentDate: string): Promise<Task[]> {
    return db.tasks
      .where("is_hidden")
      .equals(1)
      .filter((task) => task.appear_date !== "" && task.appear_date <= currentDate)
      .toArray();
  }

  async applyServerRecords(records: Task[]): Promise<void> {
    await db.transaction("rw", db.tasks, async () => {
      for (const serverRecord of records) {
        const localRecord = await db.tasks.get(serverRecord.id);
        if (!localRecord || !localRecord._dirty) {
          await db.tasks.put({ ...serverRecord, _dirty: false });
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
        (task) =>
          task.is_hidden && !task.is_deleted && !task.is_completed,
      )
      .toArray();
    return hiddenTasks[0];
  }

  async findByOriginalTaskId(originalTaskId: string): Promise<Task[]> {
    return db.tasks
      .where("original_task_id")
      .equals(originalTaskId)
      .toArray();
  }
}

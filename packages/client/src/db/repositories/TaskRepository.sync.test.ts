import { describe, expect, it } from "vitest";
import { buildTask } from "@/test/factories/taskFactory";
import { db } from "../database";
import { createTaskRepositorySetup } from "./TaskRepository.test-setup";

describe("TaskRepository", () => {
  const { getRepository } = createTaskRepositorySetup();

  describe("getCompleted", () => {
    it("should return only non-deleted completed tasks", async () => {
      const completedTask = buildTask({
        is_completed: true,
        is_deleted: false,
      });
      const incompleteTask = buildTask({
        is_completed: false,
        is_deleted: false,
      });
      const deletedCompletedTask = buildTask({
        is_completed: true,
        is_deleted: true,
      });
      await db.tasks.bulkAdd([
        completedTask,
        incompleteTask,
        deletedCompletedTask,
      ]);

      const tasks = await getRepository().getCompleted();
      expect(tasks).toHaveLength(1);
      expect(tasks[0].id).toBe(completedTask.id);
    });

    it("should return empty array when no completed tasks exist", async () => {
      const task = buildTask({ is_completed: false });
      await db.tasks.add(task);

      const tasks = await getRepository().getCompleted();
      expect(tasks).toEqual([]);
    });
  });

  describe("getNeedingSync", () => {
    it("should return only syncStatus tasks", async () => {
      const syncStatusTask = buildTask({ syncStatus: "pending" as const });
      const cleanTask = buildTask({ syncStatus: "synced" as const });
      await db.tasks.bulkAdd([syncStatusTask, cleanTask]);

      const syncStatusTasks = await getRepository().getNeedingSync();
      expect(syncStatusTasks).toHaveLength(1);
      expect(syncStatusTasks[0].id).toBe(syncStatusTask.id);
    });

    it("should return empty array when no syncStatus tasks exist", async () => {
      const cleanTask = buildTask({ syncStatus: "synced" as const });
      await db.tasks.add(cleanTask);

      const syncStatusTasks = await getRepository().getNeedingSync();
      expect(syncStatusTasks).toEqual([]);
    });
  });

  describe("applyServerRecords", () => {
    it("should insert new records with syncStatus = false", async () => {
      const serverTask = buildTask({
        syncStatus: "synced" as const,
        revision: 5,
      });

      await getRepository().applyServerRecords([serverTask]);

      const saved = await db.tasks.get(serverTask.id);
      expect(saved).toBeDefined();
      expect(saved?.syncStatus).toBe("synced");
      expect(saved?.revision).toBe(5);
    });

    it("should overwrite clean local records with server version", async () => {
      const localTask = buildTask({
        name: "local",
        syncStatus: "synced" as const,
        revision: 1,
      });
      await db.tasks.add(localTask);

      const serverTask = { ...localTask, name: "server", revision: 2 };
      await getRepository().applyServerRecords([serverTask]);

      const saved = await db.tasks.get(localTask.id);
      expect(saved?.name).toBe("server");
      expect(saved?.syncStatus).toBe("synced");
    });

    it("should skip syncStatus local records", async () => {
      const localTask = buildTask({
        name: "local syncStatus",
        syncStatus: "pending" as const,
        revision: 1,
      });
      await db.tasks.add(localTask);

      const serverTask = { ...localTask, name: "server", revision: 2 };
      await getRepository().applyServerRecords([serverTask]);

      const saved = await db.tasks.get(localTask.id);
      expect(saved?.name).toBe("local syncStatus");
      expect(saved?.syncStatus).toBe("pending");
    });
  });
});

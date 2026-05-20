import { describe, expect, it } from "vitest";
import { Temporal } from "@/lib/temporal";
import { buildTask } from "@/test/factories/taskFactory";
import { toISOTimestamp } from "@/utils/dateHelpers";
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

  describe("getChangedSince", () => {
    it("should return tasks with updated_at after since", async () => {
      const oldTask = buildTask({
        updated_at: toISOTimestamp(
          Temporal.Instant.from("2026-01-01T00:00:00.000Z"),
        ),
      });
      const newTask = buildTask({
        updated_at: toISOTimestamp(
          Temporal.Instant.from("2026-03-01T00:00:00.000Z"),
        ),
      });
      await db.tasks.bulkAdd([oldTask, newTask]);

      const tasks = await getRepository().getChangedSince(
        "2026-02-01T00:00:00.000Z",
      );
      expect(tasks).toHaveLength(1);
      expect(tasks[0].id).toBe(newTask.id);
    });

    it("should return empty array when no tasks are newer than since", async () => {
      const task = buildTask({
        updated_at: toISOTimestamp(
          Temporal.Instant.from("2026-01-01T00:00:00.000Z"),
        ),
      });
      await db.tasks.add(task);

      const tasks = await getRepository().getChangedSince(
        "2026-06-01T00:00:00.000Z",
      );
      expect(tasks).toEqual([]);
    });

    it("should not include tasks with updated_at equal to since", async () => {
      const timestamp = toISOTimestamp(
        Temporal.Instant.from("2026-03-01T00:00:00.000Z"),
      );
      const task = buildTask({ updated_at: timestamp });
      await db.tasks.add(task);

      const tasks = await getRepository().getChangedSince(timestamp);
      expect(tasks).toEqual([]);
    });

    it("should include soft-deleted tasks that changed after since", async () => {
      const deletedTask = buildTask({
        is_deleted: true,
        updated_at: toISOTimestamp(
          Temporal.Instant.from("2026-03-01T00:00:00.000Z"),
        ),
      });
      await db.tasks.add(deletedTask);

      const tasks = await getRepository().getChangedSince(
        "2026-01-01T00:00:00.000Z",
      );
      expect(tasks).toHaveLength(1);
      expect(tasks[0].id).toBe(deletedTask.id);
    });
  });

  describe("getNeedingSync", () => {
    it("should return only needsSync tasks", async () => {
      const needsSyncTask = buildTask({ needsSync: true });
      const cleanTask = buildTask({ needsSync: false });
      await db.tasks.bulkAdd([needsSyncTask, cleanTask]);

      const needsSyncTasks = await getRepository().getNeedingSync();
      expect(needsSyncTasks).toHaveLength(1);
      expect(needsSyncTasks[0].id).toBe(needsSyncTask.id);
    });

    it("should return empty array when no needsSync tasks exist", async () => {
      const cleanTask = buildTask({ needsSync: false });
      await db.tasks.add(cleanTask);

      const needsSyncTasks = await getRepository().getNeedingSync();
      expect(needsSyncTasks).toEqual([]);
    });
  });

  describe("applyServerRecords", () => {
    it("should insert new records with needsSync = false", async () => {
      const serverTask = buildTask({ needsSync: false, revision: 5 });

      await getRepository().applyServerRecords([serverTask]);

      const saved = await db.tasks.get(serverTask.id);
      expect(saved).toBeDefined();
      expect(saved?.needsSync).toBe(false);
      expect(saved?.revision).toBe(5);
    });

    it("should overwrite clean local records with server version", async () => {
      const localTask = buildTask({
        name: "local",
        needsSync: false,
        revision: 1,
      });
      await db.tasks.add(localTask);

      const serverTask = { ...localTask, name: "server", revision: 2 };
      await getRepository().applyServerRecords([serverTask]);

      const saved = await db.tasks.get(localTask.id);
      expect(saved?.name).toBe("server");
      expect(saved?.needsSync).toBe(false);
    });

    it("should skip needsSync local records", async () => {
      const localTask = buildTask({
        name: "local needsSync",
        needsSync: true,
        revision: 1,
      });
      await db.tasks.add(localTask);

      const serverTask = { ...localTask, name: "server", revision: 2 };
      await getRepository().applyServerRecords([serverTask]);

      const saved = await db.tasks.get(localTask.id);
      expect(saved?.name).toBe("local needsSync");
      expect(saved?.needsSync).toBe(true);
    });
  });
});

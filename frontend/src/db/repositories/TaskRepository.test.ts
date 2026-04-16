import { describe, it, expect, beforeEach } from "vitest";
import { TaskRepository } from "./TaskRepository";
import { db } from "../database";
import { buildTask } from "@/test/factories/taskFactory";
import { toISOTimestamp } from "@/utils/dateHelpers";
import { Temporal } from "@/lib/temporal";

describe("TaskRepository", () => {
  let taskRepository: TaskRepository;

  beforeEach(async () => {
    await db.tasks.clear();
    taskRepository = new TaskRepository();
  });

  describe("getAll", () => {
    it("should return empty array when no tasks exist", async () => {
      const tasks = await taskRepository.getAll();
      expect(tasks).toEqual([]);
    });

    it("should return all tasks including deleted ones", async () => {
      const activeTask = buildTask({ is_deleted: false });
      const deletedTask = buildTask({ is_deleted: true });
      await db.tasks.bulkAdd([activeTask, deletedTask]);

      const tasks = await taskRepository.getAll();
      expect(tasks).toHaveLength(2);
    });
  });

  describe("getActive", () => {
    it("should return only non-deleted tasks", async () => {
      const activeTask = buildTask({ is_deleted: false });
      const deletedTask = buildTask({ is_deleted: true });
      await db.tasks.bulkAdd([activeTask, deletedTask]);

      const tasks = await taskRepository.getActive();
      expect(tasks).toHaveLength(1);
      expect(tasks[0].id).toBe(activeTask.id);
    });

    it("should return empty array when all tasks are deleted", async () => {
      const deletedTask = buildTask({ is_deleted: true });
      await db.tasks.add(deletedTask);

      const tasks = await taskRepository.getActive();
      expect(tasks).toEqual([]);
    });
  });

  describe("getByBox", () => {
    it("should return only non-deleted tasks for the specified box", async () => {
      const inboxTask = buildTask({ box: "inbox", is_deleted: false });
      const todayTask = buildTask({ box: "today", is_deleted: false });
      const deletedInboxTask = buildTask({ box: "inbox", is_deleted: true });
      await db.tasks.bulkAdd([inboxTask, todayTask, deletedInboxTask]);

      const tasks = await taskRepository.getByBox("inbox");
      expect(tasks).toHaveLength(1);
      expect(tasks[0].id).toBe(inboxTask.id);
    });

    it("should not return tasks from a different box", async () => {
      const todayTask = buildTask({ box: "today" });
      await db.tasks.add(todayTask);

      const tasks = await taskRepository.getByBox("inbox");
      expect(tasks).toEqual([]);
    });

    it("should not return soft-deleted tasks", async () => {
      const deletedTask = buildTask({ box: "inbox", is_deleted: true });
      await db.tasks.add(deletedTask);

      const tasks = await taskRepository.getByBox("inbox");
      expect(tasks).toEqual([]);
    });
  });

  describe("getById", () => {
    it("should return the task when found", async () => {
      const task = buildTask();
      await db.tasks.add(task);

      const foundTask = await taskRepository.getById(task.id);
      expect(foundTask).toBeDefined();
      expect(foundTask?.id).toBe(task.id);
    });

    it("should return undefined when task not found", async () => {
      const result = await taskRepository.getById("nonexistent-id");
      expect(result).toBeUndefined();
    });
  });

  describe("getByGoalId", () => {
    it("should return non-deleted tasks for the specified goal", async () => {
      const goalTask = buildTask({ goal_id: "goal-1", is_deleted: false });
      const deletedGoalTask = buildTask({
        goal_id: "goal-1",
        is_deleted: true,
      });
      const otherTask = buildTask({ goal_id: "goal-2", is_deleted: false });
      await db.tasks.bulkAdd([goalTask, deletedGoalTask, otherTask]);

      const tasks = await taskRepository.getByGoalId("goal-1");
      expect(tasks).toHaveLength(1);
      expect(tasks[0].id).toBe(goalTask.id);
    });
  });

  describe("getActiveIncomplete", () => {
    it("should return only non-deleted and non-completed tasks", async () => {
      const activeTask = buildTask({ is_deleted: false, is_completed: false });
      const completedTask = buildTask({
        is_deleted: false,
        is_completed: true,
      });
      const deletedTask = buildTask({ is_deleted: true, is_completed: false });
      await db.tasks.bulkAdd([activeTask, completedTask, deletedTask]);

      const tasks = await taskRepository.getActiveIncomplete();
      expect(tasks).toHaveLength(1);
      expect(tasks[0].id).toBe(activeTask.id);
    });
  });

  describe("getByCategoryId", () => {
    it("should return non-deleted, non-completed tasks for the category", async () => {
      const categoryTask = buildTask({
        category_id: "cat-1",
        is_deleted: false,
        is_completed: false,
      });
      const completedCategoryTask = buildTask({
        category_id: "cat-1",
        is_deleted: false,
        is_completed: true,
      });
      const deletedCategoryTask = buildTask({
        category_id: "cat-1",
        is_deleted: true,
        is_completed: false,
      });
      await db.tasks.bulkAdd([
        categoryTask,
        completedCategoryTask,
        deletedCategoryTask,
      ]);

      const tasks = await taskRepository.getByCategoryId("cat-1");
      expect(tasks).toHaveLength(1);
      expect(tasks[0].id).toBe(categoryTask.id);
    });
  });

  describe("getByContextId", () => {
    it("should return non-deleted, non-completed tasks for the context", async () => {
      const contextTask = buildTask({
        context_id: "ctx-1",
        is_deleted: false,
        is_completed: false,
      });
      const completedContextTask = buildTask({
        context_id: "ctx-1",
        is_deleted: false,
        is_completed: true,
      });
      const deletedContextTask = buildTask({
        context_id: "ctx-1",
        is_deleted: true,
        is_completed: false,
      });
      await db.tasks.bulkAdd([
        contextTask,
        completedContextTask,
        deletedContextTask,
      ]);

      const tasks = await taskRepository.getByContextId("ctx-1");
      expect(tasks).toHaveLength(1);
      expect(tasks[0].id).toBe(contextTask.id);
    });
  });

  describe("create", () => {
    it("should save the task to the database", async () => {
      const task = buildTask();
      await taskRepository.create(task);

      const savedTask = await db.tasks.get(task.id);
      expect(savedTask).toBeDefined();
      expect(savedTask?.id).toBe(task.id);
      expect(savedTask?.name).toBe(task.name);
    });

    it("should persist all task fields", async () => {
      const task = buildTask({
        name: "My task",
        box: "today",
        description: "some description",
      });
      await taskRepository.create(task);

      const savedTask = await db.tasks.get(task.id);
      expect(savedTask?.name).toBe("My task");
      expect(savedTask?.box).toBe("today");
      expect(savedTask?.description).toBe("some description");
    });
  });

  describe("update", () => {
    it("should update an existing task", async () => {
      const task = buildTask({ name: "Old name" });
      await db.tasks.add(task);

      const updatedTask = { ...task, name: "New name" };
      await taskRepository.update(updatedTask);

      const savedTask = await db.tasks.get(task.id);
      expect(savedTask?.name).toBe("New name");
    });
  });

  describe("bulkUpsert", () => {
    it("should insert multiple tasks", async () => {
      const tasks = [buildTask(), buildTask(), buildTask()];
      await taskRepository.bulkUpsert(tasks);

      const allTasks = await db.tasks.toArray();
      expect(allTasks).toHaveLength(3);
    });

    it("should update existing tasks", async () => {
      const task = buildTask({ name: "Original" });
      await db.tasks.add(task);

      const updatedTask = { ...task, name: "Updated" };
      await taskRepository.bulkUpsert([updatedTask]);

      const savedTask = await db.tasks.get(task.id);
      expect(savedTask?.name).toBe("Updated");
    });
  });

  describe("getByMinVersion", () => {
    it("should return tasks with version greater than minVersion", async () => {
      const taskV1 = buildTask({ version: 1 });
      const taskV2 = buildTask({ version: 2 });
      const taskV5 = buildTask({ version: 5 });
      await db.tasks.bulkAdd([taskV1, taskV2, taskV5]);

      const tasks = await taskRepository.getByMinVersion(2);
      expect(tasks).toHaveLength(1);
      expect(tasks[0].id).toBe(taskV5.id);
    });

    it("should return empty array when no tasks exceed minVersion", async () => {
      const task = buildTask({ version: 3 });
      await db.tasks.add(task);

      const tasks = await taskRepository.getByMinVersion(5);
      expect(tasks).toEqual([]);
    });
  });

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

      const tasks = await taskRepository.getCompleted();
      expect(tasks).toHaveLength(1);
      expect(tasks[0].id).toBe(completedTask.id);
    });

    it("should return empty array when no completed tasks exist", async () => {
      const task = buildTask({ is_completed: false });
      await db.tasks.add(task);

      const tasks = await taskRepository.getCompleted();
      expect(tasks).toEqual([]);
    });
  });

  describe("getChangedSince", () => {
    it("should return tasks with updated_at after since", async () => {
      const oldTask = buildTask({ updated_at: toISOTimestamp(Temporal.Instant.from("2026-01-01T00:00:00.000Z")) });
      const newTask = buildTask({ updated_at: toISOTimestamp(Temporal.Instant.from("2026-03-01T00:00:00.000Z")) });
      await db.tasks.bulkAdd([oldTask, newTask]);

      const tasks = await taskRepository.getChangedSince(
        "2026-02-01T00:00:00.000Z",
      );
      expect(tasks).toHaveLength(1);
      expect(tasks[0].id).toBe(newTask.id);
    });

    it("should return empty array when no tasks are newer than since", async () => {
      const task = buildTask({ updated_at: toISOTimestamp(Temporal.Instant.from("2026-01-01T00:00:00.000Z")) });
      await db.tasks.add(task);

      const tasks = await taskRepository.getChangedSince(
        "2026-06-01T00:00:00.000Z",
      );
      expect(tasks).toEqual([]);
    });

    it("should not include tasks with updated_at equal to since", async () => {
      const timestamp = toISOTimestamp(Temporal.Instant.from("2026-03-01T00:00:00.000Z"));
      const task = buildTask({ updated_at: timestamp });
      await db.tasks.add(task);

      const tasks = await taskRepository.getChangedSince(timestamp);
      expect(tasks).toEqual([]);
    });

    it("should include soft-deleted tasks that changed after since", async () => {
      const deletedTask = buildTask({
        is_deleted: true,
        updated_at: toISOTimestamp(Temporal.Instant.from("2026-03-01T00:00:00.000Z")),
      });
      await db.tasks.add(deletedTask);

      const tasks = await taskRepository.getChangedSince(
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

      const needsSyncTasks = await taskRepository.getNeedingSync();
      expect(needsSyncTasks).toHaveLength(1);
      expect(needsSyncTasks[0].id).toBe(needsSyncTask.id);
    });

    it("should return empty array when no needsSync tasks exist", async () => {
      const cleanTask = buildTask({ needsSync: false });
      await db.tasks.add(cleanTask);

      const needsSyncTasks = await taskRepository.getNeedingSync();
      expect(needsSyncTasks).toEqual([]);
    });
  });

  describe("applyServerRecords", () => {
    it("should insert new records with needsSync = false", async () => {
      const serverTask = buildTask({ needsSync: false, revision: 5 });

      await taskRepository.applyServerRecords([serverTask]);

      const saved = await db.tasks.get(serverTask.id);
      expect(saved).toBeDefined();
      expect(saved!.needsSync).toBe(false);
      expect(saved!.revision).toBe(5);
    });

    it("should overwrite clean local records with server version", async () => {
      const localTask = buildTask({
        name: "local",
        needsSync: false,
        revision: 1,
      });
      await db.tasks.add(localTask);

      const serverTask = { ...localTask, name: "server", revision: 2 };
      await taskRepository.applyServerRecords([serverTask]);

      const saved = await db.tasks.get(localTask.id);
      expect(saved!.name).toBe("server");
      expect(saved!.needsSync).toBe(false);
    });

    it("should skip needsSync local records", async () => {
      const localTask = buildTask({
        name: "local needsSync",
        needsSync: true,
        revision: 1,
      });
      await db.tasks.add(localTask);

      const serverTask = { ...localTask, name: "server", revision: 2 };
      await taskRepository.applyServerRecords([serverTask]);

      const saved = await db.tasks.get(localTask.id);
      expect(saved!.name).toBe("local needsSync");
      expect(saved!.needsSync).toBe(true);
    });
  });

  describe("findHiddenRecurringTask", () => {
    it("should find hidden task by original_task_id", async () => {
      const originalTask = buildTask({
        id: "original-1",
        original_task_id: "",
        is_hidden: false,
      });
      const hiddenCopy = buildTask({
        id: "copy-1",
        original_task_id: "original-1",
        is_hidden: true,
        is_completed: false,
        is_deleted: false,
      });
      await db.tasks.bulkAdd([originalTask, hiddenCopy]);

      const found = await taskRepository.findHiddenRecurringTask("original-1");

      expect(found).toBeDefined();
      expect(found!.id).toBe("copy-1");
      expect(found!.original_task_id).toBe("original-1");
    });

    it("should return undefined when no hidden copy exists", async () => {
      const originalTask = buildTask({
        id: "original-1",
        original_task_id: "",
        is_hidden: false,
      });
      await db.tasks.add(originalTask);

      const found = await taskRepository.findHiddenRecurringTask("original-1");

      expect(found).toBeUndefined();
    });

    it("should ignore revealed tasks (is_hidden = false)", async () => {
      const originalTask = buildTask({
        id: "original-1",
        original_task_id: "",
        is_hidden: false,
      });
      const revealedCopy = buildTask({
        id: "copy-1",
        original_task_id: "original-1",
        is_hidden: false,
        is_completed: false,
        is_deleted: false,
      });
      await db.tasks.bulkAdd([originalTask, revealedCopy]);

      const found = await taskRepository.findHiddenRecurringTask("original-1");

      expect(found).toBeUndefined();
    });

    it("should ignore completed tasks", async () => {
      const originalTask = buildTask({
        id: "original-1",
        original_task_id: "",
        is_hidden: false,
      });
      const completedCopy = buildTask({
        id: "copy-1",
        original_task_id: "original-1",
        is_hidden: true,
        is_completed: true,
        is_deleted: false,
      });
      await db.tasks.bulkAdd([originalTask, completedCopy]);

      const found = await taskRepository.findHiddenRecurringTask("original-1");

      expect(found).toBeUndefined();
    });

    it("should ignore deleted tasks", async () => {
      const originalTask = buildTask({
        id: "original-1",
        original_task_id: "",
        is_hidden: false,
      });
      const deletedCopy = buildTask({
        id: "copy-1",
        original_task_id: "original-1",
        is_hidden: true,
        is_completed: false,
        is_deleted: true,
      });
      await db.tasks.bulkAdd([originalTask, deletedCopy]);

      const found = await taskRepository.findHiddenRecurringTask("original-1");

      expect(found).toBeUndefined();
    });

    it("should return first hidden copy when multiple exist", async () => {
      const originalTask = buildTask({
        id: "original-1",
        original_task_id: "",
        is_hidden: false,
      });
      const hiddenCopy1 = buildTask({
        id: "copy-1",
        original_task_id: "original-1",
        is_hidden: true,
        is_completed: false,
        is_deleted: false,
      });
      const hiddenCopy2 = buildTask({
        id: "copy-2",
        original_task_id: "original-1",
        is_hidden: true,
        is_completed: false,
        is_deleted: false,
      });
      await db.tasks.bulkAdd([originalTask, hiddenCopy1, hiddenCopy2]);

      const found = await taskRepository.findHiddenRecurringTask("original-1");

      expect(found).toBeDefined();
      expect(["copy-1", "copy-2"]).toContain(found!.id);
    });
  });

  describe("findByOriginalTaskId", () => {
    it("should find all copies by original_task_id", async () => {
      const originalTask = buildTask({
        id: "original-1",
        original_task_id: "",
      });
      const copy1 = buildTask({
        id: "copy-1",
        original_task_id: "original-1",
      });
      const copy2 = buildTask({
        id: "copy-2",
        original_task_id: "original-1",
      });
      const otherTask = buildTask({
        id: "other-1",
        original_task_id: "",
      });
      await db.tasks.bulkAdd([originalTask, copy1, copy2, otherTask]);

      const copies = await taskRepository.findByOriginalTaskId("original-1");

      expect(copies).toHaveLength(2);
      expect(copies.map((t) => t.id).sort()).toEqual(["copy-1", "copy-2"]);
    });

    it("should return empty array when no copies exist", async () => {
      const originalTask = buildTask({
        id: "original-1",
        original_task_id: "",
      });
      await db.tasks.add(originalTask);

      const copies = await taskRepository.findByOriginalTaskId("original-1");

      expect(copies).toEqual([]);
    });

    it("should include deleted and completed copies", async () => {
      const originalTask = buildTask({
        id: "original-1",
        original_task_id: "",
      });
      const deletedCopy = buildTask({
        id: "copy-1",
        original_task_id: "original-1",
        is_deleted: true,
      });
      const completedCopy = buildTask({
        id: "copy-2",
        original_task_id: "original-1",
        is_completed: true,
      });
      await db.tasks.bulkAdd([originalTask, deletedCopy, completedCopy]);

      const copies = await taskRepository.findByOriginalTaskId("original-1");

      expect(copies).toHaveLength(2);
      expect(copies.map((t) => t.id).sort()).toEqual(["copy-1", "copy-2"]);
    });
  });
});

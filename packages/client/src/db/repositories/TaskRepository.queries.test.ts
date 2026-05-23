import { describe, expect, it } from "vitest";
import { buildTask } from "@/test/factories/taskFactory";
import { db } from "../database";
import { createTaskRepositorySetup } from "./TaskRepository.test-setup";

describe("TaskRepository", () => {
  const { getRepository } = createTaskRepositorySetup();

  describe("getAll", () => {
    it("should return empty array when no tasks exist", async () => {
      const tasks = await getRepository().getAll();
      expect(tasks).toEqual([]);
    });

    it("should return all tasks including deleted ones", async () => {
      const activeTask = buildTask({ is_deleted: false });
      const deletedTask = buildTask({ is_deleted: true });
      await db.tasks.bulkAdd([activeTask, deletedTask]);

      const tasks = await getRepository().getAll();
      expect(tasks).toHaveLength(2);
    });
  });

  describe("getActive", () => {
    it("should return only non-deleted tasks", async () => {
      const activeTask = buildTask({ is_deleted: false });
      const deletedTask = buildTask({ is_deleted: true });
      await db.tasks.bulkAdd([activeTask, deletedTask]);

      const tasks = await getRepository().getActive();
      expect(tasks).toHaveLength(1);
      expect(tasks[0].id).toBe(activeTask.id);
    });

    it("should return empty array when all tasks are deleted", async () => {
      const deletedTask = buildTask({ is_deleted: true });
      await db.tasks.add(deletedTask);

      const tasks = await getRepository().getActive();
      expect(tasks).toEqual([]);
    });
  });

  describe("getByBox", () => {
    it("should return only non-deleted tasks for the specified box", async () => {
      const inboxTask = buildTask({ box: "inbox", is_deleted: false });
      const todayTask = buildTask({ box: "today", is_deleted: false });
      const deletedInboxTask = buildTask({ box: "inbox", is_deleted: true });
      await db.tasks.bulkAdd([inboxTask, todayTask, deletedInboxTask]);

      const tasks = await getRepository().getByBox("inbox");
      expect(tasks).toHaveLength(1);
      expect(tasks[0].id).toBe(inboxTask.id);
    });

    it("should not return tasks from a different box", async () => {
      const todayTask = buildTask({ box: "today" });
      await db.tasks.add(todayTask);

      const tasks = await getRepository().getByBox("inbox");
      expect(tasks).toEqual([]);
    });

    it("should not return soft-deleted tasks", async () => {
      const deletedTask = buildTask({ box: "inbox", is_deleted: true });
      await db.tasks.add(deletedTask);

      const tasks = await getRepository().getByBox("inbox");
      expect(tasks).toEqual([]);
    });
  });

  describe("getById", () => {
    it("should return the task when found", async () => {
      const task = buildTask();
      await db.tasks.add(task);

      const foundTask = await getRepository().getById(task.id);
      expect(foundTask).toBeDefined();
      expect(foundTask?.id).toBe(task.id);
    });

    it("should return undefined when task not found", async () => {
      const result = await getRepository().getById("nonexistent-id");
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

      const tasks = await getRepository().getByGoalId("goal-1");
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

      const tasks = await getRepository().getActiveIncomplete();
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

      const tasks = await getRepository().getByCategoryId("cat-1");
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

      const tasks = await getRepository().getByContextId("ctx-1");
      expect(tasks).toHaveLength(1);
      expect(tasks[0].id).toBe(contextTask.id);
    });
  });
});

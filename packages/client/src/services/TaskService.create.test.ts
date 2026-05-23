import { beforeEach, describe, expect, it } from "vitest";
import type { Task } from "@/types/entities";
import { createTestContext } from "./TaskService-test-utils";

describe("TaskService", () => {
  describe("create", () => {
    let createdTask: Task;
    let createSpy: ReturnType<
      typeof createTestContext
    >["mockTaskRepository"]["create"];

    beforeEach(async () => {
      const { taskService, mockTaskRepository } = createTestContext();
      createSpy = mockTaskRepository.create;
      createdTask = await taskService.create({
        name: "My task",
        box: "inbox",
      });
    });

    it("should create task with given name and box", () => {
      expect(createdTask.name).toBe("My task");
      expect(createdTask.box).toBe("inbox");
    });

    it("should create task with is_deleted false", () => {
      expect(createdTask.is_deleted).toBe(false);
    });

    it("should create task with a UUID id", () => {
      expect(createdTask.id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
      );
    });

    it("should create task with empty string defaults for optional fields", () => {
      expect(createdTask.description).toBe("");
      expect(createdTask.goal_id).toBe("");
      expect(createdTask.context_id).toBe("");
      expect(createdTask.category_id).toBe("");
      expect(createdTask.completed_at).toBe("");
      expect(createdTask.repeat_rule).toBe("");
      expect(createdTask.next_date).toBe("");
      expect(createdTask.appear_date).toBe("");
      expect(createdTask.original_task_id).toBe("");
    });

    it("should create task with is_completed false", () => {
      expect(createdTask.is_completed).toBe(false);
    });

    it("should create task with is_hidden false", () => {
      expect(createdTask.is_hidden).toBe(false);
    });

    it("should create task with needsSync true", () => {
      expect(createdTask.needsSync).toBe(true);
    });

    it("should create task with sort_order 0 by default", () => {
      expect(createdTask.sort_order).toBe(0);
    });

    it("should call repository.create with the constructed task", () => {
      expect(createSpy).toHaveBeenCalledWith(createdTask);
    });
  });
});

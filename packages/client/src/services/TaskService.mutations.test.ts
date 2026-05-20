import { describe, expect, it, vi } from "vitest";
import { BOX } from "@/constants";
import { Temporal } from "@/lib/temporal";
import { buildTask } from "@/test/factories/taskFactory";
import { toISOTimestamp } from "@/utils/dateHelpers";
import { createTestContext } from "./TaskService-test-utils";

describe("TaskService", () => {
  describe("update", () => {
    it("should update task fields", async () => {
      const task = buildTask({ name: "Old name" });
      const { taskService } = createTestContext({
        getById: vi.fn().mockResolvedValue(task),
      });
      const updated = await taskService.update(task.id, { name: "New name" });
      expect(updated.name).toBe("New name");
    });

    it("should throw when task not found", async () => {
      const { taskService } = createTestContext();
      await expect(taskService.update("nonexistent", {})).rejects.toThrow(
        "Task not found: nonexistent",
      );
    });

    it("should throw error message with task id when task not found", async () => {
      const { taskService } = createTestContext();
      await expect(taskService.update("task-123", {})).rejects.toThrow(
        "task-123",
      );
    });
  });

  describe("noncomplete", () => {
    it("should set is_completed to false", async () => {
      const task = buildTask({ is_completed: true });
      const { taskService } = createTestContext({
        getById: vi.fn().mockResolvedValue(task),
      });
      const result = await taskService.noncomplete(task.id);
      expect(result.is_completed).toBe(false);
    });

    it("should clear completed_at to empty string", async () => {
      const task = buildTask({
        is_completed: true,
        completed_at: toISOTimestamp(
          Temporal.Instant.from("2025-01-01T10:00:00.000Z"),
        ),
      });
      const { taskService } = createTestContext({
        getById: vi.fn().mockResolvedValue(task),
      });
      const result = await taskService.noncomplete(task.id);
      expect(result.completed_at).toBe("");
    });

    it("should throw when task not found", async () => {
      const { taskService } = createTestContext();
      await expect(taskService.noncomplete("nonexistent")).rejects.toThrow(
        "Task not found: nonexistent",
      );
    });

    it("should not call update when task not found in noncomplete", async () => {
      const task = buildTask();
      const { taskService, mockTaskRepository } = createTestContext({
        getById: vi
          .fn()
          .mockResolvedValueOnce(undefined)
          .mockResolvedValueOnce(task),
      });
      await expect(taskService.noncomplete("nonexistent")).rejects.toThrow();
      expect(mockTaskRepository.update).not.toHaveBeenCalled();
    });
  });

  describe("softDelete", () => {
    it("should set is_deleted to true", async () => {
      const task = buildTask({ is_deleted: false });
      const { taskService } = createTestContext({
        getById: vi.fn().mockResolvedValue(task),
      });
      const deleted = await taskService.softDelete(task.id);
      expect(deleted.is_deleted).toBe(true);
    });

    it("should call findByOriginalTaskId when deleting task", async () => {
      const task = buildTask({ id: "task-1", original_task_id: "" });
      const { taskService, mockTaskRepository } = createTestContext({
        getById: vi.fn().mockResolvedValue(task),
        findByOriginalTaskId: vi.fn().mockResolvedValue([]),
      });
      await taskService.softDelete(task.id);
      expect(mockTaskRepository.findByOriginalTaskId).toHaveBeenCalledWith(
        "task-1",
      );
    });
  });

  describe("restore", () => {
    it("should set is_deleted to false", async () => {
      const task = buildTask({ is_deleted: true });
      const { taskService } = createTestContext({
        getById: vi.fn().mockResolvedValue(task),
      });
      const restored = await taskService.restore(task.id);
      expect(restored.is_deleted).toBe(false);
    });

    it("should throw when task not found", async () => {
      const { taskService } = createTestContext();
      await expect(taskService.restore("nonexistent-id")).rejects.toThrow(
        "Task not found: nonexistent-id",
      );
    });
  });

  describe("moveToBox", () => {
    it("should update task box", async () => {
      const task = buildTask({ box: "inbox" });
      const { taskService } = createTestContext({
        getById: vi.fn().mockResolvedValue(task),
      });
      const moved = await taskService.moveToBox(task.id, BOX.TODAY);
      expect(moved.box).toBe("today");
    });
  });
});

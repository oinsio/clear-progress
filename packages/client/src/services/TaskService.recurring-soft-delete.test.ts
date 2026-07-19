import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TaskRepository } from "@/db/repositories/TaskRepository";
import { buildTask } from "@/test/factories/taskFactory";
import type { Task } from "@/types/entities";
import type { TaskService } from "./TaskService";
import {
  createTestContext,
  mockGetByIdFromMap,
  mockUpdateRecording,
} from "./TaskService-test-utils";

describe("TaskService - Recurring Tasks Integration", () => {
  let taskService: TaskService;
  let mockTaskRepository: TaskRepository;

  beforeEach(() => {
    const context = createTestContext();
    taskService = context.taskService;
    mockTaskRepository = context.mockTaskRepository;
    vi.clearAllMocks();
  });

  describe("softDelete with original_task_id", () => {
    it("should reassign copies when deleting original task", async () => {
      const originalTask = buildTask({
        id: "task-1",
        name: "Original",
        original_task_id: "",
      });

      const copy1 = buildTask({
        id: "task-2",
        name: "Copy 1",
        original_task_id: "task-1",
        is_deleted: false,
      });

      const copy2 = buildTask({
        id: "task-3",
        name: "Copy 2",
        original_task_id: "task-1",
        is_deleted: false,
      });

      const updates = mockUpdateRecording(mockTaskRepository);
      mockGetByIdFromMap(mockTaskRepository, {
        "task-1": originalTask,
        "task-2": copy1,
        "task-3": copy2,
      });
      mockTaskRepository.findByOriginalTaskId = vi
        .fn()
        .mockResolvedValue([copy1, copy2]);

      await taskService.softDelete("task-1");

      expect(mockTaskRepository.findByOriginalTaskId).toHaveBeenCalledWith(
        "task-1",
      );
      expect(updates["task-2"].original_task_id).toBe("");
      expect(updates["task-3"].original_task_id).toBe("task-2");
      expect(updates["task-1"].is_deleted).toBe(true);
    });

    it("should handle deletion when no copies exist", async () => {
      const originalTask = buildTask({
        id: "task-1",
        name: "Original",
        original_task_id: "",
      });

      const updates = mockUpdateRecording(mockTaskRepository);
      mockGetByIdFromMap(mockTaskRepository, { "task-1": originalTask });
      mockTaskRepository.findByOriginalTaskId = vi.fn().mockResolvedValue([]);

      await taskService.softDelete("task-1");

      expect(updates["task-1"]).toBeDefined();
      expect(updates["task-1"]).toMatchObject({ is_deleted: true });
    });

    it("should skip deleted copies when reassigning", async () => {
      const originalTask = buildTask({
        id: "task-1",
        name: "Original",
        original_task_id: "",
      });

      const deletedCopy = buildTask({
        id: "task-2",
        name: "Deleted Copy",
        original_task_id: "task-1",
        is_deleted: true,
      });

      const activeCopy = buildTask({
        id: "task-3",
        name: "Active Copy",
        original_task_id: "task-1",
        is_deleted: false,
      });

      const updates = mockUpdateRecording(mockTaskRepository);
      mockGetByIdFromMap(mockTaskRepository, {
        "task-1": originalTask,
        "task-2": deletedCopy,
        "task-3": activeCopy,
      });
      mockTaskRepository.findByOriginalTaskId = vi
        .fn()
        .mockResolvedValue([deletedCopy, activeCopy]);

      await taskService.softDelete("task-1");

      expect(updates["task-3"].original_task_id).toBe("");
      expect(updates["task-2"].original_task_id).toBe("task-3");
    });

    // Guards `if (copy.id !== newOriginal.id)`: the reassignment loop must
    // skip the new-original's own entry inside `copies` and never call
    // update() for it there — it is updated separately afterward (to clear
    // its own original_task_id). A mutant that turns the guard into `if
    // (true)` would call update() for newOriginal.id twice with different
    // original_task_id payloads; asserting the exact call count/args (not
    // just the final overwritten state) catches that extra call.
    it("should call update exactly once per copy, skipping the new original inside the reassignment loop", async () => {
      const originalTask = buildTask({
        id: "task-1",
        name: "Original",
        original_task_id: "",
      });

      const copy1 = buildTask({
        id: "task-2",
        name: "Copy 1 (becomes new original)",
        original_task_id: "task-1",
        is_deleted: false,
      });

      const copy2 = buildTask({
        id: "task-3",
        name: "Copy 2",
        original_task_id: "task-1",
        is_deleted: false,
      });

      mockGetByIdFromMap(mockTaskRepository, {
        "task-1": originalTask,
        "task-2": copy1,
        "task-3": copy2,
      });
      mockTaskRepository.findByOriginalTaskId = vi
        .fn()
        .mockResolvedValue([copy1, copy2]);
      const updateSpy = vi.fn().mockImplementation(async (task: Task) => task);
      mockTaskRepository.update = updateSpy;

      await taskService.softDelete("task-1");

      const updateCallsForNewOriginal = updateSpy.mock.calls.filter(
        ([task]) => task.id === "task-2",
      );
      expect(updateCallsForNewOriginal).toHaveLength(1);
      expect(updateCallsForNewOriginal[0][0].original_task_id).toBe("");

      const updateCallsForOtherCopy = updateSpy.mock.calls.filter(
        ([task]) => task.id === "task-3",
      );
      expect(updateCallsForOtherCopy).toHaveLength(1);
      expect(updateCallsForOtherCopy[0][0].original_task_id).toBe("task-2");
    });
  });

  describe("softDelete with all copies deleted", () => {
    it("should handle deletion when all copies are deleted", async () => {
      const originalTask = buildTask({
        id: "task-1",
        name: "Original",
        original_task_id: "",
      });

      const deletedCopy1 = buildTask({
        id: "task-2",
        name: "Deleted Copy 1",
        original_task_id: "task-1",
        is_deleted: true,
      });

      const deletedCopy2 = buildTask({
        id: "task-3",
        name: "Deleted Copy 2",
        original_task_id: "task-1",
        is_deleted: true,
      });

      const updates = mockUpdateRecording(mockTaskRepository);
      mockGetByIdFromMap(mockTaskRepository, {
        "task-1": originalTask,
        "task-2": deletedCopy1,
        "task-3": deletedCopy2,
      });
      mockTaskRepository.findByOriginalTaskId = vi
        .fn()
        .mockResolvedValue([deletedCopy1, deletedCopy2]);

      await taskService.softDelete("task-1");

      expect(updates["task-1"].is_deleted).toBe(true);
      expect(updates["task-2"]).toBeUndefined();
      expect(updates["task-3"]).toBeUndefined();
    });
  });
});

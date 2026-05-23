import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ChecklistRepository } from "@/db/repositories/ChecklistRepository";
import type { TaskRepository } from "@/db/repositories/TaskRepository";
import { createMockChecklistRepository } from "@/test/factories/checklistRepositoryFactory";
import { buildTask } from "@/test/factories/taskFactory";
import { createMockTaskRepository } from "@/test/mocks/taskRepositoryMock";
import { TaskService } from "./TaskService";

describe("TaskService - Recurring Tasks Integration", () => {
  let taskService: TaskService;
  let mockTaskRepository: TaskRepository;
  let mockChecklistRepository: ChecklistRepository;

  beforeEach(() => {
    mockTaskRepository = createMockTaskRepository();
    mockChecklistRepository = createMockChecklistRepository();
    taskService = new TaskService(mockTaskRepository, mockChecklistRepository);
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

      const updates: Record<string, ReturnType<typeof buildTask>> = {};

      mockTaskRepository.getById = vi.fn().mockImplementation(async (id) => {
        if (id === "task-1") return originalTask;
        if (id === "task-2") return copy1;
        if (id === "task-3") return copy2;
        return undefined;
      });
      mockTaskRepository.findByOriginalTaskId = vi
        .fn()
        .mockResolvedValue([copy1, copy2]);
      mockTaskRepository.update = vi.fn().mockImplementation(async (task) => {
        updates[task.id] = task;
        return task;
      });

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

      let deletedTask: ReturnType<typeof buildTask> | null = null;
      mockTaskRepository.getById = vi.fn().mockResolvedValue(originalTask);
      mockTaskRepository.findByOriginalTaskId = vi.fn().mockResolvedValue([]);
      mockTaskRepository.update = vi.fn().mockImplementation(async (task) => {
        deletedTask = task;
        return task;
      });

      await taskService.softDelete("task-1");

      expect(deletedTask).toBeDefined();
      expect(deletedTask).toMatchObject({ is_deleted: true });
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

      const updates: Record<string, ReturnType<typeof buildTask>> = {};

      mockTaskRepository.getById = vi.fn().mockImplementation(async (id) => {
        if (id === "task-1") return originalTask;
        if (id === "task-2") return deletedCopy;
        if (id === "task-3") return activeCopy;
        return undefined;
      });
      mockTaskRepository.findByOriginalTaskId = vi
        .fn()
        .mockResolvedValue([deletedCopy, activeCopy]);
      mockTaskRepository.update = vi.fn().mockImplementation(async (task) => {
        updates[task.id] = task;
        return task;
      });

      await taskService.softDelete("task-1");

      expect(updates["task-3"].original_task_id).toBe("");
      expect(updates["task-2"].original_task_id).toBe("task-3");
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

      const updates: Record<string, ReturnType<typeof buildTask>> = {};

      mockTaskRepository.getById = vi.fn().mockImplementation(async (id) => {
        if (id === "task-1") return originalTask;
        if (id === "task-2") return deletedCopy1;
        if (id === "task-3") return deletedCopy2;
        return undefined;
      });
      mockTaskRepository.findByOriginalTaskId = vi
        .fn()
        .mockResolvedValue([deletedCopy1, deletedCopy2]);
      mockTaskRepository.update = vi.fn().mockImplementation(async (task) => {
        updates[task.id] = task;
        return task;
      });

      await taskService.softDelete("task-1");

      expect(updates["task-1"].is_deleted).toBe(true);
      expect(updates["task-2"]).toBeUndefined();
      expect(updates["task-3"]).toBeUndefined();
    });
  });
});

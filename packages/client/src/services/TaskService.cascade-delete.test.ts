// implements FR1 of cascade-checklist-delete
import { beforeEach, describe, expect, it, vi } from "vitest";
import { buildChecklistItem } from "@/test/factories/checklistItemFactory";
import { buildTask } from "@/test/factories/taskFactory";
import { createTestContext } from "./TaskService-test-utils";

describe("TaskService.softDelete - cascade to checklist items", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should cascade is_deleted to all checklist items when soft-deleting task", async () => {
    const task = buildTask({ id: "task-1" });
    const checklistItem1 = buildChecklistItem({
      task_id: "task-1",
      is_deleted: false,
    });
    const checklistItem2 = buildChecklistItem({
      task_id: "task-1",
      is_deleted: false,
    });

    const { mockTaskRepository, mockChecklistRepository, taskService } =
      createTestContext();

    mockTaskRepository.getById = vi.fn().mockResolvedValue(task);
    mockChecklistRepository.getAllByTaskId = vi
      .fn()
      .mockResolvedValue([checklistItem1, checklistItem2]);

    await taskService.softDelete("task-1");

    expect(mockChecklistRepository.bulkUpsert).toHaveBeenCalledOnce();

    const [bulkUpsertArg] = (
      mockChecklistRepository.bulkUpsert as ReturnType<typeof vi.fn>
    ).mock.calls[0];
    expect(bulkUpsertArg).toHaveLength(2);
    expect(bulkUpsertArg[0]).toMatchObject({
      is_deleted: true,
      syncStatus: "pending" as const,
    });
    expect(bulkUpsertArg[1]).toMatchObject({
      is_deleted: true,
      syncStatus: "pending" as const,
    });
  });

  it("should not call bulkUpsert when task has no checklist items", async () => {
    const task = buildTask({ id: "task-1" });

    const { mockTaskRepository, mockChecklistRepository, taskService } =
      createTestContext();

    mockTaskRepository.getById = vi.fn().mockResolvedValue(task);
    mockChecklistRepository.getAllByTaskId = vi.fn().mockResolvedValue([]);

    await taskService.softDelete("task-1");

    expect(mockChecklistRepository.bulkUpsert).not.toHaveBeenCalled();
    expect(mockChecklistRepository.getAllByTaskId).toHaveBeenCalledWith(
      "task-1",
    );
  });

  it("should update already-deleted checklist items with syncStatus and updated_at", async () => {
    const oldTimestamp = "2020-01-01T00:00:00.000Z";
    const task = buildTask({ id: "task-1" });
    const alreadyDeletedItem = buildChecklistItem({
      task_id: "task-1",
      is_deleted: true,
      syncStatus: "synced" as const,
      updated_at: oldTimestamp,
    });

    const { mockTaskRepository, mockChecklistRepository, taskService } =
      createTestContext();

    mockTaskRepository.getById = vi.fn().mockResolvedValue(task);
    mockChecklistRepository.getAllByTaskId = vi
      .fn()
      .mockResolvedValue([alreadyDeletedItem]);

    await taskService.softDelete("task-1");

    expect(mockChecklistRepository.bulkUpsert).toHaveBeenCalledOnce();

    const [bulkUpsertArg] = (
      mockChecklistRepository.bulkUpsert as ReturnType<typeof vi.fn>
    ).mock.calls[0];
    expect(bulkUpsertArg[0]).toMatchObject({
      is_deleted: true,
      syncStatus: "pending" as const,
    });
    expect(bulkUpsertArg[0].updated_at).not.toBe(oldTimestamp);
  });

  it("should cascade to checklist items AND reassign recurring copies", async () => {
    const originalTask = buildTask({ id: "task-1", original_task_id: "" });
    const recurringCopy = buildTask({
      id: "task-2",
      original_task_id: "task-1",
      is_deleted: false,
    });
    const checklistItem = buildChecklistItem({ task_id: "task-1" });

    const { mockTaskRepository, mockChecklistRepository, taskService } =
      createTestContext();

    mockTaskRepository.getById = vi
      .fn()
      .mockImplementation(async (id: string) => {
        if (id === "task-1") return originalTask;
        if (id === "task-2") return recurringCopy;
        return undefined;
      });
    mockTaskRepository.findByOriginalTaskId = vi
      .fn()
      .mockResolvedValue([recurringCopy]);
    mockTaskRepository.update = vi
      .fn()
      .mockImplementation(async (task: typeof originalTask) => task);
    mockChecklistRepository.getAllByTaskId = vi
      .fn()
      .mockResolvedValue([checklistItem]);

    await taskService.softDelete("task-1");

    expect(mockChecklistRepository.bulkUpsert).toHaveBeenCalledOnce();
    expect(mockTaskRepository.update).toHaveBeenCalled();
  });
});

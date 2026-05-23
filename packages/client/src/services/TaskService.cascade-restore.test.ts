// implements FR2 of cascade-checklist-delete
import { beforeEach, describe, expect, it, vi } from "vitest";
import { buildChecklistItem } from "@/test/factories/checklistItemFactory";
import { buildTask } from "@/test/factories/taskFactory";
import { createTestContext } from "./TaskService-test-utils";

describe("TaskService.restore - cascade to checklist items", () => {
  const task = buildTask({ id: "task-1", is_deleted: true });
  let mockTaskRepository: ReturnType<
    typeof createTestContext
  >["mockTaskRepository"];
  let mockChecklistRepository: ReturnType<
    typeof createTestContext
  >["mockChecklistRepository"];
  let taskService: ReturnType<typeof createTestContext>["taskService"];

  beforeEach(() => {
    vi.clearAllMocks();
    const context = createTestContext();
    mockTaskRepository = context.mockTaskRepository;
    mockChecklistRepository = context.mockChecklistRepository;
    taskService = context.taskService;

    mockTaskRepository.getById = vi.fn().mockResolvedValue(task);
    mockTaskRepository.update = vi
      .fn()
      .mockImplementation(async (updatedTask) => updatedTask);
  });

  it("should cascade is_deleted false to all checklist items when restoring task", async () => {
    const checklistItem1 = buildChecklistItem({
      task_id: "task-1",
      is_deleted: true,
    });
    const checklistItem2 = buildChecklistItem({
      task_id: "task-1",
      is_deleted: true,
    });
    mockChecklistRepository.getAllByTaskId = vi
      .fn()
      .mockResolvedValue([checklistItem1, checklistItem2]);

    await taskService.restore("task-1");

    expect(mockChecklistRepository.bulkUpsert).toHaveBeenCalledOnce();

    const [bulkUpsertArg] = (
      mockChecklistRepository.bulkUpsert as ReturnType<typeof vi.fn>
    ).mock.calls[0];
    expect(bulkUpsertArg).toHaveLength(2);
    expect(bulkUpsertArg[0]).toMatchObject({
      is_deleted: false,
      needsSync: true,
    });
    expect(bulkUpsertArg[1]).toMatchObject({
      is_deleted: false,
      needsSync: true,
    });
  });

  it("should not call bulkUpsert when task has no checklist items", async () => {
    mockChecklistRepository.getAllByTaskId = vi.fn().mockResolvedValue([]);

    await taskService.restore("task-1");

    expect(mockChecklistRepository.bulkUpsert).not.toHaveBeenCalled();
    expect(mockChecklistRepository.getAllByTaskId).toHaveBeenCalledWith(
      "task-1",
    );
  });
});

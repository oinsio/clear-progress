// implements FR3, NFR-P1 of cascade-checklist-delete
import { beforeEach, describe, expect, it, vi } from "vitest";

// Skip Zod pre-validation — these tests use non-UUID IDs
vi.mock("@/services/pushPreValidator", () => ({
  preValidateRecords: (
    tasks: unknown[],
    goals: unknown[],
    contexts: unknown[],
    categories: unknown[],
    checklistItems: unknown[],
    ideas: unknown[],
    attachments: unknown[],
    settings: unknown[],
  ) =>
    Promise.resolve({
      tasks,
      goals,
      contexts,
      categories,
      checklistItems,
      ideas,
      attachments,
      settings,
      alerts: [],
    }),
}));

import { db } from "@/db/database";
import {
  asMock,
  createService,
  makeChecklistItem,
  makePushResponse,
  makeTask,
  type SyncTestContext,
  setupSyncTestContext,
  withNeedingSync,
} from "./SyncService.test-helpers";

describe("SyncService — self-healing orphan detection", () => {
  let ctx: SyncTestContext;

  beforeEach(async () => {
    vi.restoreAllMocks();
    ctx = setupSyncTestContext();
    await db.tasks.clear();
    await db.checklist_items.clear();
  });

  function setupOrphans(items: ReturnType<typeof makeChecklistItem>[]) {
    ctx.checklistRepository = withNeedingSync(ctx.checklistRepository, items);
  }

  function setupTaskWithItem(
    task: ReturnType<typeof makeTask>,
    item: ReturnType<typeof makeChecklistItem>,
  ) {
    ctx.taskRepository = withNeedingSync(ctx.taskRepository, [task]);
    asMock(ctx.taskRepository.getById).mockResolvedValue(task);
    ctx.checklistRepository = withNeedingSync(ctx.checklistRepository, [item]);
    asMock(ctx.checklistRepository.getById).mockResolvedValue(item);
  }

  function setupPushResponse(results: Parameters<typeof makePushResponse>[0]) {
    ctx.mockSyncAdapter = {
      ...ctx.mockSyncAdapter,
      push: vi.fn().mockResolvedValue(makePushResponse(results)),
    };
  }

  async function executePush() {
    const service = createService(ctx);
    await service.push();
  }

  function getPushPayload() {
    return asMock(ctx.mockSyncAdapter.push).mock.calls[0][0];
  }

  async function pushAndExpectAccepted(
    task: ReturnType<typeof makeTask>,
    validItem: ReturnType<typeof makeChecklistItem>,
  ) {
    setupPushResponse({
      tasks: [{ id: task.id, status: "accepted" }],
      checklist_items: [{ id: validItem.id, status: "accepted" }],
    });

    await executePush();

    const pushPayload = getPushPayload();
    expect(pushPayload.checklist_items).toHaveLength(1);
    expect(pushPayload.checklist_items[0]).toMatchObject({ id: validItem.id });
  }

  // implements FR3 of cascade-checklist-delete
  it("should remove orphaned checklist item from IndexedDB and exclude from push", async () => {
    const orphanItem = makeChecklistItem({
      id: "orphan-ci-1",
      task_id: "missing-task-id",
      syncStatus: "pending" as const,
    });

    setupOrphans([orphanItem]);
    await db.checklist_items.add(orphanItem);

    await executePush();

    const deletedItem = await db.checklist_items.get(orphanItem.id);
    expect(deletedItem).toBeUndefined();

    // No records left after orphan removal — push should not be called
    expect(ctx.mockSyncAdapter.push).not.toHaveBeenCalled();
  });

  // implements FR3 of cascade-checklist-delete
  it("should preserve valid checklist items in push data", async () => {
    const task = makeTask({
      id: "existing-task-id",
      syncStatus: "pending" as const,
    });
    const validItem = makeChecklistItem({
      id: "valid-ci-1",
      task_id: task.id,
      syncStatus: "pending" as const,
    });

    setupTaskWithItem(task, validItem);
    await db.tasks.add(task);
    await db.checklist_items.add(validItem);

    await pushAndExpectAccepted(task, validItem);

    const itemInDb = await db.checklist_items.get(validItem.id);
    expect(itemInDb).toBeDefined();
  });

  // implements FR3 of cascade-checklist-delete
  it("should not remove checklist item when task exists in IndexedDB but not in push data", async () => {
    // Task exists in IndexedDB but does NOT need sync (not in push data)
    const existingTask = makeTask({
      id: "existing-task-not-in-push",
      syncStatus: "synced" as const,
    });
    // Checklist item references that task and DOES need sync
    const validItem = makeChecklistItem({
      id: "ci-with-existing-task",
      task_id: existingTask.id,
      syncStatus: "pending" as const,
    });

    // Only checklist item in push data, task is not in push
    setupOrphans([validItem]);
    asMock(ctx.checklistRepository.getById).mockResolvedValue(validItem);

    await db.tasks.add(existingTask);
    await db.checklist_items.add(validItem);

    setupPushResponse({
      checklist_items: [{ id: validItem.id, status: "accepted" }],
    });

    await executePush();

    const itemInDb = await db.checklist_items.get(validItem.id);
    expect(itemInDb).toBeDefined();

    const pushPayload = getPushPayload();
    expect(pushPayload.checklist_items).toHaveLength(1);
    expect(pushPayload.checklist_items[0]).toMatchObject({
      id: validItem.id,
    });
  });

  // implements NFR-P1 of cascade-checklist-delete
  it("should use batch lookup for orphan detection (NFR-P1)", async () => {
    const orphanItem1 = makeChecklistItem({
      id: "orphan-ci-batch-1",
      task_id: "missing-task-batch-1",
      syncStatus: "pending" as const,
    });
    const orphanItem2 = makeChecklistItem({
      id: "orphan-ci-batch-2",
      task_id: "missing-task-batch-2",
      syncStatus: "pending" as const,
    });
    const orphanItem3 = makeChecklistItem({
      id: "orphan-ci-batch-3",
      task_id: "missing-task-batch-3",
      syncStatus: "pending" as const,
    });

    setupOrphans([orphanItem1, orphanItem2, orphanItem3]);
    await db.checklist_items.bulkAdd([orphanItem1, orphanItem2, orphanItem3]);

    const bulkGetSpy = vi.spyOn(db.tasks, "bulkGet");

    await executePush();

    expect(bulkGetSpy).toHaveBeenCalledOnce();
    expect(bulkGetSpy).toHaveBeenCalledWith(
      expect.arrayContaining([
        "missing-task-batch-1",
        "missing-task-batch-2",
        "missing-task-batch-3",
      ]),
    );
  });

  // implements FR3 of cascade-checklist-delete
  it("should NOT call db.tasks.bulkGet when there are no checklist_items in push", async () => {
    const task = makeTask({
      id: "task-no-checklist",
      syncStatus: "pending" as const,
    });

    ctx.taskRepository = withNeedingSync(ctx.taskRepository, [task]);

    const bulkGetSpy = vi.spyOn(db.tasks, "bulkGet");

    await executePush();

    expect(bulkGetSpy).not.toHaveBeenCalled();
  });

  // implements FR3 of cascade-checklist-delete
  it("should NOT call db.checklist_items.bulkDelete when all task_ids exist in DB", async () => {
    const task = makeTask({
      id: "task-all-present",
      syncStatus: "pending" as const,
    });
    const checklistItem = makeChecklistItem({
      id: "ci-all-present",
      task_id: task.id,
      syncStatus: "pending" as const,
    });

    setupTaskWithItem(task, checklistItem);
    await db.tasks.add(task);
    await db.checklist_items.add(checklistItem);

    setupPushResponse({
      tasks: [{ id: task.id, status: "accepted" }],
      checklist_items: [{ id: checklistItem.id, status: "accepted" }],
    });

    const bulkDeleteSpy = vi.spyOn(db.checklist_items, "bulkDelete");

    await executePush();

    expect(bulkDeleteSpy).not.toHaveBeenCalled();

    const pushPayload = getPushPayload();
    expect(pushPayload.checklist_items).toHaveLength(1);
    expect(pushPayload.checklist_items[0]).toMatchObject({
      id: checklistItem.id,
    });
  });

  // implements FR3 of cascade-checklist-delete
  it("should NOT call db.tasks.bulkGet when all task_ids are already in push batch", async () => {
    const task = makeTask({
      id: "task-in-push-batch",
      syncStatus: "pending" as const,
    });
    const checklistItem = makeChecklistItem({
      id: "ci-task-in-push-batch",
      task_id: task.id,
      syncStatus: "pending" as const,
    });

    setupTaskWithItem(task, checklistItem);
    await db.tasks.add(task);
    await db.checklist_items.add(checklistItem);

    setupPushResponse({
      tasks: [{ id: task.id, status: "accepted" }],
      checklist_items: [{ id: checklistItem.id, status: "accepted" }],
    });

    const bulkGetSpy = vi.spyOn(db.tasks, "bulkGet");

    await executePush();

    // task_id === task.id is already in push batch → uniqueTaskIds is empty → bulkGet not called
    expect(bulkGetSpy).not.toHaveBeenCalled();
  });

  // implements FR3 of cascade-checklist-delete
  it("should exclude orphan item from push payload while keeping valid item", async () => {
    const task = makeTask({
      id: "task-mixed-scenario",
      syncStatus: "pending" as const,
    });
    const validItem = makeChecklistItem({
      id: "valid-ci-mixed",
      task_id: task.id,
      syncStatus: "pending" as const,
    });
    const orphanItem = makeChecklistItem({
      id: "orphan-ci-mixed",
      task_id: "missing-task-id",
      syncStatus: "pending" as const,
    });

    await db.tasks.add(task);
    await db.checklist_items.bulkAdd([validItem, orphanItem]);

    ctx.checklistRepository = withNeedingSync(ctx.checklistRepository, [
      validItem,
      orphanItem,
    ]);
    ctx.taskRepository = withNeedingSync(ctx.taskRepository, [task]);
    asMock(ctx.taskRepository.getById).mockResolvedValue(task);
    asMock(ctx.checklistRepository.getById).mockResolvedValue(validItem);

    await pushAndExpectAccepted(task, validItem);

    const orphanInDb = await db.checklist_items.get(orphanItem.id);
    expect(orphanInDb).toBeUndefined();

    const validInDb = await db.checklist_items.get(validItem.id);
    expect(validInDb).toBeDefined();
  });

  // implements FR3 of cascade-checklist-delete
  it("should log a warning for each orphaned checklist item", async () => {
    const orphan1 = makeChecklistItem({
      id: "orphan-warn-1",
      task_id: "missing-task-warn-1",
      syncStatus: "pending" as const,
    });
    const orphan2 = makeChecklistItem({
      id: "orphan-warn-2",
      task_id: "missing-task-warn-2",
      syncStatus: "pending" as const,
    });

    await db.checklist_items.bulkAdd([orphan1, orphan2]);
    setupOrphans([orphan1, orphan2]);

    const warnSpy = vi.spyOn(console, "warn");

    await executePush();

    expect(warnSpy).toHaveBeenCalledTimes(2);
    expect(warnSpy.mock.calls[0][0]).toContain(orphan1.id);
    expect(warnSpy.mock.calls[1][0]).toContain(orphan2.id);
  });
});

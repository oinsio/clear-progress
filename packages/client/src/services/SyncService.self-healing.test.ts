// implements FR3, NFR-P1 of cascade-checklist-delete
import { beforeEach, describe, expect, it, vi } from "vitest";
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

  // implements FR3 of cascade-checklist-delete
  it("should remove orphaned checklist item from IndexedDB and exclude from push", async () => {
    const orphanItem = makeChecklistItem({
      id: "orphan-ci-1",
      task_id: "missing-task-id",
      needsSync: true,
    });

    setupOrphans([orphanItem]);
    await db.checklist_items.add(orphanItem);

    const service = createService(ctx);
    await service.push();

    const deletedItem = await db.checklist_items.get(orphanItem.id);
    expect(deletedItem).toBeUndefined();

    expect(ctx.mockSyncAdapter.push).toHaveBeenCalledOnce();
    const pushPayload = asMock(ctx.mockSyncAdapter.push).mock.calls[0][0];
    expect(pushPayload.checklist_items).toHaveLength(0);
  });

  // implements FR3 of cascade-checklist-delete
  it("should preserve valid checklist items in push data", async () => {
    const task = makeTask({ id: "existing-task-id", needsSync: true });
    const validItem = makeChecklistItem({
      id: "valid-ci-1",
      task_id: task.id,
      needsSync: true,
    });

    setupTaskWithItem(task, validItem);
    await db.tasks.add(task);
    await db.checklist_items.add(validItem);

    setupPushResponse({
      tasks: [{ id: task.id, status: "accepted" }],
      checklist_items: [{ id: validItem.id, status: "accepted" }],
    });

    const service = createService(ctx);
    await service.push();

    const pushPayload = asMock(ctx.mockSyncAdapter.push).mock.calls[0][0];
    expect(pushPayload.checklist_items).toHaveLength(1);
    expect(pushPayload.checklist_items[0]).toMatchObject({ id: validItem.id });

    const itemInDb = await db.checklist_items.get(validItem.id);
    expect(itemInDb).toBeDefined();
  });

  // implements FR3 of cascade-checklist-delete
  it("should not remove checklist item when task exists in IndexedDB but not in push data", async () => {
    // Task exists in IndexedDB but does NOT need sync (not in push data)
    const existingTask = makeTask({
      id: "existing-task-not-in-push",
      needsSync: false,
    });
    // Checklist item references that task and DOES need sync
    const validItem = makeChecklistItem({
      id: "ci-with-existing-task",
      task_id: existingTask.id,
      needsSync: true,
    });

    // Only checklist item in push data, task is not in push
    setupOrphans([validItem]);
    asMock(ctx.checklistRepository.getById).mockResolvedValue(validItem);

    await db.tasks.add(existingTask);
    await db.checklist_items.add(validItem);

    setupPushResponse({
      checklist_items: [{ id: validItem.id, status: "accepted" }],
    });

    const service = createService(ctx);
    await service.push();

    const itemInDb = await db.checklist_items.get(validItem.id);
    expect(itemInDb).toBeDefined();

    const pushPayload = asMock(ctx.mockSyncAdapter.push).mock.calls[0][0];
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
      needsSync: true,
    });
    const orphanItem2 = makeChecklistItem({
      id: "orphan-ci-batch-2",
      task_id: "missing-task-batch-2",
      needsSync: true,
    });
    const orphanItem3 = makeChecklistItem({
      id: "orphan-ci-batch-3",
      task_id: "missing-task-batch-3",
      needsSync: true,
    });

    setupOrphans([orphanItem1, orphanItem2, orphanItem3]);
    await db.checklist_items.bulkAdd([orphanItem1, orphanItem2, orphanItem3]);

    const bulkGetSpy = vi.spyOn(db.tasks, "bulkGet");

    const service = createService(ctx);
    await service.push();

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
    const task = makeTask({ id: "task-no-checklist", needsSync: true });

    ctx.taskRepository = withNeedingSync(ctx.taskRepository, [task]);

    const bulkGetSpy = vi.spyOn(db.tasks, "bulkGet");

    const service = createService(ctx);
    await service.push();

    expect(bulkGetSpy).not.toHaveBeenCalled();
  });

  // implements FR3 of cascade-checklist-delete
  it("should NOT call db.checklist_items.bulkDelete when all task_ids exist in DB", async () => {
    const task = makeTask({ id: "task-all-present", needsSync: true });
    const checklistItem = makeChecklistItem({
      id: "ci-all-present",
      task_id: task.id,
      needsSync: true,
    });

    setupTaskWithItem(task, checklistItem);
    await db.tasks.add(task);
    await db.checklist_items.add(checklistItem);

    setupPushResponse({
      tasks: [{ id: task.id, status: "accepted" }],
      checklist_items: [{ id: checklistItem.id, status: "accepted" }],
    });

    const bulkDeleteSpy = vi.spyOn(db.checklist_items, "bulkDelete");

    const service = createService(ctx);
    await service.push();

    expect(bulkDeleteSpy).not.toHaveBeenCalled();

    const pushPayload = asMock(ctx.mockSyncAdapter.push).mock.calls[0][0];
    expect(pushPayload.checklist_items).toHaveLength(1);
    expect(pushPayload.checklist_items[0]).toMatchObject({
      id: checklistItem.id,
    });
  });

  // implements FR3 of cascade-checklist-delete
  it("should NOT call db.tasks.bulkGet when all task_ids are already in push batch", async () => {
    const task = makeTask({ id: "task-in-push-batch", needsSync: true });
    const checklistItem = makeChecklistItem({
      id: "ci-task-in-push-batch",
      task_id: task.id,
      needsSync: true,
    });

    setupTaskWithItem(task, checklistItem);
    await db.tasks.add(task);
    await db.checklist_items.add(checklistItem);

    setupPushResponse({
      tasks: [{ id: task.id, status: "accepted" }],
      checklist_items: [{ id: checklistItem.id, status: "accepted" }],
    });

    const bulkGetSpy = vi.spyOn(db.tasks, "bulkGet");

    const service = createService(ctx);
    await service.push();

    // task_id === task.id is already in push batch → uniqueTaskIds is empty → bulkGet not called
    expect(bulkGetSpy).not.toHaveBeenCalled();
  });

  // implements FR3 of cascade-checklist-delete
  it("should exclude orphan item from push payload while keeping valid item", async () => {
    const task = makeTask({ id: "task-mixed-scenario", needsSync: true });
    const validItem = makeChecklistItem({
      id: "valid-ci-mixed",
      task_id: task.id,
      needsSync: true,
    });
    const orphanItem = makeChecklistItem({
      id: "orphan-ci-mixed",
      task_id: "missing-task-id",
      needsSync: true,
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

    setupPushResponse({
      tasks: [{ id: task.id, status: "accepted" }],
      checklist_items: [{ id: validItem.id, status: "accepted" }],
    });

    const service = createService(ctx);
    await service.push();

    const pushPayload = asMock(ctx.mockSyncAdapter.push).mock.calls[0][0];
    expect(pushPayload.checklist_items).toHaveLength(1);
    expect(pushPayload.checklist_items[0]).toMatchObject({ id: validItem.id });

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
      needsSync: true,
    });
    const orphan2 = makeChecklistItem({
      id: "orphan-warn-2",
      task_id: "missing-task-warn-2",
      needsSync: true,
    });

    await db.checklist_items.bulkAdd([orphan1, orphan2]);
    setupOrphans([orphan1, orphan2]);

    const warnSpy = vi.spyOn(console, "warn");

    const service = createService(ctx);
    await service.push();

    expect(warnSpy).toHaveBeenCalledTimes(2);
    expect(warnSpy.mock.calls[0][0]).toContain(orphan1.id);
    expect(warnSpy.mock.calls[1][0]).toContain(orphan2.id);
  });
});

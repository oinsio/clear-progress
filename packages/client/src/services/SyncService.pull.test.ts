import { beforeEach, describe, expect, it, vi } from "vitest";
import { SYNC_META_KEYS } from "@/constants";
import { db } from "@/db/database";
import {
  asMock,
  createMockSyncAdapter,
  createService,
  makePullResponse,
  makeTask,
  type SyncTestContext,
  setupSyncTestContext,
} from "./SyncService.test-helpers";

describe("SyncService — pull", () => {
  let ctx: SyncTestContext;

  beforeEach(() => {
    ctx = setupSyncTestContext();
  });

  it("should read last_known_revision from sync_meta", async () => {
    asMock(ctx.syncMetaRepository.getValue).mockResolvedValue(42);
    const service = createService(ctx);

    await service.pull();

    expect(ctx.syncMetaRepository.getValue).toHaveBeenCalledWith(
      SYNC_META_KEYS.LAST_KNOWN_REVISION,
    );
  });

  it("should send since_revision from sync_meta to apiClient.pull", async () => {
    asMock(ctx.syncMetaRepository.getValue).mockResolvedValue(42);
    const service = createService(ctx);

    await service.pull();

    expect(ctx.mockSyncAdapter.pull).toHaveBeenCalledWith({
      since_revision: 42,
    });
  });

  it("should call applyServerRecords on all entity repositories", async () => {
    const serverTasks = [makeTask({ needsSync: false })];
    ctx.mockSyncAdapter = createMockSyncAdapter({
      pull: vi.fn().mockResolvedValue(
        makePullResponse({
          tasks: serverTasks,
          goals: [],
          ideas: [],
          contexts: [],
          categories: [],
          checklist_items: [],
          current_revision: 5,
        }),
      ),
    });
    const service = createService(ctx);

    await service.pull();

    // After normalization, sort_order is converted from number to string
    const normalizedTasks = serverTasks.map((task) => ({
      ...task,
      sort_order: String(task.sort_order),
    }));
    expect(ctx.taskRepository.applyServerRecords).toHaveBeenCalledWith(
      normalizedTasks,
    );
    expect(ctx.goalRepository.applyServerRecords).toHaveBeenCalledWith([]);
    expect(ctx.contextRepository.applyServerRecords).toHaveBeenCalledWith([]);
    expect(ctx.categoryRepository.applyServerRecords).toHaveBeenCalledWith([]);
    expect(ctx.checklistRepository.applyServerRecords).toHaveBeenCalledWith([]);
    expect(ctx.ideaRepository.applyServerRecords).toHaveBeenCalledWith([]);
  });

  it("should call settingsRepository.bulkUpsert with server settings", async () => {
    const serverSettings = [
      {
        key: "default_box",
        value: "inbox",
        updated_at: "2026-01-01T00:00:00.000Z",
        needsSync: false,
      },
    ];
    ctx.mockSyncAdapter = createMockSyncAdapter({
      pull: vi
        .fn()
        .mockResolvedValue(
          makePullResponse({ settings: serverSettings, current_revision: 5 }),
        ),
    });
    const service = createService(ctx);

    await service.pull();

    expect(ctx.settingsRepository.bulkUpsert).toHaveBeenCalledWith(
      serverSettings,
    );
  });

  it("should save current_revision to sync_meta after pull", async () => {
    ctx.mockSyncAdapter = createMockSyncAdapter({
      pull: vi
        .fn()
        .mockResolvedValue(makePullResponse({ current_revision: 55 })),
    });
    const service = createService(ctx);

    await service.pull();

    expect(ctx.syncMetaRepository.setValue).toHaveBeenCalledWith(
      SYNC_META_KEYS.LAST_KNOWN_REVISION,
      55,
    );
  });

  it("should throw if pull response is not ok", async () => {
    ctx.mockSyncAdapter = createMockSyncAdapter({
      pull: vi.fn().mockResolvedValue({ ok: false }),
    });
    const service = createService(ctx);

    await expect(service.pull()).rejects.toThrow("Pull failed");
  });

  // implements FR5 of spec-sync-protocol
  it("should purge local deleted records when server purge_revision increased", async () => {
    const deletedTaskId = crypto.randomUUID();
    await db.tasks.put(
      makeTask({
        id: deletedTaskId,
        name: "Deleted Task",
        is_deleted: true,
        revision: 1,
        needsSync: false,
      }),
    );
    asMock(ctx.syncMetaRepository.getValue)
      .mockResolvedValueOnce(5) // last_known_revision
      .mockResolvedValueOnce(2); // last_known_purge_revision
    ctx.mockSyncAdapter = createMockSyncAdapter({
      pull: vi
        .fn()
        .mockResolvedValue(
          makePullResponse({ purge_revision: 3, current_revision: 10 }),
        ),
    });
    const service = createService(ctx);

    await service.pull();

    expect(ctx.syncMetaRepository.setValue).toHaveBeenCalledWith(
      SYNC_META_KEYS.LAST_KNOWN_PURGE_REVISION,
      3,
    );
    const deletedTask = await db.tasks.get(deletedTaskId);
    expect(deletedTask).toBeUndefined();
  });

  it("should NOT purge local deleted records when server purge_revision equals local", async () => {
    asMock(ctx.syncMetaRepository.getValue).mockImplementation((key: string) =>
      key === SYNC_META_KEYS.LAST_KNOWN_PURGE_REVISION
        ? Promise.resolve(5)
        : Promise.resolve(0),
    );
    ctx.mockSyncAdapter = createMockSyncAdapter({
      pull: vi.fn().mockResolvedValue(makePullResponse({ purge_revision: 5 })),
    });
    const deletedTaskId = crypto.randomUUID();
    await db.tasks.put(
      makeTask({
        id: deletedTaskId,
        name: "Deleted",
        is_deleted: true,
        revision: 1,
        needsSync: false,
      }),
    );
    const service = createService(ctx);

    await service.pull();

    const deletedTask = await db.tasks.get(deletedTaskId);
    expect(deletedTask).toBeDefined();
  });

  it("should dispatch sync_complete event after successful pull", async () => {
    const service = createService(ctx);
    let eventFired = false;
    const handler = () => {
      eventFired = true;
    };
    window.addEventListener("sync_complete", handler);

    await service.pull();

    window.removeEventListener("sync_complete", handler);
    expect(eventFired).toBe(true);
  });

  // Implements FR1 of fractional-sort-order
  it("should normalize numeric sort_order to string when pulling tasks", async () => {
    const serverTask = makeTask({
      id: "t-num",
      sort_order: 7 as unknown as number,
      needsSync: false,
    });
    ctx.mockSyncAdapter = createMockSyncAdapter({
      pull: vi.fn().mockResolvedValue(
        makePullResponse({
          tasks: [serverTask],
          current_revision: 5,
        }),
      ),
    });
    const service = createService(ctx);

    await service.pull();

    const passedTasks = asMock(ctx.taskRepository.applyServerRecords).mock
      .calls[0][0];
    expect(passedTasks[0].sort_order).toBe("7");
  });

  // Implements FR1 of fractional-sort-order
  it("should leave string sort_order unchanged when pulling tasks", async () => {
    const serverTask = makeTask({
      id: "t-str",
      sort_order: "a0" as unknown as number,
      needsSync: false,
    });
    ctx.mockSyncAdapter = createMockSyncAdapter({
      pull: vi.fn().mockResolvedValue(
        makePullResponse({
          tasks: [serverTask],
          current_revision: 5,
        }),
      ),
    });
    const service = createService(ctx);

    await service.pull();

    const passedTasks = asMock(ctx.taskRepository.applyServerRecords).mock
      .calls[0][0];
    expect(passedTasks[0].sort_order).toBe("a0");
  });
});

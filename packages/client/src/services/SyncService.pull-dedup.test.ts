// implements FR4, FR5 of dedup-recurring-after-pull
import "fake-indexeddb/auto";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { RecurringTaskDeduplicator } from "./RecurringTaskDeduplicator";
import { SyncService } from "./SyncService";
import {
  asMock,
  createMockSyncAdapter,
  makePullResponse,
  makeTask,
  type SyncTestContext,
  setupSyncTestContext,
} from "./SyncService.test-helpers";

function createMockDeduplicator(): RecurringTaskDeduplicator {
  return {
    deduplicate: vi.fn().mockResolvedValue(undefined),
  } as unknown as RecurringTaskDeduplicator;
}

function createServiceWithDedup(
  ctx: SyncTestContext,
  deduplicator: RecurringTaskDeduplicator,
): SyncService {
  return new SyncService(
    ctx.mockSyncAdapter,
    ctx.syncMetaRepository,
    ctx.taskRepository,
    ctx.goalRepository,
    ctx.contextRepository,
    ctx.categoryRepository,
    ctx.checklistRepository,
    ctx.ideaRepository,
    ctx.settingsRepository,
    ctx.attachmentRepository,
    deduplicator,
  );
}

describe("SyncService — pull deduplication (FR4, FR5 of dedup-recurring-after-pull)", () => {
  let ctx: SyncTestContext;
  let mockDeduplicator: RecurringTaskDeduplicator;

  beforeEach(() => {
    ctx = setupSyncTestContext();
    mockDeduplicator = createMockDeduplicator();
  });

  // FR4: dedup called after batch, before sync_complete
  it("should call deduplicator after pull when batch has recurring tasks", async () => {
    const recurringTask = makeTask({
      id: "copy-1",
      original_task_id: "original-1",
      syncStatus: "synced" as const,
    });
    ctx.mockSyncAdapter = createMockSyncAdapter({
      pull: vi.fn().mockResolvedValue(
        makePullResponse({
          tasks: [recurringTask],
          current_revision: 10,
        }),
      ),
    });
    const service = createServiceWithDedup(ctx, mockDeduplicator);

    await service.pull();

    expect(mockDeduplicator.deduplicate).toHaveBeenCalledWith(["original-1"]);
  });

  // FR5: dedup skipped when no tasks with original_task_id in batch
  it("should not call deduplicator when no tasks with original_task_id in batch", async () => {
    const regularTask = makeTask({
      id: "regular-1",
      original_task_id: "",
      syncStatus: "synced" as const,
    });
    ctx.mockSyncAdapter = createMockSyncAdapter({
      pull: vi.fn().mockResolvedValue(
        makePullResponse({
          tasks: [regularTask],
          current_revision: 10,
        }),
      ),
    });
    const service = createServiceWithDedup(ctx, mockDeduplicator);

    await service.pull();

    expect(mockDeduplicator.deduplicate).not.toHaveBeenCalled();
  });

  // FR4: dedup must run BEFORE sync_complete event
  it("should call deduplicator before sync_complete event", async () => {
    const callOrder: string[] = [];

    asMock(mockDeduplicator.deduplicate).mockImplementation(async () => {
      callOrder.push("deduplicate");
    });

    const originalDispatchEvent = window.dispatchEvent.bind(window);
    const dispatchSpy = vi
      .spyOn(window, "dispatchEvent")
      .mockImplementation((event: Event) => {
        if (event.type === "sync_complete") {
          callOrder.push("sync_complete");
        }
        return originalDispatchEvent(event);
      });

    const recurringTask = makeTask({
      id: "copy-1",
      original_task_id: "original-1",
      syncStatus: "synced" as const,
    });
    ctx.mockSyncAdapter = createMockSyncAdapter({
      pull: vi.fn().mockResolvedValue(
        makePullResponse({
          tasks: [recurringTask],
          current_revision: 10,
        }),
      ),
    });
    const service = createServiceWithDedup(ctx, mockDeduplicator);

    await service.pull();

    dispatchSpy.mockRestore();

    expect(callOrder).toEqual(["deduplicate", "sync_complete"]);
  });

  // FR4: collect original_task_ids across multiple pages
  it("should collect original_task_ids across multiple pages", async () => {
    const firstPageTask = makeTask({
      id: "copy-1",
      original_task_id: "original-1",
      syncStatus: "synced" as const,
    });
    const secondPageTask = makeTask({
      id: "copy-2",
      original_task_id: "original-2",
      syncStatus: "synced" as const,
    });

    ctx.mockSyncAdapter = createMockSyncAdapter({
      pull: vi
        .fn()
        .mockResolvedValueOnce(
          makePullResponse({
            tasks: [firstPageTask],
            current_revision: 10,
            has_more: true,
            cursors: { tasks: { revision: 10, last_id: "copy-1" } },
          }),
        )
        .mockResolvedValueOnce(
          makePullResponse({
            tasks: [secondPageTask],
            current_revision: 15,
            has_more: false,
          }),
        ),
    });
    const service = createServiceWithDedup(ctx, mockDeduplicator);

    await service.pull();

    expect(mockDeduplicator.deduplicate).toHaveBeenCalledWith([
      "original-1",
      "original-2",
    ]);
  });
});

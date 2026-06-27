// implements FR5, FR6 of fix-pull-pagination
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SYNC_META_KEYS } from "@/constants";
import {
  asMock,
  createService,
  makePullResponse,
  makeTask,
  type SyncTestContext,
  setupSyncTestContext,
} from "./SyncService.test-helpers";

describe("SyncService — pull pagination", () => {
  let ctx: SyncTestContext;

  beforeEach(() => {
    ctx = setupSyncTestContext();
    vi.spyOn(window, "dispatchEvent").mockImplementation(() => true);
  });

  it("should make exactly 1 pull request when has_more is false", async () => {
    asMock(ctx.mockSyncAdapter.pull).mockResolvedValue(
      makePullResponse({ has_more: false, current_revision: 5 }),
    );

    const service = createService(ctx);
    await service.pull();

    expect(ctx.mockSyncAdapter.pull).toHaveBeenCalledTimes(1);
  });

  it("should make exactly 2 pull requests when first returns has_more true", async () => {
    asMock(ctx.mockSyncAdapter.pull)
      .mockResolvedValueOnce(
        makePullResponse({ has_more: true, current_revision: 5 }),
      )
      .mockResolvedValueOnce(
        makePullResponse({ has_more: false, current_revision: 10 }),
      );

    const service = createService(ctx);
    await service.pull();

    expect(ctx.mockSyncAdapter.pull).toHaveBeenCalledTimes(2);
  });

  it("should use current_revision from first batch as since_revision for second", async () => {
    const firstBatchRevision = 5;
    asMock(ctx.syncMetaRepository.getValue).mockResolvedValue(0);
    asMock(ctx.mockSyncAdapter.pull)
      .mockResolvedValueOnce(
        makePullResponse({
          has_more: true,
          current_revision: firstBatchRevision,
        }),
      )
      .mockResolvedValueOnce(
        makePullResponse({ has_more: false, current_revision: 10 }),
      );

    const service = createService(ctx);
    await service.pull();

    const secondCallArgs = asMock(ctx.mockSyncAdapter.pull).mock.calls[1][0];
    expect(secondCallArgs.since_revision).toBe(firstBatchRevision);
  });

  it("should apply entities from each batch immediately", async () => {
    const firstBatchTasks = [makeTask({ id: "task-1", revision: 1 })];
    const secondBatchTasks = [makeTask({ id: "task-2", revision: 2 })];

    asMock(ctx.mockSyncAdapter.pull)
      .mockResolvedValueOnce(
        makePullResponse({
          has_more: true,
          current_revision: 5,
          tasks: firstBatchTasks,
        }),
      )
      .mockResolvedValueOnce(
        makePullResponse({
          has_more: false,
          current_revision: 10,
          tasks: secondBatchTasks,
        }),
      );

    const service = createService(ctx);
    await service.pull();

    expect(ctx.taskRepository.applyServerRecords).toHaveBeenCalledTimes(2);
    const firstApplyCall = asMock(ctx.taskRepository.applyServerRecords).mock
      .calls[0][0];
    const secondApplyCall = asMock(ctx.taskRepository.applyServerRecords).mock
      .calls[1][0];
    expect(firstApplyCall).toHaveLength(1);
    expect(firstApplyCall[0].id).toBe("task-1");
    expect(secondApplyCall).toHaveLength(1);
    expect(secondApplyCall[0].id).toBe("task-2");
  });

  it("should save last_known_revision only after final batch", async () => {
    asMock(ctx.mockSyncAdapter.pull)
      .mockResolvedValueOnce(
        makePullResponse({ has_more: true, current_revision: 5 }),
      )
      .mockResolvedValueOnce(
        makePullResponse({ has_more: false, current_revision: 10 }),
      );

    const service = createService(ctx);
    await service.pull();

    // setValue for LAST_KNOWN_REVISION should be called once with final value
    const revisionSetCalls = asMock(
      ctx.syncMetaRepository.setValue,
    ).mock.calls.filter(
      (callArgs: unknown[]) =>
        callArgs[0] === SYNC_META_KEYS.LAST_KNOWN_REVISION,
    );
    expect(revisionSetCalls).toHaveLength(1);
    expect(revisionSetCalls[0][1]).toBe(10);
  });

  it("should handle three pagination rounds", async () => {
    asMock(ctx.mockSyncAdapter.pull)
      .mockResolvedValueOnce(
        makePullResponse({ has_more: true, current_revision: 5 }),
      )
      .mockResolvedValueOnce(
        makePullResponse({ has_more: true, current_revision: 10 }),
      )
      .mockResolvedValueOnce(
        makePullResponse({ has_more: false, current_revision: 15 }),
      );

    const service = createService(ctx);
    await service.pull();

    expect(ctx.mockSyncAdapter.pull).toHaveBeenCalledTimes(3);

    // Verify since_revision progression: 0 -> 5 -> 10
    const pullCalls = asMock(ctx.mockSyncAdapter.pull).mock.calls;
    expect(pullCalls[1][0].since_revision).toBe(5);
    expect(pullCalls[2][0].since_revision).toBe(10);

    // Revision saved only once with final value
    const revisionSetCalls = asMock(
      ctx.syncMetaRepository.setValue,
    ).mock.calls.filter(
      (callArgs: unknown[]) =>
        callArgs[0] === SYNC_META_KEYS.LAST_KNOWN_REVISION,
    );
    expect(revisionSetCalls).toHaveLength(1);
    expect(revisionSetCalls[0][1]).toBe(15);
  });

  it("should pass cursors from first response to second request", async () => {
    const responseCursors = { tasks: { revision: 5, last_id: "xyz" } };

    asMock(ctx.mockSyncAdapter.pull)
      .mockResolvedValueOnce(
        makePullResponse({
          has_more: true,
          current_revision: 5,
          cursors: responseCursors,
        }),
      )
      .mockResolvedValueOnce(
        makePullResponse({ has_more: false, current_revision: 10 }),
      );

    const service = createService(ctx);
    await service.pull();

    const secondCallArgs = asMock(ctx.mockSyncAdapter.pull).mock.calls[1][0];
    expect(secondCallArgs.cursors).toEqual(responseCursors);
  });

  it("should not include cursors in first pull request", async () => {
    asMock(ctx.mockSyncAdapter.pull)
      .mockResolvedValueOnce(
        makePullResponse({
          has_more: true,
          current_revision: 5,
          cursors: { tasks: { revision: 5, last_id: "abc" } },
        }),
      )
      .mockResolvedValueOnce(
        makePullResponse({ has_more: false, current_revision: 10 }),
      );

    const service = createService(ctx);
    await service.pull();

    const firstCallArgs = asMock(ctx.mockSyncAdapter.pull).mock.calls[0][0];
    expect(firstCallArgs.cursors).toBeUndefined();
  });

  it("should not include cursors when response has_more is false", async () => {
    asMock(ctx.mockSyncAdapter.pull).mockResolvedValue(
      makePullResponse({ has_more: false, current_revision: 5 }),
    );

    const service = createService(ctx);
    await service.pull();

    const firstCallArgs = asMock(ctx.mockSyncAdapter.pull).mock.calls[0][0];
    expect(firstCallArgs.cursors).toBeUndefined();
  });

  it("should pass settings_updated_at only on first request", async () => {
    const storedTimestamp = "2026-01-15T10:00:00.000Z";
    localStorage.setItem("settings_updated_at", storedTimestamp);

    asMock(ctx.mockSyncAdapter.pull)
      .mockResolvedValueOnce(
        makePullResponse({ has_more: true, current_revision: 5 }),
      )
      .mockResolvedValueOnce(
        makePullResponse({ has_more: false, current_revision: 10 }),
      );

    const service = createService(ctx);
    await service.pull();

    const pullCalls = asMock(ctx.mockSyncAdapter.pull).mock.calls;
    expect(pullCalls[0][0].settings_updated_at).toBe(storedTimestamp);
    expect(pullCalls[1][0].settings_updated_at).toBeUndefined();
  });
});

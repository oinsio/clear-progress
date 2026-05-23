import { beforeEach, describe, expect, it, vi } from "vitest";
import { SYNC_META_KEYS } from "@/constants";
import {
  asMock,
  createMockSyncAdapter,
  createService,
  makePushResponse,
  makeTask,
  type SyncTestContext,
  setupSyncTestContext,
} from "./SyncService.test-helpers";

describe("SyncService — push results > last_known_revision NOT updated after push", () => {
  let ctx: SyncTestContext;

  beforeEach(() => {
    ctx = setupSyncTestContext();
  });

  it("should not update last_known_revision after push (pull handles it)", async () => {
    const task = makeTask({ id: "t1" });
    asMock(ctx.taskRepository.getNeedingSync).mockResolvedValue([task]);
    asMock(ctx.taskRepository.getById).mockResolvedValue(task);
    ctx.mockSyncAdapter = createMockSyncAdapter({
      push: vi
        .fn()
        .mockResolvedValue(
          makePushResponse({ tasks: [{ id: "t1", status: "created" }] }, 20),
        ),
    });
    const service = createService(ctx);

    await service.push();

    expect(ctx.syncMetaRepository.setValue).not.toHaveBeenCalledWith(
      SYNC_META_KEYS.LAST_KNOWN_REVISION,
      expect.anything(),
    );
  });

  it("should not update last_known_revision on conflict either", async () => {
    const task = makeTask({ id: "t1" });
    asMock(ctx.taskRepository.getNeedingSync).mockResolvedValue([task]);
    asMock(ctx.taskRepository.getById).mockResolvedValue(task);
    ctx.mockSyncAdapter = createMockSyncAdapter({
      push: vi.fn().mockResolvedValue(
        makePushResponse({
          tasks: [{ id: "t1", status: "conflict", server_record: task }],
        }),
      ),
    });
    const service = createService(ctx);

    await service.push();

    expect(ctx.syncMetaRepository.setValue).not.toHaveBeenCalled();
  });
});

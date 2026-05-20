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

describe("SyncService — push results > last_known_revision update after push", () => {
  let ctx: SyncTestContext;

  beforeEach(() => {
    ctx = setupSyncTestContext();
  });

  it("should update last_known_revision using response.revision (top-level)", async () => {
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

    expect(ctx.syncMetaRepository.setValue).toHaveBeenCalledWith(
      SYNC_META_KEYS.LAST_KNOWN_REVISION,
      20,
    );
  });

  it("should not update last_known_revision if push response has no top-level revision (all conflict)", async () => {
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

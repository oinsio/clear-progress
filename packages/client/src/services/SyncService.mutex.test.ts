import { beforeEach, describe, expect, it } from "vitest";
import {
  asMock,
  createService,
  makePullResponse,
  type SyncTestContext,
  setupSyncTestContext,
} from "./SyncService.test-helpers";

describe("SyncService — mutex (withLock)", () => {
  let ctx: SyncTestContext;

  beforeEach(() => {
    ctx = setupSyncTestContext();
  });

  it("should serialize concurrent pull calls", async () => {
    const callOrder: string[] = [];
    let resolveFirst!: () => void;

    asMock(ctx.mockSyncAdapter.pull)
      .mockImplementationOnce(async () => {
        callOrder.push("pull1-start");
        await new Promise<void>((resolve) => {
          resolveFirst = resolve;
        });
        callOrder.push("pull1-end");
        return makePullResponse({ current_revision: 1, server_time: "" });
      })
      .mockImplementationOnce(async () => {
        callOrder.push("pull2-start");
        return makePullResponse({ current_revision: 2, server_time: "" });
      });

    const service = createService(ctx);
    const firstPull = service.pull();
    const secondPull = service.pull();

    await Promise.resolve();
    await Promise.resolve();
    resolveFirst();
    await Promise.all([firstPull, secondPull]);

    expect(callOrder).toEqual(["pull1-start", "pull1-end", "pull2-start"]);
  });
});

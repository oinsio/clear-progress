import { beforeEach, describe, expect, it, vi } from "vitest";
import { PUSH_RESULT_STATUS } from "@/constants";
import {
  asMock,
  createMockSyncAdapter,
  createService,
  makeGoal,
  makePushResponse,
  makeTask,
  type SyncTestContext,
  setupSyncTestContext,
} from "./SyncService.test-helpers";

describe("SyncService — push results > conflict", () => {
  let ctx: SyncTestContext;

  beforeEach(() => {
    ctx = setupSyncTestContext();
  });

  it("should not call update when status is CONFLICT but server_record is absent", async () => {
    const task = makeTask({ id: "t1", needsSync: true });
    asMock(ctx.taskRepository.getNeedingSync).mockResolvedValue([task]);
    asMock(ctx.taskRepository.getById).mockResolvedValue(task);
    ctx.mockSyncAdapter = createMockSyncAdapter({
      push: vi.fn().mockResolvedValue(
        makePushResponse({
          tasks: [{ id: "t1", status: PUSH_RESULT_STATUS.CONFLICT }],
        }),
      ),
    });
    const service = createService(ctx);

    await service.push();

    expect(ctx.taskRepository.update).not.toHaveBeenCalled();
  });

  it("should overwrite local record with server_record and clear needsSync", async () => {
    const task = makeTask({ id: "t1", needsSync: true });
    const serverTask = makeTask({
      id: "t1",
      name: "Server version",
      revision: 9,
      needsSync: false,
    });
    asMock(ctx.taskRepository.getNeedingSync).mockResolvedValue([task]);
    asMock(ctx.taskRepository.getById).mockResolvedValue(task);
    ctx.mockSyncAdapter = createMockSyncAdapter({
      push: vi.fn().mockResolvedValue(
        makePushResponse({
          tasks: [{ id: "t1", status: "conflict", server_record: serverTask }],
        }),
      ),
    });
    const service = createService(ctx);

    await service.push();

    expect(ctx.taskRepository.update).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "t1",
        name: "Server version",
        needsSync: false,
      }),
    );
  });

  it("should apply goal conflict server_record", async () => {
    const goal = makeGoal({ id: "g1", needsSync: true });
    const serverGoal = makeGoal({
      id: "g1",
      name: "Server Goal",
      revision: 3,
      needsSync: false,
    });
    asMock(ctx.goalRepository.getNeedingSync).mockResolvedValue([goal]);
    asMock(ctx.goalRepository.getById).mockResolvedValue(goal);
    ctx.mockSyncAdapter = createMockSyncAdapter({
      push: vi.fn().mockResolvedValue(
        makePushResponse({
          goals: [{ id: "g1", status: "conflict", server_record: serverGoal }],
        }),
      ),
    });
    const service = createService(ctx);

    await service.push();

    expect(ctx.goalRepository.update).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "g1",
        name: "Server Goal",
        needsSync: false,
      }),
    );
  });
});

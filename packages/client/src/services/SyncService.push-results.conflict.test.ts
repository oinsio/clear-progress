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
    const task = makeTask({ id: "t1", syncStatus: "pending" as const });
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

  it("should overwrite local record with server_record and clear syncStatus", async () => {
    const task = makeTask({ id: "t1", syncStatus: "pending" as const });
    const serverTask = makeTask({
      id: "t1",
      name: "Server version",
      revision: 9,
      syncStatus: "synced" as const,
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
        syncStatus: "synced" as const,
      }),
    );
  });

  it("should apply goal conflict server_record", async () => {
    const goal = makeGoal({ id: "g1", syncStatus: "pending" as const });
    const serverGoal = makeGoal({
      id: "g1",
      name: "Server Goal",
      revision: 3,
      syncStatus: "synced" as const,
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
        syncStatus: "synced" as const,
      }),
    );
  });
});

// implements FR5 of fix-push-poison-pill — retry mechanism tests
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PUSH_RESULT_STATUS } from "@/constants";
import {
  asMock,
  createMockSyncAdapter,
  createService,
  makePushResponse,
  makeTask,
  type SyncTestContext,
  setupSyncTestContext,
} from "./SyncService.test-helpers";

// Valid UUIDs for tests — Zod pre-validation requires UUID format
const TASK_UUID = "a0a0a0a0-b1b1-c2c2-d3d3-e4e4e4e4e4e4";
const GOAL_UUID = "b1b1b1b1-c2c2-d3d3-e4e4-f5f5f5f5f5f5";

describe("SyncService — push retry after server rejection healing", () => {
  let ctx: SyncTestContext;

  beforeEach(() => {
    ctx = setupSyncTestContext();
  });

  // FR5: retry after healing fk_violation
  it("should retry push after healing a server rejection", async () => {
    const task = makeTask({
      id: TASK_UUID,
      goal_id: GOAL_UUID,
      syncStatus: "pending" as const,
    });
    asMock(ctx.taskRepository.getNeedingSync)
      .mockResolvedValueOnce([task]) // first push: collect dirty
      .mockResolvedValueOnce([{ ...task, goal_id: "" }]) // retry: collect healed
      .mockResolvedValue([]); // no more

    asMock(ctx.taskRepository.getById).mockResolvedValue(task);

    const pushMock = vi
      .fn()
      .mockResolvedValueOnce(
        makePushResponse({
          tasks: [
            {
              id: TASK_UUID,
              status: PUSH_RESULT_STATUS.REJECTED,
              reason: "fk_violation:goal_id",
            },
          ],
        }),
      )
      .mockResolvedValueOnce(
        makePushResponse({
          tasks: [{ id: TASK_UUID, status: PUSH_RESULT_STATUS.ACCEPTED }],
        }),
      );

    ctx.mockSyncAdapter = createMockSyncAdapter({ push: pushMock });
    const service = createService(ctx);

    await service.push();

    expect(pushMock).toHaveBeenCalledTimes(2);
  });

  // FR5: max 2 retries
  it("should not retry more than MAX_PUSH_RETRY_COUNT times", async () => {
    const task = makeTask({
      id: TASK_UUID,
      goal_id: GOAL_UUID,
      syncStatus: "pending" as const,
    });

    // Each call returns the task as needing sync (healing keeps setting pending)
    asMock(ctx.taskRepository.getNeedingSync).mockResolvedValue([task]);
    asMock(ctx.taskRepository.getById).mockResolvedValue(task);

    const pushMock = vi.fn().mockResolvedValue(
      makePushResponse({
        tasks: [
          {
            id: TASK_UUID,
            status: PUSH_RESULT_STATUS.REJECTED,
            reason: "fk_violation:goal_id",
          },
        ],
      }),
    );

    ctx.mockSyncAdapter = createMockSyncAdapter({ push: pushMock });
    const service = createService(ctx);

    await service.push();

    // initial push + 2 retries = 3 total
    expect(pushMock).toHaveBeenCalledTimes(3);
  });

  // FR5: unhealable rejection should NOT trigger retry
  it("should not retry when rejection is unhealable", async () => {
    const task = makeTask({
      id: TASK_UUID,
      syncStatus: "pending" as const,
    });
    asMock(ctx.taskRepository.getNeedingSync).mockResolvedValue([task]);
    asMock(ctx.taskRepository.getById).mockResolvedValue(task);

    const pushMock = vi.fn().mockResolvedValue(
      makePushResponse({
        tasks: [
          {
            id: TASK_UUID,
            status: PUSH_RESULT_STATUS.REJECTED,
            reason: "check_violation:box",
          },
        ],
      }),
    );

    ctx.mockSyncAdapter = createMockSyncAdapter({ push: pushMock });
    const service = createService(ctx);

    await service.push();

    // Only 1 push — no retry since rejection is unhealable
    expect(pushMock).toHaveBeenCalledTimes(1);
  });
});

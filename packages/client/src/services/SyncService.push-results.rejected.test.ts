// implements FR5 of fix-push-poison-pill
import type { PushResponse } from "@clear-progress/contract";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PUSH_RESULT_STATUS, RECORD_SYNC_STATUS } from "@/constants";
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
const CONTEXT_UUID = "c2c2c2c2-d3d3-e4e4-f5f5-a6a6a6a6a6a6";
const CATEGORY_UUID = "d3d3d3d3-e4e4-f5f5-a6a6-b7b7b7b7b7b7";
const CHECKLIST_UUID = "e4e4e4e4-f5f5-a6a6-b7b7-c8c8c8c8c8c8";

describe("SyncService — push results > rejected statuses", () => {
  let ctx: SyncTestContext;

  beforeEach(() => {
    ctx = setupSyncTestContext();
  });

  // FR5: healable fk_violation:goal_id -> clears goal_id, sets pending
  it("should heal fk_violation:goal_id by clearing goal_id and setting pending", async () => {
    const task = makeTask({
      id: TASK_UUID,
      goal_id: GOAL_UUID,
      syncStatus: "pending" as const,
    });
    asMock(ctx.taskRepository.getNeedingSync).mockResolvedValue([task]);
    asMock(ctx.taskRepository.getById).mockResolvedValue(task);
    ctx.mockSyncAdapter = createMockSyncAdapter({
      push: vi.fn().mockResolvedValue(
        makePushResponse({
          tasks: [
            {
              id: TASK_UUID,
              status: PUSH_RESULT_STATUS.REJECTED,
              reason: "fk_violation:goal_id",
            },
          ],
        }),
      ),
    });
    const service = createService(ctx);

    await service.push();

    expect(ctx.taskRepository.update).toHaveBeenCalledWith(
      expect.objectContaining({
        id: TASK_UUID,
        goal_id: "",
        syncStatus: RECORD_SYNC_STATUS.PENDING,
      }),
    );
  });

  // FR5: healable fk_violation:context_id -> clears context_id, sets pending
  it("should heal fk_violation:context_id by clearing context_id", async () => {
    const task = makeTask({
      id: TASK_UUID,
      context_id: CONTEXT_UUID,
      syncStatus: "pending" as const,
    });
    asMock(ctx.taskRepository.getNeedingSync).mockResolvedValue([task]);
    asMock(ctx.taskRepository.getById).mockResolvedValue(task);
    ctx.mockSyncAdapter = createMockSyncAdapter({
      push: vi.fn().mockResolvedValue(
        makePushResponse({
          tasks: [
            {
              id: TASK_UUID,
              status: PUSH_RESULT_STATUS.REJECTED,
              reason: "fk_violation:context_id",
            },
          ],
        }),
      ),
    });
    const service = createService(ctx);

    await service.push();

    expect(ctx.taskRepository.update).toHaveBeenCalledWith(
      expect.objectContaining({
        id: TASK_UUID,
        context_id: "",
        syncStatus: RECORD_SYNC_STATUS.PENDING,
      }),
    );
  });

  // FR5: healable fk_violation:category_id -> clears category_id, sets pending
  it("should heal fk_violation:category_id by clearing category_id", async () => {
    const task = makeTask({
      id: TASK_UUID,
      category_id: CATEGORY_UUID,
      syncStatus: "pending" as const,
    });
    asMock(ctx.taskRepository.getNeedingSync).mockResolvedValue([task]);
    asMock(ctx.taskRepository.getById).mockResolvedValue(task);
    ctx.mockSyncAdapter = createMockSyncAdapter({
      push: vi.fn().mockResolvedValue(
        makePushResponse({
          tasks: [
            {
              id: TASK_UUID,
              status: PUSH_RESULT_STATUS.REJECTED,
              reason: "fk_violation:category_id",
            },
          ],
        }),
      ),
    });
    const service = createService(ctx);

    await service.push();

    expect(ctx.taskRepository.update).toHaveBeenCalledWith(
      expect.objectContaining({
        id: TASK_UUID,
        category_id: "",
        syncStatus: RECORD_SYNC_STATUS.PENDING,
      }),
    );
  });

  // FR5: healable fk_violation:task_id -> soft-deletes the record
  it("should heal fk_violation:task_id by setting is_deleted to true", async () => {
    const task = makeTask({
      id: TASK_UUID,
      syncStatus: "pending" as const,
    });
    asMock(ctx.taskRepository.getNeedingSync).mockResolvedValue([task]);
    asMock(ctx.taskRepository.getById).mockResolvedValue(task);
    ctx.mockSyncAdapter = createMockSyncAdapter({
      push: vi.fn().mockResolvedValue(
        makePushResponse({
          tasks: [
            {
              id: TASK_UUID,
              status: PUSH_RESULT_STATUS.REJECTED,
              reason: "fk_violation:task_id",
            },
          ],
        }),
      ),
    });
    const service = createService(ctx);

    await service.push();

    expect(ctx.taskRepository.update).toHaveBeenCalledWith(
      expect.objectContaining({
        id: TASK_UUID,
        is_deleted: true,
        syncStatus: RECORD_SYNC_STATUS.PENDING,
      }),
    );
  });

  // FR5: unhealable check_violation -> syncStatus: "rejected"
  it("should mark record as rejected for check_violation", async () => {
    const task = makeTask({
      id: TASK_UUID,
      syncStatus: "pending" as const,
    });
    asMock(ctx.taskRepository.getNeedingSync).mockResolvedValue([task]);
    asMock(ctx.taskRepository.getById).mockResolvedValue(task);
    ctx.mockSyncAdapter = createMockSyncAdapter({
      push: vi.fn().mockResolvedValue(
        makePushResponse({
          tasks: [
            {
              id: TASK_UUID,
              status: PUSH_RESULT_STATUS.REJECTED,
              reason: "check_violation:box",
            },
          ],
        }),
      ),
    });
    const service = createService(ctx);

    await service.push();

    expect(ctx.taskRepository.update).toHaveBeenCalledWith(
      expect.objectContaining({
        id: TASK_UUID,
        syncStatus: RECORD_SYNC_STATUS.REJECTED,
      }),
    );
  });

  // FR5: unhealable unique_violation -> syncStatus: "rejected"
  it("should mark record as rejected for unique_violation", async () => {
    const task = makeTask({
      id: TASK_UUID,
      syncStatus: "pending" as const,
    });
    asMock(ctx.taskRepository.getNeedingSync).mockResolvedValue([task]);
    asMock(ctx.taskRepository.getById).mockResolvedValue(task);
    ctx.mockSyncAdapter = createMockSyncAdapter({
      push: vi.fn().mockResolvedValue(
        makePushResponse({
          tasks: [
            {
              id: TASK_UUID,
              status: PUSH_RESULT_STATUS.REJECTED,
              reason: "unique_violation",
            },
          ],
        }),
      ),
    });
    const service = createService(ctx);

    await service.push();

    expect(ctx.taskRepository.update).toHaveBeenCalledWith(
      expect.objectContaining({
        id: TASK_UUID,
        syncStatus: RECORD_SYNC_STATUS.REJECTED,
      }),
    );
  });

  // FR5: rejected without reason -> syncStatus: "rejected"
  it("should mark record as rejected when no reason is provided", async () => {
    const task = makeTask({
      id: TASK_UUID,
      syncStatus: "pending" as const,
    });
    asMock(ctx.taskRepository.getNeedingSync).mockResolvedValue([task]);
    asMock(ctx.taskRepository.getById).mockResolvedValue(task);
    ctx.mockSyncAdapter = createMockSyncAdapter({
      push: vi.fn().mockResolvedValue(
        makePushResponse({
          tasks: [{ id: TASK_UUID, status: PUSH_RESULT_STATUS.REJECTED }],
        }),
      ),
    });
    const service = createService(ctx);

    await service.push();

    expect(ctx.taskRepository.update).toHaveBeenCalledWith(
      expect.objectContaining({
        id: TASK_UUID,
        syncStatus: RECORD_SYNC_STATUS.REJECTED,
      }),
    );
  });

  // Unknown status should not call update for the push result handler
  it("should not call update for unknown status from server", async () => {
    const task = makeTask({
      id: TASK_UUID,
      syncStatus: "pending" as const,
    });
    asMock(ctx.taskRepository.getNeedingSync).mockResolvedValue([task]);
    asMock(ctx.taskRepository.getById).mockResolvedValue(task);
    ctx.mockSyncAdapter = createMockSyncAdapter({
      push: vi.fn().mockResolvedValue(
        makePushResponse({
          // biome-ignore lint/suspicious/noExplicitAny: testing unknown status
          tasks: [{ id: TASK_UUID, status: "unknown_status" as any }],
        }),
      ),
    });
    const service = createService(ctx);

    await service.push();

    // update should NOT be called by push result handler for unknown status
    expect(ctx.taskRepository.update).not.toHaveBeenCalled();
  });

  // FR5: rejected for non-task entities
  it.each([
    {
      entityName: "goal",
      payloadKey: "goals" as const,
      entityId: GOAL_UUID,
    },
    {
      entityName: "context",
      payloadKey: "contexts" as const,
      entityId: CONTEXT_UUID,
    },
    {
      entityName: "checklist_item",
      payloadKey: "checklist_items" as const,
      entityId: CHECKLIST_UUID,
    },
  ])("should mark $entityName as rejected when status is REJECTED without reason", async ({
    payloadKey,
    entityId,
  }) => {
    // Need at least one entity to trigger push
    const task = makeTask({
      id: TASK_UUID,
      syncStatus: "pending" as const,
    });
    asMock(ctx.taskRepository.getNeedingSync).mockResolvedValue([task]);

    const repoMap = {
      goals: ctx.goalRepository,
      contexts: ctx.contextRepository,
      checklist_items: ctx.checklistRepository,
    } as const;

    const entityRecord = {
      id: entityId,
      syncStatus: "pending",
      updated_at: "2026-01-01T00:00:00.000Z",
      revision: 0,
    };
    asMock(repoMap[payloadKey].getById).mockResolvedValue(entityRecord);

    ctx.mockSyncAdapter = createMockSyncAdapter({
      push: vi.fn().mockResolvedValue(
        makePushResponse({
          [payloadKey]: [{ id: entityId, status: PUSH_RESULT_STATUS.REJECTED }],
        } as PushResponse["results"]),
      ),
    });
    const service = createService(ctx);

    await service.push();

    expect(asMock(repoMap[payloadKey].update)).toHaveBeenCalledWith(
      expect.objectContaining({
        id: entityId,
        syncStatus: RECORD_SYNC_STATUS.REJECTED,
      }),
    );
  });
});

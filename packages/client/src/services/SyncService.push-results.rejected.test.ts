import type { PushResponse } from "@clear-progress/contract";
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

describe("SyncService — push results > rejected and unknown statuses", () => {
  let ctx: SyncTestContext;

  beforeEach(() => {
    ctx = setupSyncTestContext();
  });

  it("should not call update when task result status is REJECTED", async () => {
    const task = makeTask({ id: "t1", needsSync: true });
    asMock(ctx.taskRepository.getNeedingSync).mockResolvedValue([task]);
    asMock(ctx.taskRepository.getById).mockResolvedValue(task);
    ctx.mockSyncAdapter = createMockSyncAdapter({
      push: vi.fn().mockResolvedValue(
        makePushResponse({
          tasks: [{ id: "t1", status: PUSH_RESULT_STATUS.REJECTED }],
        }),
      ),
    });
    const service = createService(ctx);

    await service.push();

    expect(ctx.taskRepository.update).not.toHaveBeenCalled();
  });

  it("should not call update when task result has unknown status", async () => {
    const task = makeTask({ id: "t1", needsSync: true });
    asMock(ctx.taskRepository.getNeedingSync).mockResolvedValue([task]);
    asMock(ctx.taskRepository.getById).mockResolvedValue(task);
    ctx.mockSyncAdapter = createMockSyncAdapter({
      push: vi.fn().mockResolvedValue(
        makePushResponse({
          // biome-ignore lint/suspicious/noExplicitAny: testing unknown status
          tasks: [{ id: "t1", status: "unknown_status" as any }],
        }),
      ),
    });
    const service = createService(ctx);

    await service.push();

    expect(ctx.taskRepository.update).not.toHaveBeenCalled();
  });

  it.each([
    { entityName: "goal", payloadKey: "goals" as const },
    { entityName: "context", payloadKey: "contexts" as const },
    { entityName: "checklist_item", payloadKey: "checklist_items" as const },
  ])("should not call update for $entityName when status is REJECTED", async ({
    payloadKey,
  }) => {
    const task = makeTask({ id: "t1", needsSync: true });
    asMock(ctx.taskRepository.getNeedingSync).mockResolvedValue([task]);
    ctx.mockSyncAdapter = createMockSyncAdapter({
      push: vi.fn().mockResolvedValue(
        makePushResponse({
          [payloadKey]: [
            { id: "entity-1", status: PUSH_RESULT_STATUS.REJECTED },
          ],
        } as PushResponse["results"]),
      ),
    });
    const service = createService(ctx);

    await service.push();

    const repoMap = {
      goals: ctx.goalRepository,
      contexts: ctx.contextRepository,
      checklist_items: ctx.checklistRepository,
    } as const;
    expect(asMock(repoMap[payloadKey].update)).not.toHaveBeenCalled();
  });
});

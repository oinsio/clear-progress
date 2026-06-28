import type { PushResponse } from "@clear-progress/contract";
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

import { db } from "@/db/database";
import {
  asMock,
  type createEntityRepoMock,
  createMockSyncAdapter,
  createService,
  ENTITY_TEST_CASES_WITH_REVISION,
  makePushResponse,
  makeTask,
  type SyncTestContext,
  setupSyncTestContext,
} from "./SyncService.test-helpers";

describe("SyncService — push results > accepted", () => {
  let ctx: SyncTestContext;

  beforeEach(async () => {
    ctx = setupSyncTestContext();
    await db.tasks.clear();
    await db.checklist_items.clear();
    await db.tasks.put(makeTask({ id: "t1", syncStatus: "synced" as const }));
  });

  it.each(
    ENTITY_TEST_CASES_WITH_REVISION,
  )("should clear syncStatus for accepted $entityName using pushRevision from response", async ({
    getRepo,
    makeEntity,
    payloadKey,
    pushRevision,
  }) => {
    const entity = makeEntity() as { id: string };
    const repository = getRepo(ctx) as unknown as ReturnType<
      typeof createEntityRepoMock
    >;
    asMock(repository.getNeedingSync).mockResolvedValue([entity]);
    asMock(repository.getById).mockResolvedValue(entity);
    ctx.mockSyncAdapter = createMockSyncAdapter({
      push: vi.fn().mockResolvedValue(
        makePushResponse(
          {
            [payloadKey]: [{ id: entity.id, status: "accepted" }],
          } as PushResponse["results"],
          pushRevision,
        ),
      ),
    });
    const service = createService(ctx);

    await service.push();

    expect(repository.update).toHaveBeenCalledWith(
      expect.objectContaining({
        id: entity.id,
        syncStatus: "synced" as const,
        revision: pushRevision,
      }),
    );
  });

  describe("created/accepted", () => {
    it("should clear syncStatus and set revision when updated_at is unchanged", async () => {
      const task = makeTask({
        id: "t1",
        updated_at: "2026-01-01T10:00:00.000Z",
        syncStatus: "pending" as const,
      });
      asMock(ctx.taskRepository.getNeedingSync).mockResolvedValue([task]);
      asMock(ctx.taskRepository.getById).mockResolvedValue({
        ...task,
        updated_at: "2026-01-01T10:00:00.000Z",
      });
      ctx.mockSyncAdapter = createMockSyncAdapter({
        push: vi
          .fn()
          .mockResolvedValue(
            makePushResponse({ tasks: [{ id: "t1", status: "created" }] }, 7),
          ),
      });
      const service = createService(ctx);

      await service.push();

      expect(ctx.taskRepository.update).toHaveBeenCalledWith(
        expect.objectContaining({
          id: "t1",
          syncStatus: "synced" as const,
          revision: 7,
        }),
      );
    });

    it("should keep syncStatus and set revision when updated_at changed during push", async () => {
      const task = makeTask({
        id: "t1",
        updated_at: "2026-01-01T10:00:00.000Z",
        syncStatus: "pending" as const,
      });
      asMock(ctx.taskRepository.getNeedingSync).mockResolvedValue([task]);
      asMock(ctx.taskRepository.getById).mockResolvedValue({
        ...task,
        updated_at: "2026-01-01T10:00:01.000Z",
      });
      ctx.mockSyncAdapter = createMockSyncAdapter({
        push: vi
          .fn()
          .mockResolvedValue(
            makePushResponse({ tasks: [{ id: "t1", status: "accepted" }] }, 8),
          ),
      });
      const service = createService(ctx);

      await service.push();

      expect(ctx.taskRepository.update).toHaveBeenCalledWith(
        expect.objectContaining({
          id: "t1",
          syncStatus: "pending" as const,
          revision: 8,
        }),
      );
    });
  });
});

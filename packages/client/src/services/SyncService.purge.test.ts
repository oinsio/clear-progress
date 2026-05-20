import { beforeEach, describe, expect, it, vi } from "vitest";
import { SYNC_META_KEYS } from "@/constants";
import { db } from "@/db/database";
import type { PurgeResponse } from "@/types/api";
import {
  createMockSyncAdapter,
  createService,
  makeCategory,
  makeChecklistItem,
  makeContext,
  makeGoal,
  makeIdea,
  type SyncTestContext,
  setupSyncTestContext,
} from "./SyncService.test-helpers";

function makePurgeResponse(
  overrides: Partial<PurgeResponse> = {},
): PurgeResponse {
  return {
    ok: true,
    purged: {
      tasks: 0,
      goals: 0,
      contexts: 0,
      categories: 0,
      checklist_items: 0,
      ideas: 0,
    },
    purge_revision: 1,
    ...overrides,
  };
}

describe("SyncService — purge", () => {
  let ctx: SyncTestContext;

  beforeEach(() => {
    ctx = setupSyncTestContext();
  });

  it("should return purged stats from adapter response", async () => {
    const purgedStats = {
      tasks: 3,
      goals: 1,
      contexts: 0,
      categories: 0,
      checklist_items: 2,
      ideas: 0,
    };
    ctx.mockSyncAdapter = createMockSyncAdapter({
      purge: vi
        .fn()
        .mockResolvedValue(makePurgeResponse({ purged: purgedStats })),
    });
    const service = createService(ctx);

    const result = await service.purge();

    expect(result).toEqual(purgedStats);
  });

  it("should throw when purge response is not ok", async () => {
    ctx.mockSyncAdapter = createMockSyncAdapter({
      purge: vi.fn().mockResolvedValue(makePurgeResponse({ ok: false })),
    });
    const service = createService(ctx);

    await expect(service.purge()).rejects.toThrow("Purge failed");
  });

  it("should update last_known_purge_revision in syncMetaRepository after purge", async () => {
    ctx.mockSyncAdapter = createMockSyncAdapter({
      purge: vi
        .fn()
        .mockResolvedValue(makePurgeResponse({ purge_revision: 7 })),
    });
    const service = createService(ctx);

    await service.purge();

    expect(ctx.syncMetaRepository.setValue).toHaveBeenCalledWith(
      SYNC_META_KEYS.LAST_KNOWN_PURGE_REVISION,
      7,
    );
  });

  it("should call pull after purge to sync current_revision", async () => {
    ctx.mockSyncAdapter = createMockSyncAdapter({
      purge: vi.fn().mockResolvedValue(makePurgeResponse()),
    });
    const service = createService(ctx);

    await service.purge();

    expect(ctx.mockSyncAdapter.pull).toHaveBeenCalled();
  });

  it.each([
    {
      entityName: "goal",
      tableName: "goals" as const,
      makeEntity: (id: string) =>
        makeGoal({
          id,
          name: "Deleted Goal",
          is_deleted: true,
          revision: 1,
          needsSync: false,
        }),
    },
    {
      entityName: "context",
      tableName: "contexts" as const,
      makeEntity: (id: string) =>
        makeContext({
          id,
          name: "Deleted Context",
          is_deleted: true,
          revision: 1,
          needsSync: false,
        }),
    },
    {
      entityName: "category",
      tableName: "categories" as const,
      makeEntity: (id: string) =>
        makeCategory({
          id,
          name: "Deleted Category",
          is_deleted: true,
          revision: 1,
          needsSync: false,
        }),
    },
    {
      entityName: "checklist_item",
      tableName: "checklist_items" as const,
      makeEntity: (id: string) =>
        makeChecklistItem({
          id,
          task_id: crypto.randomUUID(),
          name: "Deleted Item",
          is_deleted: true,
          revision: 1,
          needsSync: false,
        }),
    },
    {
      entityName: "idea",
      tableName: "ideas" as const,
      makeEntity: (id: string) =>
        makeIdea({
          id,
          name: "Deleted Idea",
          is_deleted: true,
          revision: 1,
          needsSync: false,
        }),
    },
  ])("should delete soft-deleted $entityName during purge", async ({
    tableName,
    makeEntity,
  }) => {
    const deletedId = crypto.randomUUID();
    await db[tableName].put(makeEntity(deletedId) as never);
    ctx.mockSyncAdapter = createMockSyncAdapter({
      purge: vi.fn().mockResolvedValue(makePurgeResponse()),
    });
    const service = createService(ctx);

    await service.purge();

    const deletedRecord = await db[tableName].get(deletedId);
    expect(deletedRecord).toBeUndefined();
  });
});

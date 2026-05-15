import { beforeEach, describe, expect, it, vi } from "vitest";
import { SYNC_META_KEYS } from "@/constants";
import { db } from "@/db/database";
import type { PurgeResponse } from "@/types/api";
import { toISOTimestamp } from "@/utils/dateHelpers";
import {
  asMock,
  createMockSyncAdapter,
  createService,
  makeCategory,
  makeChecklistItem,
  makeContext,
  makeGoal,
  makeIdea,
  makePullResponse,
  makeTask,
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

describe("SyncService — resetAndPull", () => {
  let ctx: SyncTestContext;

  beforeEach(() => {
    ctx = setupSyncTestContext();
  });

  it("should reset last_known_revision to 0 before pulling", async () => {
    const service = createService(ctx);

    await service.resetAndPull();

    expect(ctx.syncMetaRepository.setValue).toHaveBeenCalledWith(
      SYNC_META_KEYS.LAST_KNOWN_REVISION,
      0,
    );
  });

  it("should call pull during resetAndPull", async () => {
    const service = createService(ctx);

    await service.resetAndPull();

    expect(ctx.mockSyncAdapter.pull).toHaveBeenCalled();
  });

  it("should remove settings_updated_at from localStorage", async () => {
    localStorage.setItem("settings_updated_at", "2026-04-15T10:00:00.000Z");
    const service = createService(ctx);

    await service.resetAndPull();

    expect(localStorage.getItem("settings_updated_at")).toBeNull();
  });

  it.each([
    {
      entityName: "task",
      tableName: "tasks" as const,
      seedRecord: () => {
        const id = crypto.randomUUID();
        return { id, record: makeTask({ id, name: "Task", revision: 1 }) };
      },
    },
    {
      entityName: "goal",
      tableName: "goals" as const,
      seedRecord: () => {
        const id = crypto.randomUUID();
        return {
          id,
          record: makeGoal({
            id,
            name: "Goal",
            status: "planning",
            revision: 1,
          }),
        };
      },
    },
    {
      entityName: "context",
      tableName: "contexts" as const,
      seedRecord: () => {
        const id = crypto.randomUUID();
        return { id, record: makeContext({ id, name: "Home", revision: 1 }) };
      },
    },
    {
      entityName: "category",
      tableName: "categories" as const,
      seedRecord: () => {
        const id = crypto.randomUUID();
        return { id, record: makeCategory({ id, name: "Work", revision: 1 }) };
      },
    },
    {
      entityName: "checklist_item",
      tableName: "checklist_items" as const,
      seedRecord: () => {
        const id = crypto.randomUUID();
        return {
          id,
          record: makeChecklistItem({
            id,
            task_id: crypto.randomUUID(),
            name: "Item",
            revision: 1,
          }),
        };
      },
    },
    {
      entityName: "idea",
      tableName: "ideas" as const,
      seedRecord: () => {
        const id = crypto.randomUUID();
        return { id, record: makeIdea({ id, name: "Idea", revision: 1 }) };
      },
    },
  ])("should mark all $entityName records as needsSync: false in db", async ({
    tableName,
    seedRecord,
  }) => {
    const { id, record } = seedRecord();
    await db[tableName].put(record as never);
    const service = createService(ctx);

    await service.resetAndPull();

    const savedRecord = await db[tableName].get(id);
    expect(savedRecord?.needsSync).toBe(false);
  });

  it("should mark all settings as needsSync: false in db", async () => {
    await db.settings.put({
      key: "accent_color",
      value: "green",
      updated_at: toISOTimestamp(),
      needsSync: true,
    });
    const service = createService(ctx);

    await service.resetAndPull();

    const setting = await db.settings.get("accent_color");
    expect(setting?.needsSync).toBe(false);
  });
});

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

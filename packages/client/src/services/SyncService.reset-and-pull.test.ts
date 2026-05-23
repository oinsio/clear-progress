import { beforeEach, describe, expect, it } from "vitest";
import { SYNC_META_KEYS } from "@/constants";
import { db } from "@/db/database";
import { toISOTimestamp } from "@/utils/dateHelpers";
import {
  createService,
  makeCategory,
  makeChecklistItem,
  makeContext,
  makeGoal,
  makeIdea,
  makeTask,
  type SyncTestContext,
  setupSyncTestContext,
} from "./SyncService.test-helpers";

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

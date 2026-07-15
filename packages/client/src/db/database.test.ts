// Verifies FR1/FR4 of collapse-db-versions
import { beforeEach, describe, expect, it } from "vitest";
import { RECORD_SYNC_STATUS } from "@/constants";
import { buildTask } from "@/test/factories/taskFactory";
import { db } from "./database";

const EXPECTED_VERSION_NUMBER = 1;

const EXPECTED_STORE_NAMES = [
  "tasks",
  "goals",
  "contexts",
  "categories",
  "checklist_items",
  "ideas",
  "settings",
  "files",
  "pending_files",
  "attachments",
  "sync_meta",
] as const;

describe("ClearProgressDatabase", () => {
  beforeEach(async () => {
    if (!db.isOpen()) {
      await db.open();
    }
    await db.tasks.clear();
  });

  it("should open at a single collapsed schema version", () => {
    expect(db.verno).toBe(EXPECTED_VERSION_NUMBER);
  });

  it("should expose all eleven expected stores", () => {
    const storeNames = db.tables.map((table) => table.name);

    for (const expectedStoreName of EXPECTED_STORE_NAMES) {
      expect(storeNames).toContain(expectedStoreName);
    }
    expect(storeNames).toHaveLength(EXPECTED_STORE_NAMES.length);
  });

  it("should index records by syncStatus", async () => {
    const pendingTask = buildTask({ syncStatus: RECORD_SYNC_STATUS.PENDING });
    const syncedTask = buildTask({ syncStatus: RECORD_SYNC_STATUS.SYNCED });
    await db.tasks.bulkAdd([pendingTask, syncedTask]);

    const pendingTasks = await db.tasks
      .where("syncStatus")
      .equals(RECORD_SYNC_STATUS.PENDING)
      .toArray();

    expect(pendingTasks).toHaveLength(1);
    expect(pendingTasks[0].id).toBe(pendingTask.id);
  });
});

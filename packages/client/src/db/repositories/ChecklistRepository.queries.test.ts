// implements FR4 of cascade-checklist-delete
import { describe, expect, it } from "vitest";
import { buildChecklistItem } from "@/test/factories/checklistItemFactory";
import type { ChecklistItem } from "@/types/entities";
import { db } from "../database";
import { createChecklistRepositorySetup } from "./ChecklistRepository.test-setup";

describe("ChecklistRepository", () => {
  const { getRepository } = createChecklistRepositorySetup();

  describe("getAllByTaskId", () => {
    it("should return all items including soft-deleted for the given task_id", async () => {
      const taskId = crypto.randomUUID();
      const activeItem = buildChecklistItem({
        task_id: taskId,
        is_deleted: false,
      });
      const deletedItem = buildChecklistItem({
        task_id: taskId,
        is_deleted: true,
      });
      await db.checklist_items.bulkAdd([activeItem, deletedItem]);

      const items = await getRepository().getAllByTaskId(taskId);

      expect(items).toHaveLength(2);
    });

    it("should return empty array for non-existent task_id", async () => {
      const items = await getRepository().getAllByTaskId(crypto.randomUUID());

      expect(items).toEqual([]);
    });

    it("should include soft-deleted items", async () => {
      const taskId = crypto.randomUUID();
      const deletedItem = buildChecklistItem({
        task_id: taskId,
        is_deleted: true,
      });
      await db.checklist_items.add(deletedItem);

      const items = await getRepository().getAllByTaskId(taskId);

      expect(items[0].id).toBe(deletedItem.id);
    });

    it("should not return items belonging to a different task", async () => {
      const taskId = crypto.randomUUID();
      const otherTaskItem = buildChecklistItem({
        task_id: crypto.randomUUID(),
      });
      await db.checklist_items.add(otherTaskItem);

      const items = await getRepository().getAllByTaskId(taskId);

      expect(items).toEqual([]);
    });
  });

  describe("getActiveByTaskId", () => {
    it("should return only non-deleted items for the given task_id", async () => {
      const taskId = crypto.randomUUID();
      const activeItem = buildChecklistItem({
        task_id: taskId,
        is_deleted: false,
      });
      const deletedItem = buildChecklistItem({
        task_id: taskId,
        is_deleted: true,
      });
      await db.checklist_items.bulkAdd([activeItem, deletedItem]);

      const items = await getRepository().getActiveByTaskId(taskId);

      expect(items).toHaveLength(1);
      expect(items[0].id).toBe(activeItem.id);
    });

    it("should return empty array when all items for task are deleted", async () => {
      const taskId = crypto.randomUUID();
      const deletedItem = buildChecklistItem({
        task_id: taskId,
        is_deleted: true,
      });
      await db.checklist_items.add(deletedItem);

      const items = await getRepository().getActiveByTaskId(taskId);

      expect(items).toEqual([]);
    });

    it("should not return items belonging to a different task", async () => {
      const taskId = crypto.randomUUID();
      const otherTaskItem = buildChecklistItem({
        task_id: crypto.randomUUID(),
        is_deleted: false,
      });
      await db.checklist_items.add(otherTaskItem);

      const items = await getRepository().getActiveByTaskId(taskId);

      expect(items).toEqual([]);
    });
  });

  describe("create", () => {
    it("should throw validation error when item has invalid data", async () => {
      const invalidItem = {
        ...buildChecklistItem(),
        name: 123, // name should be string
      } as unknown as ChecklistItem;

      await expect(getRepository().create(invalidItem)).rejects.toThrow(
        /Invalid checklist item data/,
      );
    });
  });

  describe("update", () => {
    it("should throw validation error when item has invalid data", async () => {
      const invalidItem = {
        ...buildChecklistItem(),
        name: 123,
      } as unknown as ChecklistItem;

      await expect(getRepository().update(invalidItem)).rejects.toThrow(
        /Invalid checklist item data/,
      );
    });
  });

  describe("bulkUpsert", () => {
    it("should throw validation error when array contains invalid item", async () => {
      const validItem = buildChecklistItem();
      const invalidItem = {
        ...buildChecklistItem(),
        name: 123,
      } as unknown as ChecklistItem;

      await expect(
        getRepository().bulkUpsert([validItem, invalidItem]),
      ).rejects.toThrow(/Invalid checklist item data/);
    });
  });

  describe("getAll", () => {
    it("should return all items in database", async () => {
      const item1 = buildChecklistItem();
      const item2 = buildChecklistItem();
      await db.checklist_items.bulkAdd([item1, item2]);

      const items = await getRepository().getAll();

      expect(items).toHaveLength(2);
    });

    it("should return empty array when no items exist", async () => {
      const items = await getRepository().getAll();

      expect(items).toEqual([]);
    });
  });

  describe("getChangedSince", () => {
    it("should return items updated after the given timestamp", async () => {
      const oldItem = buildChecklistItem({
        updated_at: "2025-01-01T00:00:00.000Z",
      });
      const newItem = buildChecklistItem({
        updated_at: "2026-06-01T00:00:00.000Z",
      });
      await db.checklist_items.bulkAdd([oldItem, newItem]);

      const items = await getRepository().getChangedSince(
        "2026-01-01T00:00:00.000Z",
      );

      expect(items).toHaveLength(1);
      expect(items[0].id).toBe(newItem.id);
    });

    it("should return empty array when no items changed since timestamp", async () => {
      const oldItem = buildChecklistItem({
        updated_at: "2025-01-01T00:00:00.000Z",
      });
      await db.checklist_items.add(oldItem);

      const items = await getRepository().getChangedSince(
        "2026-01-01T00:00:00.000Z",
      );

      expect(items).toEqual([]);
    });
  });

  describe("getNeedingSync", () => {
    it("should return only items with syncStatus true", async () => {
      const syncItem = buildChecklistItem({ syncStatus: "pending" as const });
      const noSyncItem = buildChecklistItem({ syncStatus: "synced" as const });
      await db.checklist_items.bulkAdd([syncItem, noSyncItem]);

      const items = await getRepository().getNeedingSync();

      expect(items).toHaveLength(1);
      expect(items[0].id).toBe(syncItem.id);
    });

    it("should return empty array when no items need sync", async () => {
      const item = buildChecklistItem({ syncStatus: "synced" as const });
      await db.checklist_items.add(item);

      const items = await getRepository().getNeedingSync();

      expect(items).toEqual([]);
    });
  });

  describe("applyServerRecords", () => {
    it("should insert new server records with syncStatus false", async () => {
      const serverRecord = {
        id: crypto.randomUUID(),
        task_id: crypto.randomUUID(),
        name: "Server Item",
        is_completed: false,
        sort_order: "0",
        is_deleted: false,
        created_at: "2026-01-01T00:00:00.000Z",
        updated_at: "2026-01-01T00:00:00.000Z",
        revision: 1,
      };

      await getRepository().applyServerRecords([serverRecord]);

      const item = await db.checklist_items.get(serverRecord.id);
      expect(item).toBeDefined();
      expect(item!.syncStatus).toBe("synced");
      expect(item!.name).toBe("Server Item");
    });

    it("should not overwrite local record that needs sync", async () => {
      const localItem = buildChecklistItem({
        name: "Local Version",
        syncStatus: "pending" as const,
      });
      await db.checklist_items.add(localItem);

      const serverRecord = {
        id: localItem.id,
        task_id: localItem.task_id,
        name: "Server Version",
        is_completed: false,
        sort_order: "0",
        is_deleted: false,
        created_at: "2026-01-01T00:00:00.000Z",
        updated_at: "2026-01-01T00:00:00.000Z",
        revision: 2,
      };

      await getRepository().applyServerRecords([serverRecord]);

      const item = await db.checklist_items.get(localItem.id);
      expect(item!.name).toBe("Local Version");
    });

    it("should overwrite local record that does not need sync", async () => {
      const localItem = buildChecklistItem({
        name: "Old Version",
        syncStatus: "synced" as const,
      });
      await db.checklist_items.add(localItem);

      const serverRecord = {
        id: localItem.id,
        task_id: localItem.task_id,
        name: "Updated Server Version",
        is_completed: false,
        sort_order: "0",
        is_deleted: false,
        created_at: "2026-01-01T00:00:00.000Z",
        updated_at: "2026-02-01T00:00:00.000Z",
        revision: 3,
      };

      await getRepository().applyServerRecords([serverRecord]);

      const item = await db.checklist_items.get(localItem.id);
      expect(item!.name).toBe("Updated Server Version");
      expect(item!.syncStatus).toBe("synced");
    });
  });
});

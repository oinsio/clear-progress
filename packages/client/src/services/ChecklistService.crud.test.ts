import { describe, expect, it, vi } from "vitest";
import type { ChecklistRepository } from "@/db/repositories/ChecklistRepository";
import { buildChecklistItem } from "@/test/factories/checklistItemFactory";
import { createMockChecklistRepository } from "@/test/factories/checklistRepositoryFactory";
import { ChecklistService } from "./ChecklistService";

function createService(
  overrides: Partial<Record<keyof ChecklistRepository, unknown>> = {},
): { service: ChecklistService; repository: ChecklistRepository } {
  const repository = createMockChecklistRepository(overrides);
  return { service: new ChecklistService(repository), repository };
}

describe("ChecklistService", () => {
  describe("getByTaskId", () => {
    it("should return empty array when task has no checklist items", async () => {
      const { service } = createService();
      const items = await service.getByTaskId("task-1");
      expect(items).toEqual([]);
    });

    it("should return items sorted by sort_order ascending", async () => {
      const taskId = "task-1";
      const unsortedItems = [
        buildChecklistItem({ task_id: taskId, sort_order: "a2" }),
        buildChecklistItem({ task_id: taskId, sort_order: "a0" }),
        buildChecklistItem({ task_id: taskId, sort_order: "a1" }),
      ];
      const { service } = createService({
        getActiveByTaskId: vi.fn().mockResolvedValue(unsortedItems),
      });
      const items = await service.getByTaskId(taskId);
      expect(String(items[0].sort_order) < String(items[1].sort_order)).toBe(
        true,
      );
      expect(String(items[1].sort_order) < String(items[2].sort_order)).toBe(
        true,
      );
    });

    it("should call repository.getByTaskId with the taskId", async () => {
      const { service, repository } = createService();
      await service.getByTaskId("task-abc");
      expect(repository.getActiveByTaskId).toHaveBeenCalledWith("task-abc");
    });
  });

  describe("getById", () => {
    it("should return item when found", async () => {
      const item = buildChecklistItem();
      const { service } = createService({
        getById: vi.fn().mockResolvedValue(item),
      });
      const result = await service.getById(item.id);
      expect(result).toEqual(item);
    });

    it("should return undefined when item not found", async () => {
      const { service } = createService();
      const result = await service.getById("nonexistent-id");
      expect(result).toBeUndefined();
    });
  });

  describe("create", () => {
    it("should create item with given taskId and name", async () => {
      const { service } = createService();
      const item = await service.create("task-1", "Buy groceries");
      expect(item.task_id).toBe("task-1");
      expect(item.name).toBe("Buy groceries");
    });

    it("should create item with is_completed false", async () => {
      const { service } = createService();
      const item = await service.create("task-1", "Do something");
      expect(item.is_completed).toBe(false);
    });

    it("should create item with is_deleted false", async () => {
      const { service } = createService();
      const item = await service.create("task-1", "Do something");
      expect(item.is_deleted).toBe(false);
    });

    it("should create item with string sort_order when task has no existing items", async () => {
      const { service } = createService();
      const item = await service.create("task-1", "Do something");
      expect(typeof item.sort_order).toBe("string");
    });

    it("should create item with sort_order above existing items", async () => {
      const taskId = "task-1";
      const existingItems = [
        buildChecklistItem({ task_id: taskId, sort_order: "a0" }),
        buildChecklistItem({ task_id: taskId, sort_order: "a1" }),
      ];
      const { service } = createService({
        getActiveByTaskId: vi.fn().mockResolvedValue(existingItems),
      });
      const item = await service.create(taskId, "Third item");
      expect(typeof item.sort_order).toBe("string");
      expect(String(item.sort_order) > "a1").toBe(true);
    });

    it("should create item with a UUID id", async () => {
      const { service } = createService();
      const item = await service.create("task-1", "Do something");
      expect(item.id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
      );
    });

    it("should call repository.create with the constructed item", async () => {
      const { service, repository } = createService();
      const item = await service.create("task-1", "Do something");
      expect(repository.create).toHaveBeenCalledWith(item);
    });

    it("should create item with needsSync true", async () => {
      const { service } = createService();
      const item = await service.create("task-1", "Do something");
      expect(item.needsSync).toBe(true);
    });
  });
});

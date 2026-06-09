import { describe, expect, it, vi } from "vitest";
import { SORT_ORDER_REBALANCE_THRESHOLD } from "@/constants";
import { buildChecklistItem } from "@/test/factories/checklistItemFactory";
import { createMockChecklistRepository } from "@/test/factories/checklistRepositoryFactory";
import { ChecklistService } from "./ChecklistService";

describe("ChecklistService", () => {
  describe("reorderItems", () => {
    it("should update item with new sort_order", async () => {
      const item = buildChecklistItem({
        sort_order: "a0",
        task_id: "task-1",
      });
      const { service, repository } = createServiceWithItem(item);

      await service.reorderItems(item.id, "a1");

      expect(repository.update).toHaveBeenCalledWith(
        expect.objectContaining({
          id: item.id,
          sort_order: "a1",
          needsSync: true,
        }),
      );
    });

    it("should update updated_at when reordering", async () => {
      const item = buildChecklistItem({
        sort_order: "a0",
        task_id: "task-1",
        updated_at: "2025-01-01T00:00:00.000Z",
      });
      const { service, repository } = createServiceWithItem(item);

      await service.reorderItems(item.id, "a1");

      const updatedItem = (repository.update as ReturnType<typeof vi.fn>).mock
        .calls[0][0];
      expect(updatedItem.updated_at).not.toBe("2025-01-01T00:00:00.000Z");
    });

    it("should throw when item not found", async () => {
      const repository = createMockChecklistRepository();
      const service = new ChecklistService(repository);
      await expect(service.reorderItems("nonexistent", "a1")).rejects.toThrow(
        "ChecklistItem not found: nonexistent",
      );
    });

    it("should not trigger rebalancing when key is short", async () => {
      const item = buildChecklistItem({
        sort_order: "a0",
        task_id: "task-1",
      });
      const { service, repository } = createServiceWithItem(item);

      await service.reorderItems(item.id, "a1");

      expect(repository.bulkUpsert).not.toHaveBeenCalled();
    });

    it("should trigger rebalancing when key exceeds threshold", async () => {
      const longKey = "a".repeat(SORT_ORDER_REBALANCE_THRESHOLD + 1);
      const taskId = "task-1";
      const item = buildChecklistItem({ sort_order: "a0", task_id: taskId });
      const taskItems = [
        buildChecklistItem({ sort_order: "a0", task_id: taskId }),
        buildChecklistItem({ sort_order: "a1", task_id: taskId }),
      ];
      const repository = createMockChecklistRepository({
        getById: vi.fn().mockResolvedValue(item),
        getActiveByTaskId: vi.fn().mockResolvedValue(taskItems),
      });
      const service = new ChecklistService(repository);

      await service.reorderItems(item.id, longKey);

      expect(repository.bulkUpsert).toHaveBeenCalled();
    });

    it("should rebalance items of the same task with fresh keys", async () => {
      const longKey = "a".repeat(SORT_ORDER_REBALANCE_THRESHOLD + 1);
      const taskId = "task-1";
      const item = buildChecklistItem({ sort_order: "a0", task_id: taskId });
      const taskItems = [
        buildChecklistItem({ sort_order: "b0", task_id: taskId }),
        buildChecklistItem({ sort_order: "a0", task_id: taskId }),
      ];
      const repository = createMockChecklistRepository({
        getById: vi.fn().mockResolvedValue(item),
        getActiveByTaskId: vi.fn().mockResolvedValue(taskItems),
      });
      const service = new ChecklistService(repository);

      await service.reorderItems(item.id, longKey);

      const rebalancedItems = (
        repository.bulkUpsert as ReturnType<typeof vi.fn>
      ).mock.calls[0][0];
      expect(rebalancedItems).toHaveLength(2);
      for (const rebalancedItem of rebalancedItems) {
        expect(typeof rebalancedItem.sort_order).toBe("string");
        expect(rebalancedItem.needsSync).toBe(true);
      }
    });

    it("should rebalance by task_id scope, not globally", async () => {
      const longKey = "a".repeat(SORT_ORDER_REBALANCE_THRESHOLD + 1);
      const taskId = "task-1";
      const item = buildChecklistItem({ sort_order: "a0", task_id: taskId });
      const repository = createMockChecklistRepository({
        getById: vi.fn().mockResolvedValue(item),
        getActiveByTaskId: vi.fn().mockResolvedValue([item]),
      });
      const service = new ChecklistService(repository);

      await service.reorderItems(item.id, longKey);

      expect(repository.getActiveByTaskId).toHaveBeenCalledWith(taskId);
    });
  });
});

function createServiceWithItem(item: ReturnType<typeof buildChecklistItem>) {
  const repository = createMockChecklistRepository({
    getById: vi.fn().mockResolvedValue(item),
  });
  const service = new ChecklistService(repository);
  return { service, repository };
}

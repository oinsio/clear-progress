import { describe, expect, it, type vi } from "vitest";
import type { ChecklistRepository } from "@/db/repositories/ChecklistRepository";
import { Temporal } from "@/lib/temporal";
import { buildChecklistItem } from "@/test/factories/checklistItemFactory";
import { createMockChecklistRepository } from "@/test/factories/checklistRepositoryFactory";
import type { ChecklistItem } from "@/types/entities";
import { toISOTimestamp } from "@/utils/dateHelpers";
import { ChecklistService } from "./ChecklistService";

function createService(
  overrides: Partial<Record<keyof ChecklistRepository, unknown>> = {},
): { service: ChecklistService; repository: ChecklistRepository } {
  const repository = createMockChecklistRepository(overrides);
  return { service: new ChecklistService(repository), repository };
}

describe("ChecklistService", () => {
  describe("reorderItems", () => {
    it("should do nothing when items array is empty", async () => {
      const { service, repository } = createService();
      await service.reorderItems([]);
      expect(repository.bulkUpsert).not.toHaveBeenCalled();
    });

    it("should assign sort_order based on index position in given order", async () => {
      const items = [
        buildChecklistItem({ sort_order: 2 }),
        buildChecklistItem({ sort_order: 0 }),
        buildChecklistItem({ sort_order: 1 }),
      ];
      const { service, repository } = createService();
      await service.reorderItems(items);
      const updatedItems = (repository.bulkUpsert as ReturnType<typeof vi.fn>)
        .mock.calls[0][0] as ChecklistItem[];
      expect(updatedItems[0].sort_order).toBe(0);
      expect(updatedItems[1].sort_order).toBe(1);
      expect(updatedItems[2].sort_order).toBe(2);
    });

    it("should update updated_at for each item", async () => {
      const oldTimestamp = toISOTimestamp(
        Temporal.Instant.from("2025-01-01T00:00:00.000Z"),
      );
      const items = [
        buildChecklistItem({ updated_at: oldTimestamp }),
        buildChecklistItem({ updated_at: oldTimestamp }),
      ];
      const { service, repository } = createService();
      await service.reorderItems(items);
      const updatedItems = (repository.bulkUpsert as ReturnType<typeof vi.fn>)
        .mock.calls[0][0] as ChecklistItem[];
      expect(updatedItems[0].updated_at).not.toBe(oldTimestamp);
      expect(updatedItems[1].updated_at).not.toBe(oldTimestamp);
    });

    it("should call repository.bulkUpsert once with all updated items", async () => {
      const items = [
        buildChecklistItem(),
        buildChecklistItem(),
        buildChecklistItem(),
      ];
      const { service, repository } = createService();
      await service.reorderItems(items);
      expect(repository.bulkUpsert).toHaveBeenCalledTimes(1);
      expect(
        (repository.bulkUpsert as ReturnType<typeof vi.fn>).mock.calls[0][0],
      ).toHaveLength(3);
    });

    it("should not call bulkUpsert when items are already in correct order", async () => {
      const items = [
        buildChecklistItem({ sort_order: 0 }),
        buildChecklistItem({ sort_order: 1 }),
        buildChecklistItem({ sort_order: 2 }),
      ];
      const { service, repository } = createService();
      await service.reorderItems(items);
      expect(repository.bulkUpsert).not.toHaveBeenCalled();
    });

    it("should update updated_at only for items whose sort_order actually changed", async () => {
      const oldTimestamp = toISOTimestamp(
        Temporal.Instant.from("2025-01-01T00:00:00.000Z"),
      );
      const items = [
        buildChecklistItem({ sort_order: 0, updated_at: oldTimestamp }),
        buildChecklistItem({ sort_order: 2, updated_at: oldTimestamp }),
        buildChecklistItem({ sort_order: 1, updated_at: oldTimestamp }),
      ];
      const { service, repository } = createService();
      await service.reorderItems(items);
      const updatedItems = (repository.bulkUpsert as ReturnType<typeof vi.fn>)
        .mock.calls[0][0] as ChecklistItem[];
      expect(updatedItems[0].updated_at).toBe(oldTimestamp);
      expect(updatedItems[1].updated_at).not.toBe(oldTimestamp);
      expect(updatedItems[2].updated_at).not.toBe(oldTimestamp);
    });
  });
});

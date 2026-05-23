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
  describe("softDelete", () => {
    it("should set is_deleted to true", async () => {
      const item = buildChecklistItem({ is_deleted: false });
      const { service } = createService({
        getById: vi.fn().mockResolvedValue(item),
      });
      const deleted = await service.softDelete(item.id);
      expect(deleted.is_deleted).toBe(true);
    });

    it("should throw when item not found", async () => {
      const { service } = createService();
      await expect(service.softDelete("nonexistent-id")).rejects.toThrow(
        "ChecklistItem not found: nonexistent-id",
      );
    });
  });

  describe("restore", () => {
    it("should set is_deleted to false", async () => {
      const item = buildChecklistItem({ is_deleted: true });
      const { service } = createService({
        getById: vi.fn().mockResolvedValue(item),
      });
      const restored = await service.restore(item.id);
      expect(restored.is_deleted).toBe(false);
    });

    it("should throw when item not found", async () => {
      const { service } = createService();
      await expect(service.restore("nonexistent-id")).rejects.toThrow(
        "ChecklistItem not found: nonexistent-id",
      );
    });
  });
});

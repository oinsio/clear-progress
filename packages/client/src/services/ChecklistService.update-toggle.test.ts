import { describe, expect, it, vi } from "vitest";
import type { ChecklistRepository } from "@/db/repositories/ChecklistRepository";
import { Temporal } from "@/lib/temporal";
import { buildChecklistItem } from "@/test/factories/checklistItemFactory";
import { createMockChecklistRepository } from "@/test/factories/checklistRepositoryFactory";
import { toISOTimestamp } from "@/utils/dateHelpers";
import { ChecklistService } from "./ChecklistService";

function createService(
  overrides: Partial<Record<keyof ChecklistRepository, unknown>> = {},
): { service: ChecklistService; repository: ChecklistRepository } {
  const repository = createMockChecklistRepository(overrides);
  return { service: new ChecklistService(repository), repository };
}

describe("ChecklistService", () => {
  describe("update", () => {
    it("should update the name of the item", async () => {
      const item = buildChecklistItem({ name: "Old name" });
      const { service } = createService({
        getById: vi.fn().mockResolvedValue(item),
      });
      const updated = await service.update(item.id, { name: "New name" });
      expect(updated.name).toBe("New name");
    });

    it("should update updated_at timestamp on update", async () => {
      const item = buildChecklistItem({
        updated_at: toISOTimestamp(
          Temporal.Instant.from("2025-01-01T00:00:00.000Z"),
        ),
      });
      const { service } = createService({
        getById: vi.fn().mockResolvedValue(item),
      });
      const updated = await service.update(item.id, { name: "New name" });
      expect(updated.updated_at).not.toBe(
        toISOTimestamp(Temporal.Instant.from("2025-01-01T00:00:00.000Z")),
      );
    });

    it("should throw when item not found", async () => {
      const { service } = createService();
      await expect(
        service.update("nonexistent-id", { name: "X" }),
      ).rejects.toThrow("ChecklistItem not found: nonexistent-id");
    });
  });

  describe("toggle", () => {
    it("should set is_completed to true when item is not completed", async () => {
      const item = buildChecklistItem({ is_completed: false });
      const { service } = createService({
        getById: vi.fn().mockResolvedValue(item),
      });
      const toggled = await service.toggle(item.id);
      expect(toggled.is_completed).toBe(true);
    });

    it("should set is_completed to false when item is already completed", async () => {
      const item = buildChecklistItem({ is_completed: true });
      const { service } = createService({
        getById: vi.fn().mockResolvedValue(item),
      });
      const toggled = await service.toggle(item.id);
      expect(toggled.is_completed).toBe(false);
    });

    it("should throw when item not found", async () => {
      const { service } = createService();
      await expect(service.toggle("nonexistent-id")).rejects.toThrow(
        "ChecklistItem not found: nonexistent-id",
      );
    });
  });
});

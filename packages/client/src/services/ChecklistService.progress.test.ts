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
  describe("getProgress", () => {
    it("should return zero total when task has no items", async () => {
      const { service } = createService();
      const progress = await service.getProgress("task-1");
      expect(progress.total).toBe(0);
    });

    it("should return zero completed when no items are done", async () => {
      const taskId = "task-1";
      const items = [
        buildChecklistItem({ task_id: taskId, is_completed: false }),
        buildChecklistItem({ task_id: taskId, is_completed: false }),
      ];
      const { service } = createService({
        getActiveByTaskId: vi.fn().mockResolvedValue(items),
      });
      const progress = await service.getProgress(taskId);
      expect(progress.completed).toBe(0);
      expect(progress.total).toBe(2);
    });

    it("should count only completed items", async () => {
      const taskId = "task-1";
      const items = [
        buildChecklistItem({ task_id: taskId, is_completed: true }),
        buildChecklistItem({ task_id: taskId, is_completed: false }),
        buildChecklistItem({ task_id: taskId, is_completed: true }),
      ];
      const { service } = createService({
        getActiveByTaskId: vi.fn().mockResolvedValue(items),
      });
      const progress = await service.getProgress(taskId);
      expect(progress.completed).toBe(2);
      expect(progress.total).toBe(3);
    });
  });
});

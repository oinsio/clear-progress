import { describe, expect, it, vi } from "vitest";
import { SORT_ORDER_REBALANCE_THRESHOLD } from "@/constants";
import { buildIdea } from "@/test/factories/ideaFactory";
import { createMockIdeaRepository } from "@/test/mocks/ideaRepositoryMock";
import { IdeaService } from "./IdeaService";

describe("IdeaService", () => {
  describe("reorderIdeas", () => {
    it("should update idea with new sort_order", async () => {
      const idea = buildIdea({ sort_order: "a0" });
      const mockIdeaRepository = createMockIdeaRepository({
        getById: vi.fn().mockResolvedValue(idea),
      });
      const ideaService = new IdeaService(mockIdeaRepository);

      await ideaService.reorderIdeas(idea.id, "a1");

      expect(mockIdeaRepository.update).toHaveBeenCalledWith(
        expect.objectContaining({
          id: idea.id,
          sort_order: "a1",
          syncStatus: "pending" as const,
        }),
      );
    });

    it("should update updated_at when reordering", async () => {
      const idea = buildIdea({
        sort_order: "a0",
        updated_at: "2025-01-01T00:00:00.000Z",
      });
      const mockIdeaRepository = createMockIdeaRepository({
        getById: vi.fn().mockResolvedValue(idea),
      });
      const ideaService = new IdeaService(mockIdeaRepository);

      await ideaService.reorderIdeas(idea.id, "a1");

      const updatedIdea = (
        mockIdeaRepository.update as ReturnType<typeof vi.fn>
      ).mock.calls[0][0];
      expect(updatedIdea.updated_at).not.toBe("2025-01-01T00:00:00.000Z");
    });

    it("should throw when idea not found", async () => {
      const mockIdeaRepository = createMockIdeaRepository();
      const ideaService = new IdeaService(mockIdeaRepository);
      await expect(
        ideaService.reorderIdeas("nonexistent", "a1"),
      ).rejects.toThrow("Idea not found: nonexistent");
    });

    it("should not trigger rebalancing when key is short", async () => {
      const idea = buildIdea({ sort_order: "a0" });
      const mockIdeaRepository = createMockIdeaRepository({
        getById: vi.fn().mockResolvedValue(idea),
      });
      const ideaService = new IdeaService(mockIdeaRepository);

      await ideaService.reorderIdeas(idea.id, "a1");

      expect(mockIdeaRepository.bulkUpsert).not.toHaveBeenCalled();
    });

    it("should trigger rebalancing when key exceeds threshold", async () => {
      const longKey = "a".repeat(SORT_ORDER_REBALANCE_THRESHOLD + 1);
      const idea = buildIdea({ sort_order: "a0" });
      const allIdeas = [
        buildIdea({ sort_order: "a0" }),
        buildIdea({ sort_order: "a1" }),
      ];
      const mockIdeaRepository = createMockIdeaRepository({
        getById: vi.fn().mockResolvedValue(idea),
        getActive: vi.fn().mockResolvedValue(allIdeas),
      });
      const ideaService = new IdeaService(mockIdeaRepository);

      await ideaService.reorderIdeas(idea.id, longKey);

      expect(mockIdeaRepository.bulkUpsert).toHaveBeenCalled();
    });

    it("should rebalance all ideas with fresh keys", async () => {
      const longKey = "a".repeat(SORT_ORDER_REBALANCE_THRESHOLD + 1);
      const idea = buildIdea({ sort_order: "a0" });
      const allIdeas = [
        buildIdea({ sort_order: "b0" }),
        buildIdea({ sort_order: "a0" }),
      ];
      const mockIdeaRepository = createMockIdeaRepository({
        getById: vi.fn().mockResolvedValue(idea),
        getActive: vi.fn().mockResolvedValue(allIdeas),
      });
      const ideaService = new IdeaService(mockIdeaRepository);

      await ideaService.reorderIdeas(idea.id, longKey);

      const rebalancedIdeas = (
        mockIdeaRepository.bulkUpsert as ReturnType<typeof vi.fn>
      ).mock.calls[0][0];
      expect(rebalancedIdeas).toHaveLength(2);
      for (const rebalancedIdea of rebalancedIdeas) {
        expect(typeof rebalancedIdea.sort_order).toBe("string");
        expect(rebalancedIdea.syncStatus).toBe("pending");
      }
    });
  });
});

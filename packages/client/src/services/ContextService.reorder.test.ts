import { describe, expect, it, vi } from "vitest";
import { SORT_ORDER_REBALANCE_THRESHOLD } from "@/constants";
import { buildContext } from "@/test/factories/contextFactory";
import { createMockContextRepository } from "@/test/mocks/contextRepositoryMock";
import { ContextService } from "./ContextService";

describe("ContextService", () => {
  describe("reorderContexts", () => {
    it("should update context with new sort_order", async () => {
      const context = buildContext({ sort_order: "a0" });
      const mockContextRepository = createMockContextRepository({
        getById: vi.fn().mockResolvedValue(context),
      });
      const contextService = new ContextService(mockContextRepository);

      await contextService.reorderContexts(context.id, "a1");

      expect(mockContextRepository.update).toHaveBeenCalledWith(
        expect.objectContaining({
          id: context.id,
          sort_order: "a1",
          syncStatus: "pending" as const,
        }),
      );
    });

    it("should update updated_at when reordering", async () => {
      const context = buildContext({
        sort_order: "a0",
        updated_at: "2025-01-01T00:00:00.000Z",
      });
      const mockContextRepository = createMockContextRepository({
        getById: vi.fn().mockResolvedValue(context),
      });
      const contextService = new ContextService(mockContextRepository);

      await contextService.reorderContexts(context.id, "a1");

      const updatedContext = (
        mockContextRepository.update as ReturnType<typeof vi.fn>
      ).mock.calls[0][0];
      expect(updatedContext.updated_at).not.toBe("2025-01-01T00:00:00.000Z");
    });

    it("should throw when context not found", async () => {
      const mockContextRepository = createMockContextRepository();
      const contextService = new ContextService(mockContextRepository);
      await expect(
        contextService.reorderContexts("nonexistent", "a1"),
      ).rejects.toThrow("Context not found: nonexistent");
    });

    it("should not trigger rebalancing when key is short", async () => {
      const context = buildContext({ sort_order: "a0" });
      const mockContextRepository = createMockContextRepository({
        getById: vi.fn().mockResolvedValue(context),
      });
      const contextService = new ContextService(mockContextRepository);

      await contextService.reorderContexts(context.id, "a1");

      expect(mockContextRepository.bulkUpsert).not.toHaveBeenCalled();
    });

    it("should trigger rebalancing when key exceeds threshold", async () => {
      const longKey = "a".repeat(SORT_ORDER_REBALANCE_THRESHOLD + 1);
      const context = buildContext({ sort_order: "a0" });
      const allContexts = [
        buildContext({ sort_order: "a0" }),
        buildContext({ sort_order: "a1" }),
      ];
      const mockContextRepository = createMockContextRepository({
        getById: vi.fn().mockResolvedValue(context),
        getActive: vi.fn().mockResolvedValue(allContexts),
      });
      const contextService = new ContextService(mockContextRepository);

      await contextService.reorderContexts(context.id, longKey);

      expect(mockContextRepository.bulkUpsert).toHaveBeenCalled();
    });

    it("should rebalance all contexts with fresh keys", async () => {
      const longKey = "a".repeat(SORT_ORDER_REBALANCE_THRESHOLD + 1);
      const context = buildContext({ sort_order: "a0" });
      const allContexts = [
        buildContext({ sort_order: "b0" }),
        buildContext({ sort_order: "a0" }),
      ];
      const mockContextRepository = createMockContextRepository({
        getById: vi.fn().mockResolvedValue(context),
        getActive: vi.fn().mockResolvedValue(allContexts),
      });
      const contextService = new ContextService(mockContextRepository);

      await contextService.reorderContexts(context.id, longKey);

      const rebalancedContexts = (
        mockContextRepository.bulkUpsert as ReturnType<typeof vi.fn>
      ).mock.calls[0][0];
      expect(rebalancedContexts).toHaveLength(2);
      for (const rebalancedContext of rebalancedContexts) {
        expect(typeof rebalancedContext.sort_order).toBe("string");
        expect(rebalancedContext.syncStatus).toBe("pending");
      }
    });
  });
});

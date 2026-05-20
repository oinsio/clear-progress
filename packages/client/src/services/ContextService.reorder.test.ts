import { beforeEach, describe, expect, it, type vi } from "vitest";
import type { ContextRepository } from "@/db/repositories/ContextRepository";
import { Temporal } from "@/lib/temporal";
import { buildContext } from "@/test/factories/contextFactory";
import { createMockContextRepository } from "@/test/mocks/contextRepositoryMock";
import { toISOTimestamp } from "@/utils/dateHelpers";
import { ContextService } from "./ContextService";

describe("ContextService", () => {
  let mockContextRepository: ContextRepository;

  beforeEach(() => {
    mockContextRepository = createMockContextRepository();
  });

  describe("reorderContexts", () => {
    const getUpsertedContexts = () =>
      (mockContextRepository.bulkUpsert as ReturnType<typeof vi.fn>).mock
        .calls[0][0];

    it("should call bulkUpsert with contexts assigned sort_order by position", async () => {
      const contextA = buildContext({ sort_order: 2 });
      const contextB = buildContext({ sort_order: 0 });
      const contextC = buildContext({ sort_order: 1 });
      const contextService = new ContextService(mockContextRepository);
      await contextService.reorderContexts([contextA, contextB, contextC]);
      const upserted = getUpsertedContexts();
      expect(upserted[0].sort_order).toBe(0);
      expect(upserted[1].sort_order).toBe(1);
      expect(upserted[2].sort_order).toBe(2);
    });

    it("should update updated_at for each reordered context", async () => {
      const contextA = buildContext({
        updated_at: toISOTimestamp(
          Temporal.Instant.from("2025-01-01T00:00:00.000Z"),
        ),
      });
      const contextService = new ContextService(mockContextRepository);
      await contextService.reorderContexts([contextA]);
      const upserted = getUpsertedContexts();
      expect(upserted[0].updated_at).not.toBe(
        toISOTimestamp(Temporal.Instant.from("2025-01-01T00:00:00.000Z")),
      );
    });

    it("should set needsSync to true for each reordered context", async () => {
      const contextA = buildContext({ needsSync: false });
      const contextService = new ContextService(mockContextRepository);
      await contextService.reorderContexts([contextA]);
      const upserted = getUpsertedContexts();
      expect(upserted[0].needsSync).toBe(true);
    });

    it("should preserve context ids after reorder", async () => {
      const contextA = buildContext();
      const contextB = buildContext();
      const contextService = new ContextService(mockContextRepository);
      await contextService.reorderContexts([contextA, contextB]);
      const upserted = getUpsertedContexts();
      expect(upserted[0].id).toBe(contextA.id);
      expect(upserted[1].id).toBe(contextB.id);
    });

    it("should not call bulkUpsert when given empty array", async () => {
      const contextService = new ContextService(mockContextRepository);
      await contextService.reorderContexts([]);
      expect(mockContextRepository.bulkUpsert).not.toHaveBeenCalled();
    });

    it("should use same timestamp for all contexts in batch", async () => {
      const contextA = buildContext();
      const contextB = buildContext();
      const contextService = new ContextService(mockContextRepository);
      await contextService.reorderContexts([contextA, contextB]);
      const upserted = getUpsertedContexts();
      expect(upserted[0].updated_at).toBe(upserted[1].updated_at);
    });
  });
});

import { beforeEach, describe, expect, it, type vi } from "vitest";
import type { IdeaRepository } from "@/db/repositories/IdeaRepository";
import { Temporal } from "@/lib/temporal";
import { buildIdea } from "@/test/factories/ideaFactory";
import { createMockIdeaRepository } from "@/test/mocks/ideaRepositoryMock";
import { toISOTimestamp } from "@/utils/dateHelpers";
import { IdeaService } from "./IdeaService";

describe("IdeaService", () => {
  let mockIdeaRepository: IdeaRepository;

  beforeEach(() => {
    mockIdeaRepository = createMockIdeaRepository();
  });

  describe("reorderIdeas", () => {
    const getUpsertedIdeas = () =>
      (mockIdeaRepository.bulkUpsert as ReturnType<typeof vi.fn>).mock
        .calls[0][0];

    it("should call bulkUpsert with ideas assigned sort_order by position", async () => {
      const ideaA = buildIdea({ sort_order: 2 });
      const ideaB = buildIdea({ sort_order: 0 });
      const ideaC = buildIdea({ sort_order: 1 });
      const ideaService = new IdeaService(mockIdeaRepository);
      await ideaService.reorderIdeas([ideaA, ideaB, ideaC]);
      const upserted = getUpsertedIdeas();
      expect(upserted[0].sort_order).toBe(0);
      expect(upserted[1].sort_order).toBe(1);
      expect(upserted[2].sort_order).toBe(2);
    });

    it("should update updated_at for each reordered idea", async () => {
      const ideaA = buildIdea({
        updated_at: toISOTimestamp(
          Temporal.Instant.from("2025-01-01T00:00:00.000Z"),
        ),
      });
      const ideaService = new IdeaService(mockIdeaRepository);
      await ideaService.reorderIdeas([ideaA]);
      const upserted = getUpsertedIdeas();
      expect(upserted[0].updated_at).not.toBe(
        toISOTimestamp(Temporal.Instant.from("2025-01-01T00:00:00.000Z")),
      );
    });

    it("should set needsSync to true for each reordered idea", async () => {
      const ideaA = buildIdea({ needsSync: false });
      const ideaService = new IdeaService(mockIdeaRepository);
      await ideaService.reorderIdeas([ideaA]);
      const upserted = getUpsertedIdeas();
      expect(upserted[0].needsSync).toBe(true);
    });

    it("should preserve idea ids after reorder", async () => {
      const ideaA = buildIdea();
      const ideaB = buildIdea();
      const ideaService = new IdeaService(mockIdeaRepository);
      await ideaService.reorderIdeas([ideaA, ideaB]);
      const upserted = getUpsertedIdeas();
      expect(upserted[0].id).toBe(ideaA.id);
      expect(upserted[1].id).toBe(ideaB.id);
    });

    it("should not call bulkUpsert when given empty array", async () => {
      const ideaService = new IdeaService(mockIdeaRepository);
      await ideaService.reorderIdeas([]);
      expect(mockIdeaRepository.bulkUpsert).not.toHaveBeenCalled();
    });

    it("should use same timestamp for all ideas in batch", async () => {
      const ideaA = buildIdea();
      const ideaB = buildIdea();
      const ideaService = new IdeaService(mockIdeaRepository);
      await ideaService.reorderIdeas([ideaA, ideaB]);
      const upserted = getUpsertedIdeas();
      expect(upserted[0].updated_at).toBe(upserted[1].updated_at);
    });
  });
});

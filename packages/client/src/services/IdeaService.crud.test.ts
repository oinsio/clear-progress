import { beforeEach, describe, expect, it, vi } from "vitest";
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

  describe("getAll", () => {
    it("should return empty array when no ideas exist", async () => {
      const ideaService = new IdeaService(mockIdeaRepository);
      const ideas = await ideaService.getAll();
      expect(ideas).toEqual([]);
    });

    it("should return ideas sorted by sort_order descending", async () => {
      const unsortedIdeas = [
        buildIdea({ sort_order: "a2" }),
        buildIdea({ sort_order: "a0" }),
        buildIdea({ sort_order: "a1" }),
      ];
      mockIdeaRepository = createMockIdeaRepository({
        getActive: vi.fn().mockResolvedValue(unsortedIdeas),
      });
      const ideaService = new IdeaService(mockIdeaRepository);
      const ideas = await ideaService.getAll();
      expect(String(ideas[0].sort_order) > String(ideas[1].sort_order)).toBe(
        true,
      );
      expect(String(ideas[1].sort_order) > String(ideas[2].sort_order)).toBe(
        true,
      );
    });

    it("should call repository.getActive", async () => {
      const ideaService = new IdeaService(mockIdeaRepository);
      await ideaService.getAll();
      expect(mockIdeaRepository.getActive).toHaveBeenCalled();
    });
  });

  describe("getById", () => {
    it("should return idea when found", async () => {
      const idea = buildIdea();
      mockIdeaRepository = createMockIdeaRepository({
        getById: vi.fn().mockResolvedValue(idea),
      });
      const ideaService = new IdeaService(mockIdeaRepository);
      const result = await ideaService.getById(idea.id);
      expect(result).toEqual(idea);
    });

    it("should return undefined when idea not found", async () => {
      const ideaService = new IdeaService(mockIdeaRepository);
      const result = await ideaService.getById("nonexistent");
      expect(result).toBeUndefined();
    });

    it("should call repository.getById with the id", async () => {
      const ideaService = new IdeaService(mockIdeaRepository);
      await ideaService.getById("test-id");
      expect(mockIdeaRepository.getById).toHaveBeenCalledWith("test-id");
    });
  });

  describe("update", () => {
    it("should update idea fields", async () => {
      const idea = buildIdea({ name: "Old name" });
      mockIdeaRepository = createMockIdeaRepository({
        getById: vi.fn().mockResolvedValue(idea),
      });
      const ideaService = new IdeaService(mockIdeaRepository);
      const updated = await ideaService.update(idea.id, { name: "New name" });
      expect(updated.name).toBe("New name");
    });

    it("should update updated_at timestamp", async () => {
      const idea = buildIdea({
        updated_at: toISOTimestamp(
          Temporal.Instant.from("2025-01-01T00:00:00.000Z"),
        ),
      });
      mockIdeaRepository = createMockIdeaRepository({
        getById: vi.fn().mockResolvedValue(idea),
      });
      const ideaService = new IdeaService(mockIdeaRepository);
      const updated = await ideaService.update(idea.id, { name: "X" });
      expect(updated.updated_at).not.toBe(
        toISOTimestamp(Temporal.Instant.from("2025-01-01T00:00:00.000Z")),
      );
    });

    it("should set syncStatus to true", async () => {
      const idea = buildIdea({ syncStatus: "synced" as const });
      mockIdeaRepository = createMockIdeaRepository({
        getById: vi.fn().mockResolvedValue(idea),
      });
      const ideaService = new IdeaService(mockIdeaRepository);
      const updated = await ideaService.update(idea.id, { name: "X" });
      expect(updated.syncStatus).toBe("pending");
    });

    it("should throw when idea not found", async () => {
      const ideaService = new IdeaService(mockIdeaRepository);
      await expect(ideaService.update("nonexistent", {})).rejects.toThrow(
        "Idea not found: nonexistent",
      );
    });

    it("should call repository.update with the updated idea", async () => {
      const idea = buildIdea();
      mockIdeaRepository = createMockIdeaRepository({
        getById: vi.fn().mockResolvedValue(idea),
      });
      const ideaService = new IdeaService(mockIdeaRepository);
      await ideaService.update(idea.id, { name: "Updated" });
      expect(mockIdeaRepository.update).toHaveBeenCalled();
    });

    it("should preserve id when updating", async () => {
      const idea = buildIdea();
      mockIdeaRepository = createMockIdeaRepository({
        getById: vi.fn().mockResolvedValue(idea),
      });
      const ideaService = new IdeaService(mockIdeaRepository);
      const updated = await ideaService.update(idea.id, { name: "X" });
      expect(updated.id).toBe(idea.id);
    });
  });

  describe("softDelete", () => {
    it("should set is_deleted to true", async () => {
      const idea = buildIdea({ is_deleted: false });
      mockIdeaRepository = createMockIdeaRepository({
        getById: vi.fn().mockResolvedValue(idea),
      });
      const ideaService = new IdeaService(mockIdeaRepository);
      const deleted = await ideaService.softDelete(idea.id);
      expect(deleted.is_deleted).toBe(true);
    });

    it("should throw when idea not found", async () => {
      const ideaService = new IdeaService(mockIdeaRepository);
      await expect(ideaService.softDelete("nonexistent-id")).rejects.toThrow(
        "Idea not found: nonexistent-id",
      );
    });
  });

  describe("restore", () => {
    it("should set is_deleted to false", async () => {
      const idea = buildIdea({ is_deleted: true });
      mockIdeaRepository = createMockIdeaRepository({
        getById: vi.fn().mockResolvedValue(idea),
      });
      const ideaService = new IdeaService(mockIdeaRepository);
      const restored = await ideaService.restore(idea.id);
      expect(restored.is_deleted).toBe(false);
    });

    it("should throw when idea not found", async () => {
      const ideaService = new IdeaService(mockIdeaRepository);
      await expect(ideaService.restore("nonexistent-id")).rejects.toThrow(
        "Idea not found: nonexistent-id",
      );
    });
  });
});

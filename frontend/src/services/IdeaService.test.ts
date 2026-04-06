import { describe, it, expect, vi, beforeEach } from "vitest";
import { IdeaService } from "./IdeaService";
import type { IdeaRepository } from "@/db/repositories/IdeaRepository";
import { buildIdea } from "@/test/factories/ideaFactory";
import { createMockIdeaRepository } from "@/test/mocks/ideaRepositoryMock";

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

    it("should return ideas sorted by sort_order ascending", async () => {
      const unsortedIdeas = [
        buildIdea({ sort_order: 3 }),
        buildIdea({ sort_order: 1 }),
        buildIdea({ sort_order: 2 }),
      ];
      mockIdeaRepository = createMockIdeaRepository({
        getActive: vi.fn().mockResolvedValue(unsortedIdeas),
      });
      const ideaService = new IdeaService(mockIdeaRepository);
      const ideas = await ideaService.getAll();
      expect(ideas[0].sort_order).toBe(1);
      expect(ideas[1].sort_order).toBe(2);
      expect(ideas[2].sort_order).toBe(3);
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

  describe("create", () => {
    let createdIdea: Awaited<ReturnType<IdeaService["create"]>>;

    beforeEach(async () => {
      const ideaService = new IdeaService(mockIdeaRepository);
      createdIdea = await ideaService.create({ name: "My idea" });
    });

    it("should create idea with given name", () => {
      expect(createdIdea.name).toBe("My idea");
    });

    it("should create idea with is_deleted false", () => {
      expect(createdIdea.is_deleted).toBe(false);
    });

    it("should create idea with version 1", () => {
      expect(createdIdea.version).toBe(1);
    });

    it("should create idea with a UUID id", () => {
      expect(createdIdea.id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
      );
    });

    it("should create idea with empty string description by default", () => {
      expect(createdIdea.description).toBe("");
    });

    it("should create idea with sort_order 0 by default", () => {
      expect(createdIdea.sort_order).toBe(0);
    });

    it("should create idea with _dirty true", () => {
      expect(createdIdea._dirty).toBe(true);
    });

    it("should create idea with revision 0", () => {
      expect(createdIdea.revision).toBe(0);
    });

    it("should call repository.create with the constructed idea", () => {
      expect(mockIdeaRepository.create).toHaveBeenCalledWith(createdIdea);
    });

    it("should preserve provided description", async () => {
      const ideaService = new IdeaService(mockIdeaRepository);
      const idea = await ideaService.create({
        name: "Test",
        description: "Custom description",
      });
      expect(idea.description).toBe("Custom description");
    });

    it("should preserve provided sort_order", async () => {
      const ideaService = new IdeaService(mockIdeaRepository);
      const idea = await ideaService.create({ name: "Test", sort_order: 5 });
      expect(idea.sort_order).toBe(5);
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

    it("should increment version on update", async () => {
      const idea = buildIdea({ version: 2 });
      mockIdeaRepository = createMockIdeaRepository({
        getById: vi.fn().mockResolvedValue(idea),
      });
      const ideaService = new IdeaService(mockIdeaRepository);
      const updated = await ideaService.update(idea.id, { name: "X" });
      expect(updated.version).toBe(3);
    });

    it("should update updated_at timestamp", async () => {
      const idea = buildIdea({ updated_at: "2025-01-01T00:00:00.000Z" });
      mockIdeaRepository = createMockIdeaRepository({
        getById: vi.fn().mockResolvedValue(idea),
      });
      const ideaService = new IdeaService(mockIdeaRepository);
      const updated = await ideaService.update(idea.id, { name: "X" });
      expect(updated.updated_at).not.toBe("2025-01-01T00:00:00.000Z");
    });

    it("should set _dirty to true", async () => {
      const idea = buildIdea({ _dirty: false });
      mockIdeaRepository = createMockIdeaRepository({
        getById: vi.fn().mockResolvedValue(idea),
      });
      const ideaService = new IdeaService(mockIdeaRepository);
      const updated = await ideaService.update(idea.id, { name: "X" });
      expect(updated._dirty).toBe(true);
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

    it("should increment version on soft delete", async () => {
      const idea = buildIdea({ version: 3 });
      mockIdeaRepository = createMockIdeaRepository({
        getById: vi.fn().mockResolvedValue(idea),
      });
      const ideaService = new IdeaService(mockIdeaRepository);
      const deleted = await ideaService.softDelete(idea.id);
      expect(deleted.version).toBe(4);
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

    it("should increment version on restore", async () => {
      const idea = buildIdea({ is_deleted: true, version: 5 });
      mockIdeaRepository = createMockIdeaRepository({
        getById: vi.fn().mockResolvedValue(idea),
      });
      const ideaService = new IdeaService(mockIdeaRepository);
      const restored = await ideaService.restore(idea.id);
      expect(restored.version).toBe(6);
    });

    it("should throw when idea not found", async () => {
      const ideaService = new IdeaService(mockIdeaRepository);
      await expect(ideaService.restore("nonexistent-id")).rejects.toThrow(
        "Idea not found: nonexistent-id",
      );
    });
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

    it("should increment version for each reordered idea", async () => {
      const ideaA = buildIdea({ version: 3 });
      const ideaB = buildIdea({ version: 5 });
      const ideaService = new IdeaService(mockIdeaRepository);
      await ideaService.reorderIdeas([ideaA, ideaB]);
      const upserted = getUpsertedIdeas();
      expect(upserted[0].version).toBe(4);
      expect(upserted[1].version).toBe(6);
    });

    it("should update updated_at for each reordered idea", async () => {
      const ideaA = buildIdea({ updated_at: "2025-01-01T00:00:00.000Z" });
      const ideaService = new IdeaService(mockIdeaRepository);
      await ideaService.reorderIdeas([ideaA]);
      const upserted = getUpsertedIdeas();
      expect(upserted[0].updated_at).not.toBe("2025-01-01T00:00:00.000Z");
    });

    it("should set _dirty to true for each reordered idea", async () => {
      const ideaA = buildIdea({ _dirty: false });
      const ideaService = new IdeaService(mockIdeaRepository);
      await ideaService.reorderIdeas([ideaA]);
      const upserted = getUpsertedIdeas();
      expect(upserted[0]._dirty).toBe(true);
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

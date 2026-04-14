import { describe, it, expect, vi, beforeEach } from "vitest";
import { ContextService } from "./ContextService";
import type { ContextRepository } from "@/db/repositories/ContextRepository";
import { buildContext } from "@/test/factories/contextFactory";
import { createMockContextRepository } from "@/test/mocks/contextRepositoryMock";

describe("ContextService", () => {
  let mockContextRepository: ContextRepository;

  beforeEach(() => {
    mockContextRepository = createMockContextRepository();
  });

  describe("getAll", () => {
    it("should return empty array when no contexts exist", async () => {
      const contextService = new ContextService(mockContextRepository);
      const contexts = await contextService.getAll();
      expect(contexts).toEqual([]);
    });

    it("should return contexts sorted by sort_order ascending", async () => {
      const unsortedContexts = [
        buildContext({ sort_order: 3 }),
        buildContext({ sort_order: 1 }),
        buildContext({ sort_order: 2 }),
      ];
      mockContextRepository = createMockContextRepository({
        getActive: vi.fn().mockResolvedValue(unsortedContexts),
      });
      const contextService = new ContextService(mockContextRepository);
      const contexts = await contextService.getAll();
      expect(contexts[0].sort_order).toBe(1);
      expect(contexts[1].sort_order).toBe(2);
      expect(contexts[2].sort_order).toBe(3);
    });

    it("should call repository.getActive", async () => {
      const contextService = new ContextService(mockContextRepository);
      await contextService.getAll();
      expect(mockContextRepository.getActive).toHaveBeenCalled();
    });
  });

  describe("getById", () => {
    it("should return context when found", async () => {
      const context = buildContext();
      mockContextRepository = createMockContextRepository({
        getById: vi.fn().mockResolvedValue(context),
      });
      const contextService = new ContextService(mockContextRepository);
      const result = await contextService.getById(context.id);
      expect(result).toEqual(context);
    });

    it("should return undefined when context not found", async () => {
      const contextService = new ContextService(mockContextRepository);
      const result = await contextService.getById("nonexistent");
      expect(result).toBeUndefined();
    });

    it("should call repository.getById with the id", async () => {
      const contextService = new ContextService(mockContextRepository);
      await contextService.getById("test-id");
      expect(mockContextRepository.getById).toHaveBeenCalledWith("test-id");
    });
  });

  describe("create", () => {
    let createdContext: Awaited<ReturnType<ContextService["create"]>>;

    beforeEach(async () => {
      const contextService = new ContextService(mockContextRepository);
      createdContext = await contextService.create("@Home");
    });

    it("should create context with given name", () => {
      expect(createdContext.name).toBe("@Home");
    });

    it("should create context with is_deleted false", () => {
      expect(createdContext.is_deleted).toBe(false);
    });

    it("should create context with version 1", () => {
      expect(createdContext.version).toBe(1);
    });

    it("should create context with a UUID id", () => {
      expect(createdContext.id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
      );
    });

    it("should create context with sort_order 0", () => {
      expect(createdContext.sort_order).toBe(0);
    });

    it("should create context with needsSync true", () => {
      expect(createdContext.needsSync).toBe(true);
    });

    it("should create context with revision 0", () => {
      expect(createdContext.revision).toBe(0);
    });

    it("should call repository.create with the constructed context", () => {
      expect(mockContextRepository.create).toHaveBeenCalledWith(createdContext);
    });
  });

  describe("update", () => {
    it("should update context name", async () => {
      const context = buildContext({ name: "Old name" });
      mockContextRepository = createMockContextRepository({
        getById: vi.fn().mockResolvedValue(context),
      });
      const contextService = new ContextService(mockContextRepository);
      const updated = await contextService.update(context.id, "New name");
      expect(updated.name).toBe("New name");
    });

    it("should increment version on update", async () => {
      const context = buildContext({ version: 2 });
      mockContextRepository = createMockContextRepository({
        getById: vi.fn().mockResolvedValue(context),
      });
      const contextService = new ContextService(mockContextRepository);
      const updated = await contextService.update(context.id, "X");
      expect(updated.version).toBe(3);
    });

    it("should update updated_at timestamp", async () => {
      const context = buildContext({ updated_at: "2025-01-01T00:00:00.000Z" });
      mockContextRepository = createMockContextRepository({
        getById: vi.fn().mockResolvedValue(context),
      });
      const contextService = new ContextService(mockContextRepository);
      const updated = await contextService.update(context.id, "X");
      expect(updated.updated_at).not.toBe("2025-01-01T00:00:00.000Z");
    });

    it("should set needsSync to true", async () => {
      const context = buildContext({ needsSync: false });
      mockContextRepository = createMockContextRepository({
        getById: vi.fn().mockResolvedValue(context),
      });
      const contextService = new ContextService(mockContextRepository);
      const updated = await contextService.update(context.id, "X");
      expect(updated.needsSync).toBe(true);
    });

    it("should throw when context not found", async () => {
      const contextService = new ContextService(mockContextRepository);
      await expect(contextService.update("nonexistent", "X")).rejects.toThrow(
        "Context not found: nonexistent",
      );
    });

    it("should call repository.update with the updated context", async () => {
      const context = buildContext();
      mockContextRepository = createMockContextRepository({
        getById: vi.fn().mockResolvedValue(context),
      });
      const contextService = new ContextService(mockContextRepository);
      await contextService.update(context.id, "Updated");
      expect(mockContextRepository.update).toHaveBeenCalled();
    });

    it("should preserve id when updating", async () => {
      const context = buildContext();
      mockContextRepository = createMockContextRepository({
        getById: vi.fn().mockResolvedValue(context),
      });
      const contextService = new ContextService(mockContextRepository);
      const updated = await contextService.update(context.id, "X");
      expect(updated.id).toBe(context.id);
    });
  });

  describe("softDelete", () => {
    it("should set is_deleted to true", async () => {
      const context = buildContext({ is_deleted: false });
      mockContextRepository = createMockContextRepository({
        getById: vi.fn().mockResolvedValue(context),
      });
      const contextService = new ContextService(mockContextRepository);
      const deleted = await contextService.softDelete(context.id);
      expect(deleted.is_deleted).toBe(true);
    });

    it("should increment version on soft delete", async () => {
      const context = buildContext({ version: 3 });
      mockContextRepository = createMockContextRepository({
        getById: vi.fn().mockResolvedValue(context),
      });
      const contextService = new ContextService(mockContextRepository);
      const deleted = await contextService.softDelete(context.id);
      expect(deleted.version).toBe(4);
    });

    it("should throw when context not found", async () => {
      const contextService = new ContextService(mockContextRepository);
      await expect(contextService.softDelete("nonexistent-id")).rejects.toThrow(
        "Context not found: nonexistent-id",
      );
    });
  });

  describe("restore", () => {
    it("should set is_deleted to false", async () => {
      const context = buildContext({ is_deleted: true });
      mockContextRepository = createMockContextRepository({
        getById: vi.fn().mockResolvedValue(context),
      });
      const contextService = new ContextService(mockContextRepository);
      const restored = await contextService.restore(context.id);
      expect(restored.is_deleted).toBe(false);
    });

    it("should increment version on restore", async () => {
      const context = buildContext({ is_deleted: true, version: 5 });
      mockContextRepository = createMockContextRepository({
        getById: vi.fn().mockResolvedValue(context),
      });
      const contextService = new ContextService(mockContextRepository);
      const restored = await contextService.restore(context.id);
      expect(restored.version).toBe(6);
    });

    it("should throw when context not found", async () => {
      const contextService = new ContextService(mockContextRepository);
      await expect(contextService.restore("nonexistent-id")).rejects.toThrow(
        "Context not found: nonexistent-id",
      );
    });
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

    it("should increment version for each reordered context", async () => {
      const contextA = buildContext({ version: 3 });
      const contextB = buildContext({ version: 5 });
      const contextService = new ContextService(mockContextRepository);
      await contextService.reorderContexts([contextA, contextB]);
      const upserted = getUpsertedContexts();
      expect(upserted[0].version).toBe(4);
      expect(upserted[1].version).toBe(6);
    });

    it("should update updated_at for each reordered context", async () => {
      const contextA = buildContext({ updated_at: "2025-01-01T00:00:00.000Z" });
      const contextService = new ContextService(mockContextRepository);
      await contextService.reorderContexts([contextA]);
      const upserted = getUpsertedContexts();
      expect(upserted[0].updated_at).not.toBe("2025-01-01T00:00:00.000Z");
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

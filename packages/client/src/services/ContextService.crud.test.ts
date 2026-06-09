import { beforeEach, describe, expect, it, vi } from "vitest";
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

  describe("getAll", () => {
    it("should return empty array when no contexts exist", async () => {
      const contextService = new ContextService(mockContextRepository);
      const contexts = await contextService.getAll();
      expect(contexts).toEqual([]);
    });

    it("should return contexts sorted by sort_order ascending", async () => {
      const unsortedContexts = [
        buildContext({ sort_order: "a2" }),
        buildContext({ sort_order: "a0" }),
        buildContext({ sort_order: "a1" }),
      ];
      mockContextRepository = createMockContextRepository({
        getActive: vi.fn().mockResolvedValue(unsortedContexts),
      });
      const contextService = new ContextService(mockContextRepository);
      const contexts = await contextService.getAll();
      expect(
        String(contexts[0].sort_order) < String(contexts[1].sort_order),
      ).toBe(true);
      expect(
        String(contexts[1].sort_order) < String(contexts[2].sort_order),
      ).toBe(true);
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

    it("should update updated_at timestamp", async () => {
      const context = buildContext({
        updated_at: toISOTimestamp(
          Temporal.Instant.from("2025-01-01T00:00:00.000Z"),
        ),
      });
      mockContextRepository = createMockContextRepository({
        getById: vi.fn().mockResolvedValue(context),
      });
      const contextService = new ContextService(mockContextRepository);
      const updated = await contextService.update(context.id, "X");
      expect(updated.updated_at).not.toBe(
        toISOTimestamp(Temporal.Instant.from("2025-01-01T00:00:00.000Z")),
      );
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

    it("should throw when context not found", async () => {
      const contextService = new ContextService(mockContextRepository);
      await expect(contextService.restore("nonexistent-id")).rejects.toThrow(
        "Context not found: nonexistent-id",
      );
    });
  });
});

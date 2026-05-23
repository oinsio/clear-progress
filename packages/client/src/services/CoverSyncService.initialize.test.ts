import { describe, expect, it, vi } from "vitest";
import {
  createMockCoverRepository,
  createMockPendingCoverRepository,
  createPendingCover,
  localCoverCache,
  setupCoverSyncTests,
} from "./CoverSyncService-test-utils";

describe("CoverSyncService", () => {
  const ctx = setupCoverSyncTests();

  describe("initializeLocalCovers", () => {
    it("should create object URLs for covers with blob data in CoverRepository", async () => {
      const coverWithBlob = {
        data_hash: "hash-abc",
        data: new Blob(["img"], { type: "image/jpeg" }),
      };
      ctx.mockCoverRepository = createMockCoverRepository({
        getAll: vi.fn().mockResolvedValue([coverWithBlob]),
      });
      const service = ctx.createService();

      await service.initializeLocalCovers();

      expect(localCoverCache.get("hash-abc")).toBeDefined();
    });

    it("should create object URLs for all pending covers", async () => {
      const pendingCover = createPendingCover({ data_hash: "init-hash-id" });
      ctx.mockPendingCoverRepository = createMockPendingCoverRepository({
        getAll: vi.fn().mockResolvedValue([pendingCover]),
      });
      const service = ctx.createService();

      await service.initializeLocalCovers();

      expect(localCoverCache.get("init-hash-id")).toBeDefined();
    });

    it("should not overwrite existing object URLs in cache", async () => {
      const existingUrl = "blob:http://localhost/existing";
      localCoverCache.set("cached-hash-id", existingUrl);
      const pendingCover = createPendingCover({ data_hash: "cached-hash-id" });
      ctx.mockPendingCoverRepository = createMockPendingCoverRepository({
        getAll: vi.fn().mockResolvedValue([pendingCover]),
      });
      const service = ctx.createService();

      await service.initializeLocalCovers();

      expect(localCoverCache.get("cached-hash-id")).toBe(existingUrl);
    });
  });
});

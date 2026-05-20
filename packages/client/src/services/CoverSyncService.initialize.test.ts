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
        file_id: "remote-file-id",
        data_hash: "hash-abc",
        data: new Blob(["img"], { type: "image/jpeg" }),
      };
      ctx.mockCoverRepository = createMockCoverRepository({
        getAll: vi.fn().mockResolvedValue([coverWithBlob]),
      });
      const service = ctx.createService();

      await service.initializeLocalCovers();

      expect(localCoverCache.get("remote-file-id")).toBeDefined();
    });

    it("should create object URLs for all pending covers", async () => {
      const pendingCover = createPendingCover({ local_id: "init-local-id" });
      ctx.mockPendingCoverRepository = createMockPendingCoverRepository({
        getAll: vi.fn().mockResolvedValue([pendingCover]),
      });
      const service = ctx.createService();

      await service.initializeLocalCovers();

      expect(localCoverCache.get("init-local-id")).toBeDefined();
    });

    it("should not overwrite existing object URLs in cache", async () => {
      const existingUrl = "blob:http://localhost/existing";
      localCoverCache.set("cached-local-id", existingUrl);
      const pendingCover = createPendingCover({ local_id: "cached-local-id" });
      ctx.mockPendingCoverRepository = createMockPendingCoverRepository({
        getAll: vi.fn().mockResolvedValue([pendingCover]),
      });
      const service = ctx.createService();

      await service.initializeLocalCovers();

      expect(localCoverCache.get("cached-local-id")).toBe(existingUrl);
    });
  });
});

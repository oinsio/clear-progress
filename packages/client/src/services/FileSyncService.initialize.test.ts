import { describe, expect, it, vi } from "vitest";
import {
  createMockFileRepository,
  createMockPendingFileRepository,
  createPendingFile,
  localFileCache,
  setupFileSyncTests,
} from "./FileSyncService-test-utils";

describe("FileSyncService", () => {
  const ctx = setupFileSyncTests();

  describe("initializeLocalFiles", () => {
    it("should create object URLs for files with blob data in FileRepository", async () => {
      const fileWithBlob = {
        data_hash: "hash-abc",
        data: new Blob(["img"], { type: "image/jpeg" }),
      };
      ctx.mockFileRepository = createMockFileRepository({
        getAll: vi.fn().mockResolvedValue([fileWithBlob]),
      });
      const service = ctx.createService();

      await service.initializeLocalFiles();

      expect(localFileCache.get("hash-abc")).toBeDefined();
    });

    it("should create object URLs for all pending files", async () => {
      const pendingFile = createPendingFile({ data_hash: "init-hash-id" });
      ctx.mockPendingFileRepository = createMockPendingFileRepository({
        getAll: vi.fn().mockResolvedValue([pendingFile]),
      });
      const service = ctx.createService();

      await service.initializeLocalFiles();

      expect(localFileCache.get("init-hash-id")).toBeDefined();
    });

    it("should not overwrite existing object URLs in cache", async () => {
      const existingUrl = "blob:http://localhost/existing";
      localFileCache.set("cached-hash-id", existingUrl);
      const pendingFile = createPendingFile({ data_hash: "cached-hash-id" });
      ctx.mockPendingFileRepository = createMockPendingFileRepository({
        getAll: vi.fn().mockResolvedValue([pendingFile]),
      });
      const service = ctx.createService();

      await service.initializeLocalFiles();

      expect(localFileCache.get("cached-hash-id")).toBe(existingUrl);
    });
  });
});

import { describe, expect, it, vi } from "vitest";
import {
  createMockFileRepository,
  createMockGetFilesSuccess,
  createMockSyncAdapter,
  localFileCache,
  setupFileSyncTests,
} from "./FileSyncService-test-utils";

const FILE_ID = "cover-file-id-xyz";

describe("FileSyncService", () => {
  const ctx = setupFileSyncTests();

  describe("ensureFileCached", () => {
    it("should skip if file is already in localFileCache", async () => {
      localFileCache.set(FILE_ID, "blob:http://localhost/cached");
      const service = ctx.createService();

      await service.ensureFileCached(FILE_ID);

      expect(ctx.mockFileRepository.getByHash).not.toHaveBeenCalled();
    });

    it("should create object URL from existing IndexedDB blob without calling getFile", async () => {
      const existingBlob = new Blob(["img"], { type: "image/jpeg" });
      ctx.mockFileRepository = createMockFileRepository({
        getByHash: vi.fn().mockResolvedValue({
          data_hash: FILE_ID,
          data: existingBlob,
        }),
      });
      const service = ctx.createService();

      await service.ensureFileCached(FILE_ID);

      expect(ctx.mockSyncAdapter.getFile).not.toHaveBeenCalled();
      expect(localFileCache.get(FILE_ID)).toBeDefined();
    });

    it("should call getFile API and store in IndexedDB when blob is absent", async () => {
      ctx.mockSyncAdapter = createMockSyncAdapter({
        getFile: createMockGetFilesSuccess(FILE_ID),
      });
      ctx.mockFileRepository = createMockFileRepository({
        getByHash: vi.fn().mockResolvedValue(undefined),
      });
      const service = ctx.createService();

      await service.ensureFileCached(FILE_ID);

      expect(ctx.mockFileRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ data_hash: FILE_ID, data: expect.any(Blob) }),
      );
    });

    it("should add file to localFileCache after successful fetch from server", async () => {
      ctx.mockSyncAdapter = createMockSyncAdapter({
        getFile: createMockGetFilesSuccess(FILE_ID),
      });
      ctx.mockFileRepository = createMockFileRepository({
        getByHash: vi.fn().mockResolvedValue(undefined),
      });
      const service = ctx.createService();

      await service.ensureFileCached(FILE_ID);

      expect(localFileCache.get(FILE_ID)).toBeDefined();
    });

    it("should not add to localFileCache when getFile fails", async () => {
      ctx.mockSyncAdapter = createMockSyncAdapter({
        getFile: vi.fn().mockRejectedValue(new Error("Network error")),
      });
      ctx.mockFileRepository = createMockFileRepository({
        getByHash: vi.fn().mockResolvedValue(undefined),
      });
      const service = ctx.createService();

      await service.ensureFileCached(FILE_ID);

      expect(localFileCache.get(FILE_ID)).toBeUndefined();
    });

    it("should not save to fileRepository when blob already exists in IndexedDB", async () => {
      ctx.mockFileRepository = createMockFileRepository({
        getByHash: vi.fn().mockResolvedValue({
          data_hash: FILE_ID,
          data: new Blob(["img"], { type: "image/jpeg" }),
        }),
      });
      const service = ctx.createService();

      await service.ensureFileCached(FILE_ID);

      expect(ctx.mockFileRepository.save).not.toHaveBeenCalled();
    });

    it("should make exactly one getFile call when called concurrently with the same fileId", async () => {
      ctx.mockSyncAdapter = createMockSyncAdapter({
        getFile: createMockGetFilesSuccess(FILE_ID),
      });
      ctx.mockFileRepository = createMockFileRepository({
        getByHash: vi.fn().mockResolvedValue(undefined),
      });
      const service = ctx.createService();

      await Promise.all([
        service.ensureFileCached(FILE_ID),
        service.ensureFileCached(FILE_ID),
        service.ensureFileCached(FILE_ID),
      ]);

      expect(ctx.mockSyncAdapter.getFile).toHaveBeenCalledTimes(1);
    });
  });
});

import { describe, expect, it, vi } from "vitest";
import { MAX_FILE_BATCH_SIZE } from "@/constants";
import {
  createMockGetFilesNotFound,
  createMockGetFilesSuccess,
  createMockSyncAdapter,
  localFileCache,
  MOCK_BASE64,
  MOCK_MIME_TYPE,
  setupFileSyncTests,
} from "./FileSyncService-test-utils";

const HASH = "cache-from-server-id";

describe("FileSyncService", () => {
  const ctx = setupFileSyncTests();

  describe("cacheFromServer", () => {
    it("should call getFile with the given hash", async () => {
      ctx.mockSyncAdapter = createMockSyncAdapter({
        getFile: createMockGetFilesSuccess(HASH),
      });
      const service = ctx.createService();

      await service.cacheFromServer(HASH);

      expect(ctx.mockSyncAdapter.getFile).toHaveBeenCalledWith({
        hashes: [HASH],
      });
    });

    it("should add file to localFileCache after successful fetch", async () => {
      ctx.mockSyncAdapter = createMockSyncAdapter({
        getFile: createMockGetFilesSuccess(HASH),
      });
      const service = ctx.createService();

      await service.cacheFromServer(HASH);

      expect(localFileCache.get(HASH)).toBeDefined();
    });

    it("should save file to fileRepository after successful fetch", async () => {
      ctx.mockSyncAdapter = createMockSyncAdapter({
        getFile: createMockGetFilesSuccess(HASH),
      });
      const service = ctx.createService();

      await service.cacheFromServer(HASH);

      expect(ctx.mockFileRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ data_hash: HASH, data: expect.any(Blob) }),
      );
    });

    it("should not add to localFileCache when server returns FILE_NOT_FOUND", async () => {
      ctx.mockSyncAdapter = createMockSyncAdapter({
        getFile: createMockGetFilesNotFound(HASH),
      });
      const service = ctx.createService();

      await service.cacheFromServer(HASH);

      expect(localFileCache.get(HASH)).toBeUndefined();
    });

    it("should not throw when getFile throws", async () => {
      ctx.mockSyncAdapter = createMockSyncAdapter({
        getFile: vi.fn().mockRejectedValue(new Error("Network error")),
      });
      const service = ctx.createService();

      await expect(service.cacheFromServer(HASH)).resolves.toBeUndefined();
    });

    it("should use FALLBACK_FILE_MIME_TYPE when mime_type is absent in response", async () => {
      ctx.mockSyncAdapter = createMockSyncAdapter({
        getFile: vi.fn().mockResolvedValue({
          ok: true,
          files: [{ hash: HASH, data: MOCK_BASE64 }],
        }),
      });
      const service = ctx.createService();

      await service.cacheFromServer(HASH);

      expect(ctx.mockFileRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ data_hash: HASH }),
      );
    });
  });

  describe("batchCacheFromServer", () => {
    it("should call getFile for each chunk of hashes", async () => {
      const hashes = Array.from(
        { length: MAX_FILE_BATCH_SIZE + 1 },
        (_, i) => `hash-${i}`,
      );
      ctx.mockSyncAdapter = createMockSyncAdapter({
        getFile: vi.fn().mockResolvedValue({ ok: true, files: [] }),
      });
      const service = ctx.createService();

      await service.batchCacheFromServer(hashes);

      expect(ctx.mockSyncAdapter.getFile).toHaveBeenCalledTimes(2);
    });

    it("should process first chunk with MAX_FILE_BATCH_SIZE items", async () => {
      const hashes = Array.from(
        { length: MAX_FILE_BATCH_SIZE + 1 },
        (_, i) => `hash-${i}`,
      );
      ctx.mockSyncAdapter = createMockSyncAdapter({
        getFile: vi.fn().mockResolvedValue({ ok: true, files: [] }),
      });
      const service = ctx.createService();

      await service.batchCacheFromServer(hashes);

      const firstCall = vi.mocked(ctx.mockSyncAdapter.getFile).mock.calls[0][0];
      expect(firstCall.hashes.length).toBe(MAX_FILE_BATCH_SIZE);
    });

    it("should continue processing after one chunk fails", async () => {
      const hashes = Array.from(
        { length: MAX_FILE_BATCH_SIZE + 1 },
        (_, i) => `hash-${i}`,
      );
      ctx.mockSyncAdapter = createMockSyncAdapter({
        getFile: vi
          .fn()
          .mockRejectedValueOnce(new Error("Network error"))
          .mockResolvedValueOnce({ ok: true, files: [] }),
      });
      const service = ctx.createService();

      await expect(
        service.batchCacheFromServer(hashes),
      ).resolves.toBeUndefined();
      expect(ctx.mockSyncAdapter.getFile).toHaveBeenCalledTimes(2);
    });

    it("should save blobs for all successfully fetched files", async () => {
      const HASH_A = "hash-a";
      const HASH_B = "hash-b";
      ctx.mockSyncAdapter = createMockSyncAdapter({
        getFile: vi.fn().mockResolvedValue({
          ok: true,
          files: [
            {
              hash: HASH_A,
              mime_type: MOCK_MIME_TYPE,
              data: MOCK_BASE64,
            },
            {
              hash: HASH_B,
              mime_type: MOCK_MIME_TYPE,
              data: MOCK_BASE64,
            },
          ],
        }),
      });
      const service = ctx.createService();

      await service.batchCacheFromServer([HASH_A, HASH_B]);

      expect(ctx.mockFileRepository.save).toHaveBeenCalledTimes(2);
    });
  });
});

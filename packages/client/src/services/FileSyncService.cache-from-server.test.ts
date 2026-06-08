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

  function createServiceWithGetFile(getFile: ReturnType<typeof vi.fn>) {
    ctx.mockSyncAdapter = createMockSyncAdapter({ getFile });
    return ctx.createService();
  }

  describe("cacheFromServer", () => {
    it("should call getFile with the given hash", async () => {
      const service = createServiceWithGetFile(createMockGetFilesSuccess(HASH));

      await service.cacheFromServer(HASH);

      expect(ctx.mockSyncAdapter.getFile).toHaveBeenCalledWith({
        hashes: [HASH],
      });
    });

    it("should add file to localFileCache after successful fetch", async () => {
      const service = createServiceWithGetFile(createMockGetFilesSuccess(HASH));

      await service.cacheFromServer(HASH);

      expect(localFileCache.get(HASH)).toBeDefined();
    });

    it("should save file to fileRepository after successful fetch", async () => {
      const service = createServiceWithGetFile(createMockGetFilesSuccess(HASH));

      await service.cacheFromServer(HASH);

      expect(ctx.mockFileRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ data_hash: HASH, data: expect.any(Blob) }),
      );
    });

    it("should not add to localFileCache when server returns FILE_NOT_FOUND", async () => {
      const service = createServiceWithGetFile(
        createMockGetFilesNotFound(HASH),
      );

      await service.cacheFromServer(HASH);

      expect(localFileCache.get(HASH)).toBeUndefined();
    });

    it("should not throw when getFile throws", async () => {
      const service = createServiceWithGetFile(
        vi.fn().mockRejectedValue(new Error("Network error")),
      );

      await expect(service.cacheFromServer(HASH)).resolves.toBeUndefined();
    });

    it("should use FALLBACK_FILE_MIME_TYPE when mime_type is absent in response", async () => {
      const service = createServiceWithGetFile(
        vi.fn().mockResolvedValue({
          ok: true,
          files: [{ hash: HASH, data: MOCK_BASE64 }],
        }),
      );

      await service.cacheFromServer(HASH);

      expect(ctx.mockFileRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ data_hash: HASH }),
      );
    });
  });

  describe("batchCacheFromServer", () => {
    const oversizedHashes = Array.from(
      { length: MAX_FILE_BATCH_SIZE + 1 },
      (_, i) => `hash-${i}`,
    );

    it("should call getFile for each chunk of hashes", async () => {
      const service = createServiceWithGetFile(
        vi.fn().mockResolvedValue({ ok: true, files: [] }),
      );

      await service.batchCacheFromServer(oversizedHashes);

      expect(ctx.mockSyncAdapter.getFile).toHaveBeenCalledTimes(2);
    });

    it("should process first chunk with MAX_FILE_BATCH_SIZE items", async () => {
      const service = createServiceWithGetFile(
        vi.fn().mockResolvedValue({ ok: true, files: [] }),
      );

      await service.batchCacheFromServer(oversizedHashes);

      const firstCall = vi.mocked(ctx.mockSyncAdapter.getFile).mock.calls[0][0];
      expect(firstCall.hashes.length).toBe(MAX_FILE_BATCH_SIZE);
    });

    it("should continue processing after one chunk fails", async () => {
      const service = createServiceWithGetFile(
        vi
          .fn()
          .mockRejectedValueOnce(new Error("Network error"))
          .mockResolvedValueOnce({ ok: true, files: [] }),
      );

      await expect(
        service.batchCacheFromServer(oversizedHashes),
      ).resolves.toBeUndefined();
      expect(ctx.mockSyncAdapter.getFile).toHaveBeenCalledTimes(2);
    });

    it("should skip file with error and continue processing remaining files", async () => {
      const HASH_ERR = "hash-err";
      const HASH_OK = "hash-ok";
      const service = createServiceWithGetFile(
        vi.fn().mockResolvedValue({
          ok: true,
          files: [
            { hash: HASH_ERR, error: "FILE_NOT_FOUND" },
            { hash: HASH_OK, mime_type: MOCK_MIME_TYPE, data: MOCK_BASE64 },
          ],
        }),
      );

      await service.batchCacheFromServer([HASH_ERR, HASH_OK]);

      expect(ctx.mockFileRepository.save).toHaveBeenCalledTimes(1);
      expect(ctx.mockFileRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ data_hash: HASH_OK }),
      );
    });

    it("should continue when individual file processing throws", async () => {
      const HASH_BAD = "hash-bad-data";
      const HASH_OK = "hash-ok-data";
      const service = createServiceWithGetFile(
        vi.fn().mockResolvedValue({
          ok: true,
          files: [
            {
              hash: HASH_BAD,
              mime_type: MOCK_MIME_TYPE,
              data: "!!!invalid-base64!!!",
            },
            { hash: HASH_OK, mime_type: MOCK_MIME_TYPE, data: MOCK_BASE64 },
          ],
        }),
      );

      await service.batchCacheFromServer([HASH_BAD, HASH_OK]);

      expect(ctx.mockFileRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ data_hash: HASH_OK }),
      );
    });

    it("should save blobs for all successfully fetched files", async () => {
      const HASH_A = "hash-a";
      const HASH_B = "hash-b";
      const service = createServiceWithGetFile(
        vi.fn().mockResolvedValue({
          ok: true,
          files: [
            { hash: HASH_A, mime_type: MOCK_MIME_TYPE, data: MOCK_BASE64 },
            { hash: HASH_B, mime_type: MOCK_MIME_TYPE, data: MOCK_BASE64 },
          ],
        }),
      );

      await service.batchCacheFromServer([HASH_A, HASH_B]);

      expect(ctx.mockFileRepository.save).toHaveBeenCalledTimes(2);
    });
  });
});

import { describe, expect, it, vi } from "vitest";
import { MAX_COVER_BATCH_SIZE } from "@/constants";
import {
  createMockGetCoversNotFound,
  createMockGetCoversSuccess,
  createMockSyncAdapter,
  localCoverCache,
  MOCK_BASE64,
  MOCK_MIME_TYPE,
  setupCoverSyncTests,
} from "./CoverSyncService-test-utils";

const HASH = "cache-from-server-id";

describe("CoverSyncService", () => {
  const ctx = setupCoverSyncTests();

  describe("cacheFromServer", () => {
    it("should call getCover with the given hash", async () => {
      ctx.mockSyncAdapter = createMockSyncAdapter({
        getCover: createMockGetCoversSuccess(HASH),
      });
      const service = ctx.createService();

      await service.cacheFromServer(HASH);

      expect(ctx.mockSyncAdapter.getCover).toHaveBeenCalledWith({
        hashes: [HASH],
      });
    });

    it("should add cover to localCoverCache after successful fetch", async () => {
      ctx.mockSyncAdapter = createMockSyncAdapter({
        getCover: createMockGetCoversSuccess(HASH),
      });
      const service = ctx.createService();

      await service.cacheFromServer(HASH);

      expect(localCoverCache.get(HASH)).toBeDefined();
    });

    it("should save cover to coverRepository after successful fetch", async () => {
      ctx.mockSyncAdapter = createMockSyncAdapter({
        getCover: createMockGetCoversSuccess(HASH),
      });
      const service = ctx.createService();

      await service.cacheFromServer(HASH);

      expect(ctx.mockCoverRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ data_hash: HASH, data: expect.any(Blob) }),
      );
    });

    it("should not add to localCoverCache when server returns FILE_NOT_FOUND", async () => {
      ctx.mockSyncAdapter = createMockSyncAdapter({
        getCover: createMockGetCoversNotFound(HASH),
      });
      const service = ctx.createService();

      await service.cacheFromServer(HASH);

      expect(localCoverCache.get(HASH)).toBeUndefined();
    });

    it("should not throw when getCover throws", async () => {
      ctx.mockSyncAdapter = createMockSyncAdapter({
        getCover: vi.fn().mockRejectedValue(new Error("Network error")),
      });
      const service = ctx.createService();

      await expect(service.cacheFromServer(HASH)).resolves.toBeUndefined();
    });

    it("should use FALLBACK_COVER_MIME_TYPE when mime_type is absent in response", async () => {
      ctx.mockSyncAdapter = createMockSyncAdapter({
        getCover: vi.fn().mockResolvedValue({
          ok: true,
          covers: [{ hash: HASH, data: MOCK_BASE64 }],
        }),
      });
      const service = ctx.createService();

      await service.cacheFromServer(HASH);

      expect(ctx.mockCoverRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ data_hash: HASH }),
      );
    });
  });

  describe("batchCacheFromServer", () => {
    it("should call getCover for each chunk of hashes", async () => {
      const hashes = Array.from(
        { length: MAX_COVER_BATCH_SIZE + 1 },
        (_, i) => `hash-${i}`,
      );
      ctx.mockSyncAdapter = createMockSyncAdapter({
        getCover: vi.fn().mockResolvedValue({ ok: true, covers: [] }),
      });
      const service = ctx.createService();

      await service.batchCacheFromServer(hashes);

      expect(ctx.mockSyncAdapter.getCover).toHaveBeenCalledTimes(2);
    });

    it("should process first chunk with MAX_COVER_BATCH_SIZE items", async () => {
      const hashes = Array.from(
        { length: MAX_COVER_BATCH_SIZE + 1 },
        (_, i) => `hash-${i}`,
      );
      ctx.mockSyncAdapter = createMockSyncAdapter({
        getCover: vi.fn().mockResolvedValue({ ok: true, covers: [] }),
      });
      const service = ctx.createService();

      await service.batchCacheFromServer(hashes);

      const firstCall = vi.mocked(ctx.mockSyncAdapter.getCover).mock
        .calls[0][0];
      expect(firstCall.hashes.length).toBe(MAX_COVER_BATCH_SIZE);
    });

    it("should continue processing after one chunk fails", async () => {
      const hashes = Array.from(
        { length: MAX_COVER_BATCH_SIZE + 1 },
        (_, i) => `hash-${i}`,
      );
      ctx.mockSyncAdapter = createMockSyncAdapter({
        getCover: vi
          .fn()
          .mockRejectedValueOnce(new Error("Network error"))
          .mockResolvedValueOnce({ ok: true, covers: [] }),
      });
      const service = ctx.createService();

      await expect(
        service.batchCacheFromServer(hashes),
      ).resolves.toBeUndefined();
      expect(ctx.mockSyncAdapter.getCover).toHaveBeenCalledTimes(2);
    });

    it("should save blobs for all successfully fetched covers", async () => {
      const HASH_A = "hash-a";
      const HASH_B = "hash-b";
      ctx.mockSyncAdapter = createMockSyncAdapter({
        getCover: vi.fn().mockResolvedValue({
          ok: true,
          covers: [
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

      expect(ctx.mockCoverRepository.save).toHaveBeenCalledTimes(2);
    });
  });
});

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

const FILE_ID = "cache-from-server-id";

describe("CoverSyncService", () => {
  const ctx = setupCoverSyncTests();

  describe("cacheFromServer", () => {
    it("should call getCover with the given fileId", async () => {
      ctx.mockSyncAdapter = createMockSyncAdapter({
        getCover: createMockGetCoversSuccess(FILE_ID),
      });
      const service = ctx.createService();

      await service.cacheFromServer(FILE_ID);

      expect(ctx.mockSyncAdapter.getCover).toHaveBeenCalledWith({
        file_ids: [FILE_ID],
      });
    });

    it("should add cover to localCoverCache after successful fetch", async () => {
      ctx.mockSyncAdapter = createMockSyncAdapter({
        getCover: createMockGetCoversSuccess(FILE_ID),
      });
      const service = ctx.createService();

      await service.cacheFromServer(FILE_ID);

      expect(localCoverCache.get(FILE_ID)).toBeDefined();
    });

    it("should save cover to coverRepository after successful fetch", async () => {
      ctx.mockSyncAdapter = createMockSyncAdapter({
        getCover: createMockGetCoversSuccess(FILE_ID),
      });
      const service = ctx.createService();

      await service.cacheFromServer(FILE_ID);

      expect(ctx.mockCoverRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ file_id: FILE_ID, data: expect.any(Blob) }),
      );
    });

    it("should not add to localCoverCache when server returns FILE_NOT_FOUND", async () => {
      ctx.mockSyncAdapter = createMockSyncAdapter({
        getCover: createMockGetCoversNotFound(FILE_ID),
      });
      const service = ctx.createService();

      await service.cacheFromServer(FILE_ID);

      expect(localCoverCache.get(FILE_ID)).toBeUndefined();
    });

    it("should not throw when getCover throws", async () => {
      ctx.mockSyncAdapter = createMockSyncAdapter({
        getCover: vi.fn().mockRejectedValue(new Error("Network error")),
      });
      const service = ctx.createService();

      await expect(service.cacheFromServer(FILE_ID)).resolves.toBeUndefined();
    });

    it("should use FALLBACK_COVER_MIME_TYPE when mime_type is absent in response", async () => {
      ctx.mockSyncAdapter = createMockSyncAdapter({
        getCover: vi.fn().mockResolvedValue({
          ok: true,
          covers: [{ file_id: FILE_ID, data: MOCK_BASE64 }],
        }),
      });
      const service = ctx.createService();

      await service.cacheFromServer(FILE_ID);

      expect(ctx.mockCoverRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ file_id: FILE_ID }),
      );
    });
  });

  describe("batchCacheFromServer", () => {
    it("should call getCover for each chunk of file_ids", async () => {
      const fileIds = Array.from(
        { length: MAX_COVER_BATCH_SIZE + 1 },
        (_, i) => `file-${i}`,
      );
      ctx.mockSyncAdapter = createMockSyncAdapter({
        getCover: vi.fn().mockResolvedValue({ ok: true, covers: [] }),
      });
      const service = ctx.createService();

      await service.batchCacheFromServer(fileIds);

      expect(ctx.mockSyncAdapter.getCover).toHaveBeenCalledTimes(2);
    });

    it("should process first chunk with MAX_COVER_BATCH_SIZE items", async () => {
      const fileIds = Array.from(
        { length: MAX_COVER_BATCH_SIZE + 1 },
        (_, i) => `file-${i}`,
      );
      ctx.mockSyncAdapter = createMockSyncAdapter({
        getCover: vi.fn().mockResolvedValue({ ok: true, covers: [] }),
      });
      const service = ctx.createService();

      await service.batchCacheFromServer(fileIds);

      const firstCall = vi.mocked(ctx.mockSyncAdapter.getCover).mock
        .calls[0][0];
      expect(firstCall.file_ids.length).toBe(MAX_COVER_BATCH_SIZE);
    });

    it("should continue processing after one chunk fails", async () => {
      const fileIds = Array.from(
        { length: MAX_COVER_BATCH_SIZE + 1 },
        (_, i) => `file-${i}`,
      );
      ctx.mockSyncAdapter = createMockSyncAdapter({
        getCover: vi
          .fn()
          .mockRejectedValueOnce(new Error("Network error"))
          .mockResolvedValueOnce({ ok: true, covers: [] }),
      });
      const service = ctx.createService();

      await expect(
        service.batchCacheFromServer(fileIds),
      ).resolves.toBeUndefined();
      expect(ctx.mockSyncAdapter.getCover).toHaveBeenCalledTimes(2);
    });

    it("should save blobs for all successfully fetched covers", async () => {
      const FILE_ID_A = "file-a";
      const FILE_ID_B = "file-b";
      ctx.mockSyncAdapter = createMockSyncAdapter({
        getCover: vi.fn().mockResolvedValue({
          ok: true,
          covers: [
            {
              file_id: FILE_ID_A,
              mime_type: MOCK_MIME_TYPE,
              data: MOCK_BASE64,
            },
            {
              file_id: FILE_ID_B,
              mime_type: MOCK_MIME_TYPE,
              data: MOCK_BASE64,
            },
          ],
        }),
      });
      const service = ctx.createService();

      await service.batchCacheFromServer([FILE_ID_A, FILE_ID_B]);

      expect(ctx.mockCoverRepository.save).toHaveBeenCalledTimes(2);
    });
  });
});

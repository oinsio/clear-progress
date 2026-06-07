import { describe, expect, it, vi } from "vitest";
import { MAX_FILE_BATCH_SIZE } from "@/constants";
import {
  createMockPendingFileRepository,
  createMockSyncAdapter,
  createPendingFile,
  setupFileSyncTests,
} from "./FileSyncService-test-utils";

describe("FileSyncService", () => {
  const ctx = setupFileSyncTests();

  describe("sync", () => {
    it("should delete pending file after successful upload", async () => {
      const pendingFile = createPendingFile({ data_hash: "hash-to-delete" });
      ctx.mockPendingFileRepository = createMockPendingFileRepository({
        getAll: vi.fn().mockResolvedValue([pendingFile]),
      });
      ctx.mockSyncAdapter = createMockSyncAdapter({
        uploadFiles: vi.fn().mockResolvedValue({
          ok: true,
          results: [{ data_hash: "hash-to-delete", reused: false }],
        }),
      });
      const service = ctx.createService();

      await service.sync();

      expect(ctx.mockPendingFileRepository.delete).toHaveBeenCalledWith(
        "hash-to-delete",
      );
    });

    it("should save file blob data and hash to fileRepository after upload", async () => {
      const pendingFile = createPendingFile({ data_hash: "hash-upload" });
      ctx.mockPendingFileRepository = createMockPendingFileRepository({
        getAll: vi.fn().mockResolvedValue([pendingFile]),
      });
      ctx.mockSyncAdapter = createMockSyncAdapter({
        uploadFiles: vi.fn().mockResolvedValue({
          ok: true,
          results: [{ data_hash: "hash-upload", reused: false }],
        }),
      });
      const service = ctx.createService();

      await service.sync();

      expect(ctx.mockFileRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          data_hash: "hash-upload",
          data: pendingFile.data,
        }),
      );
    });

    it("should not save to fileRepository when server returns reused: true", async () => {
      const pendingFile = createPendingFile({ data_hash: "hash-reused" });
      ctx.mockPendingFileRepository = createMockPendingFileRepository({
        getAll: vi.fn().mockResolvedValue([pendingFile]),
      });
      ctx.mockSyncAdapter = createMockSyncAdapter({
        uploadFiles: vi.fn().mockResolvedValue({
          ok: true,
          results: [{ data_hash: "hash-reused", reused: true }],
        }),
      });
      const service = ctx.createService();

      await service.sync();

      expect(ctx.mockFileRepository.save).not.toHaveBeenCalled();
    });

    it("should delete pending file after deduplication (reused: true)", async () => {
      const pendingFile = createPendingFile({ data_hash: "hash-dedup" });
      ctx.mockPendingFileRepository = createMockPendingFileRepository({
        getAll: vi.fn().mockResolvedValue([pendingFile]),
      });
      ctx.mockSyncAdapter = createMockSyncAdapter({
        uploadFiles: vi.fn().mockResolvedValue({
          ok: true,
          results: [{ data_hash: "hash-dedup", reused: true }],
        }),
      });
      const service = ctx.createService();

      await service.sync();

      expect(ctx.mockPendingFileRepository.delete).toHaveBeenCalledWith(
        "hash-dedup",
      );
    });

    it("should stop on first API failure (uploadFiles throws)", async () => {
      const pendingFiles = Array.from(
        { length: MAX_FILE_BATCH_SIZE + 1 },
        (_, i) => createPendingFile({ data_hash: `hash-${i}` }),
      );
      ctx.mockSyncAdapter = createMockSyncAdapter({
        uploadFiles: vi.fn().mockRejectedValue(new Error("Network error")),
      });
      ctx.mockPendingFileRepository = createMockPendingFileRepository({
        getAll: vi.fn().mockResolvedValue(pendingFiles),
      });
      const service = ctx.createService();

      await service.sync();

      expect(ctx.mockSyncAdapter.uploadFiles).toHaveBeenCalledTimes(1);
    });

    it("should skip per-item error and continue with remaining items in same chunk", async () => {
      const pendingFile1 = createPendingFile({
        data_hash: "hash-bad",
        goal_id: "bad-goal",
      });
      const pendingFile2 = createPendingFile({
        data_hash: "hash-ok",
        goal_id: "ok-goal",
      });
      ctx.mockSyncAdapter = createMockSyncAdapter({
        uploadFiles: vi.fn().mockResolvedValue({
          ok: true,
          results: [
            {
              data_hash: "hash-bad",
              error: "FILE_TOO_LARGE",
            },
            {
              data_hash: "hash-ok",
              reused: false,
            },
          ],
        }),
      });
      ctx.mockPendingFileRepository = createMockPendingFileRepository({
        getAll: vi.fn().mockResolvedValue([pendingFile1, pendingFile2]),
      });
      const service = ctx.createService();

      await service.sync();

      expect(ctx.mockPendingFileRepository.delete).toHaveBeenCalledWith(
        "hash-ok",
      );
      expect(ctx.mockPendingFileRepository.delete).not.toHaveBeenCalledWith(
        "hash-bad",
      );
    });

    it("should process files in chunks of MAX_FILE_BATCH_SIZE", async () => {
      const pendingFiles = Array.from(
        { length: MAX_FILE_BATCH_SIZE + 1 },
        (_, i) => createPendingFile({ data_hash: `hash-${i}` }),
      );
      ctx.mockPendingFileRepository = createMockPendingFileRepository({
        getAll: vi.fn().mockResolvedValue(pendingFiles),
      });
      const service = ctx.createService();

      await service.sync();

      expect(ctx.mockSyncAdapter.uploadFiles).toHaveBeenCalledTimes(2);
      const firstCallFiles = vi.mocked(ctx.mockSyncAdapter.uploadFiles).mock
        .calls[0][0];
      expect(firstCallFiles.files.length).toBe(MAX_FILE_BATCH_SIZE);
    });
  });
});

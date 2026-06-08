import { describe, expect, it, vi } from "vitest";
import { MAX_FILE_BATCH_SIZE } from "@/constants";
import {
  createMockAttachmentRepository,
  createMockFileRepository,
  createMockGoalRepository,
  createMockPendingFileRepository,
  createMockSyncAdapter,
  createPendingFile,
  localFileCache,
  setupFileSyncTests,
  setupOrphanedFileTest,
  setupReusedUploadTest,
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
      setupReusedUploadTest(ctx, "hash-reused");
      const service = ctx.createService();

      await service.sync();

      expect(ctx.mockFileRepository.save).not.toHaveBeenCalled();
    });

    it("should delete pending file after deduplication (reused: true)", async () => {
      setupReusedUploadTest(ctx, "hash-dedup");
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

    it("should save to fileRepository when result has no reused field", async () => {
      const pendingFile = createPendingFile({ data_hash: "no-reused-field" });
      ctx.mockPendingFileRepository = createMockPendingFileRepository({
        getAll: vi.fn().mockResolvedValue([pendingFile]),
      });
      ctx.mockSyncAdapter = createMockSyncAdapter({
        uploadFiles: vi.fn().mockResolvedValue({
          ok: true,
          results: [{ data_hash: "no-reused-field" }],
        }),
      });
      const service = ctx.createService();

      await service.sync();

      expect(ctx.mockFileRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ data_hash: "no-reused-field" }),
      );
    });
  });

  describe("deleteOrphanedFiles (via sync)", () => {
    it("should call deleteFile for orphaned files not referenced by goals or attachments", async () => {
      setupOrphanedFileTest(ctx, { fileHash: "orphan-hash" });
      const service = ctx.createService();

      await service.sync();

      expect(ctx.mockSyncAdapter.deleteFile).toHaveBeenCalledWith({
        hash: "orphan-hash",
      });
    });

    it("should delete orphaned file from fileRepository when server confirms", async () => {
      setupOrphanedFileTest(ctx, { fileHash: "orphan-del" });
      const service = ctx.createService();

      await service.sync();

      expect(ctx.mockFileRepository.delete).toHaveBeenCalledWith("orphan-del");
    });

    it("should remove orphaned file from localFileCache when server confirms", async () => {
      localFileCache.set("orphan-cache", "blob:http://localhost/orphan");
      setupOrphanedFileTest(ctx, { fileHash: "orphan-cache" });
      const service = ctx.createService();

      await service.sync();

      expect(localFileCache.get("orphan-cache")).toBeUndefined();
    });

    it("should NOT delete file referenced by active goal cover_hash", async () => {
      setupOrphanedFileTest(ctx, {
        fileHash: "active-cover",
        goalRepositoryOverrides: {
          getActive: vi
            .fn()
            .mockResolvedValue([
              { id: "g1", cover_hash: "active-cover", is_deleted: false },
            ]),
        },
      });
      const service = ctx.createService();

      await service.sync();

      expect(ctx.mockSyncAdapter.deleteFile).not.toHaveBeenCalled();
    });

    it("should NOT delete file referenced by active attachment", async () => {
      setupOrphanedFileTest(ctx, {
        fileHash: "attached-hash",
        attachmentRepositoryOverrides: {
          getAll: vi
            .fn()
            .mockResolvedValue([
              { id: "a1", data_hash: "attached-hash", is_deleted: false },
            ]),
        },
      });
      const service = ctx.createService();

      await service.sync();

      expect(ctx.mockSyncAdapter.deleteFile).not.toHaveBeenCalled();
    });

    it("should NOT delete from repo when server says not deleted", async () => {
      setupOrphanedFileTest(ctx, {
        fileHash: "not-del",
        deleteFileResponse: { deleted: false, ref_count: 1 },
      });
      const service = ctx.createService();

      await service.sync();

      expect(ctx.mockFileRepository.delete).not.toHaveBeenCalled();
    });

    it("should continue gracefully when deleteFile throws for one orphan", async () => {
      const orphan1 = {
        data_hash: "err-orphan",
        data: new Blob(["img"], { type: "image/jpeg" }),
      };
      const orphan2 = {
        data_hash: "ok-orphan",
        data: new Blob(["img"], { type: "image/jpeg" }),
      };
      ctx.mockFileRepository = createMockFileRepository({
        getAll: vi.fn().mockResolvedValue([orphan1, orphan2]),
      });
      ctx.mockGoalRepository = createMockGoalRepository();
      ctx.mockAttachmentRepository = createMockAttachmentRepository();
      ctx.mockSyncAdapter = createMockSyncAdapter({
        deleteFile: vi
          .fn()
          .mockRejectedValueOnce(new Error("Network error"))
          .mockResolvedValueOnce({ deleted: true }),
      });
      const service = ctx.createService();

      await service.sync();

      expect(ctx.mockFileRepository.delete).toHaveBeenCalledWith("ok-orphan");
      expect(ctx.mockFileRepository.delete).not.toHaveBeenCalledWith(
        "err-orphan",
      );
    });

    it("should skip deleted attachments when computing active hashes", async () => {
      setupOrphanedFileTest(ctx, {
        fileHash: "del-attach-hash",
        attachmentRepositoryOverrides: {
          getAll: vi
            .fn()
            .mockResolvedValue([
              { id: "a1", data_hash: "del-attach-hash", is_deleted: true },
            ]),
        },
      });
      const service = ctx.createService();

      await service.sync();

      expect(ctx.mockSyncAdapter.deleteFile).toHaveBeenCalledWith({
        hash: "del-attach-hash",
      });
    });
  });
});

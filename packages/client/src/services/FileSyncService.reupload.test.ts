import { beforeEach, describe, expect, it, vi } from "vitest";
import { FALLBACK_FILE_MIME_TYPE, MAX_FILE_BATCH_SIZE } from "@/constants";
import {
  createFileRecord,
  createGoalWithServerFile,
  createMockFileRepository,
  createMockGetFilesNotFound,
  createMockGoalRepository,
  createMockSyncAdapter,
  EXISTING_SERVER_FILE_ID,
  setupFileSyncTests,
  setupReuploadDefaults,
} from "./FileSyncService-test-utils";

describe("FileSyncService", () => {
  const ctx = setupFileSyncTests();

  describe("reuploadLocalFiles", () => {
    beforeEach(() => {
      setupReuploadDefaults(ctx);
    });

    it("should skip goals with empty cover_hash", async () => {
      ctx.mockGoalRepository = createMockGoalRepository({
        getActive: vi
          .fn()
          .mockResolvedValue([createGoalWithServerFile({ cover_hash: "" })]),
      });
      const service = ctx.createService();

      await service.reuploadLocalFiles();

      expect(ctx.mockSyncAdapter.uploadFiles).not.toHaveBeenCalled();
    });

    it("should skip goals without a file blob in FileRepository when server fetch also fails", async () => {
      ctx.mockFileRepository = createMockFileRepository({});
      ctx.mockSyncAdapter = createMockSyncAdapter({
        getFile: createMockGetFilesNotFound(EXISTING_SERVER_FILE_ID),
      });
      const service = ctx.createService();

      await service.reuploadLocalFiles();

      expect(ctx.mockSyncAdapter.uploadFiles).not.toHaveBeenCalled();
    });

    it("should skip goals with no FileRecord at all when server fetch also fails", async () => {
      ctx.mockFileRepository = createMockFileRepository({
        getByHash: vi.fn().mockResolvedValue(undefined),
      });
      ctx.mockSyncAdapter = createMockSyncAdapter({
        getFile: createMockGetFilesNotFound(EXISTING_SERVER_FILE_ID),
      });
      const service = ctx.createService();

      await service.reuploadLocalFiles();

      expect(ctx.mockSyncAdapter.uploadFiles).not.toHaveBeenCalled();
    });

    it("should call uploadFiles with empty goal_id in batch item when blob exists", async () => {
      const service = ctx.createService();

      await service.reuploadLocalFiles();

      expect(ctx.mockSyncAdapter.uploadFiles).toHaveBeenCalledWith(
        expect.objectContaining({
          files: expect.arrayContaining([
            expect.objectContaining({ goal_id: "" }),
          ]),
        }),
      );
    });

    it("should form filename as hash prefix + extension matching server format", async () => {
      // cover-hash-xyz → first 12 chars: "cover-hash-x", image/jpeg → jpg
      const service = ctx.createService();

      await service.reuploadLocalFiles();

      expect(ctx.mockSyncAdapter.uploadFiles).toHaveBeenCalledWith(
        expect.objectContaining({
          files: expect.arrayContaining([
            expect.objectContaining({ filename: "cover-hash-x.jpg" }),
          ]),
        }),
      );
    });

    it("should use blob.type as mime_type in batch item", async () => {
      const fileWithType = {
        ...createFileRecord(),
        data: new Blob(["img"], { type: "image/png" }),
      };
      ctx.mockFileRepository = createMockFileRepository({
        getByHash: vi.fn().mockResolvedValue(fileWithType),
      });
      const service = ctx.createService();

      await service.reuploadLocalFiles();

      expect(ctx.mockSyncAdapter.uploadFiles).toHaveBeenCalledWith(
        expect.objectContaining({
          files: expect.arrayContaining([
            expect.objectContaining({ mime_type: "image/png" }),
          ]),
        }),
      );
    });

    it("should use FALLBACK_FILE_MIME_TYPE when blob.type is empty", async () => {
      const fileWithEmptyType = {
        ...createFileRecord(),
        data: new Blob(["img"], { type: "" }),
      };
      ctx.mockFileRepository = createMockFileRepository({
        getByHash: vi.fn().mockResolvedValue(fileWithEmptyType),
      });
      const service = ctx.createService();

      await service.reuploadLocalFiles();

      expect(ctx.mockSyncAdapter.uploadFiles).toHaveBeenCalledWith(
        expect.objectContaining({
          files: expect.arrayContaining([
            expect.objectContaining({ mime_type: FALLBACK_FILE_MIME_TYPE }),
          ]),
        }),
      );
    });

    it("should not update goal when server returns the same data_hash (file still alive)", async () => {
      const service = ctx.createService();

      await service.reuploadLocalFiles();

      expect(ctx.mockGoalRepository.update).not.toHaveBeenCalled();
    });

    it("should continue processing other goals when one has a per-item error", async () => {
      const goals = [
        createGoalWithServerFile({
          id: "goal-fail",
          cover_hash: "hash-fail",
        }),
        createGoalWithServerFile({ id: "goal-ok", cover_hash: "hash-ok" }),
      ];
      ctx.mockGoalRepository = createMockGoalRepository({
        getActive: vi.fn().mockResolvedValue(goals),
      });
      ctx.mockFileRepository = createMockFileRepository({
        getByHash: vi.fn().mockResolvedValue(createFileRecord("hash-fail")),
      });
      ctx.mockSyncAdapter = createMockSyncAdapter({
        uploadFiles: vi.fn().mockResolvedValue({
          ok: true,
          results: [
            {
              data_hash: "hash-fail",
              goal_id: "goal-fail",
              error: "FILE_TOO_LARGE",
            },
            {
              data_hash: "hash-ok",
              goal_id: "goal-ok",
              reused: true,
            },
          ],
        }),
      });
      const service = ctx.createService();

      await service.reuploadLocalFiles();

      expect(ctx.mockSyncAdapter.uploadFiles).toHaveBeenCalledTimes(1);
      expect(ctx.mockGoalRepository.update).not.toHaveBeenCalled(); // file-ok is the same as goal's file hash
    });

    it("should not update goal when uploadFiles throws (network error)", async () => {
      ctx.mockSyncAdapter = createMockSyncAdapter({
        uploadFiles: vi.fn().mockRejectedValue(new Error("Network error")),
      });
      const service = ctx.createService();

      await service.reuploadLocalFiles();

      expect(ctx.mockGoalRepository.update).not.toHaveBeenCalled();
    });

    it("should continue to next chunk when one chunk throws (best-effort)", async () => {
      const goals = Array.from({ length: MAX_FILE_BATCH_SIZE + 1 }, (_, i) =>
        createGoalWithServerFile({
          id: `goal-${i}`,
          cover_hash: `hash-${i}`,
        }),
      );
      ctx.mockGoalRepository = createMockGoalRepository({
        getActive: vi.fn().mockResolvedValue(goals),
      });
      ctx.mockFileRepository = createMockFileRepository({
        getByHash: vi.fn().mockResolvedValue(createFileRecord()),
      });
      ctx.mockSyncAdapter = createMockSyncAdapter({
        uploadFiles: vi
          .fn()
          .mockRejectedValueOnce(new Error("Network error"))
          .mockResolvedValueOnce({ ok: true, results: [] }),
      });
      const service = ctx.createService();

      await service.reuploadLocalFiles();

      expect(ctx.mockSyncAdapter.uploadFiles).toHaveBeenCalledTimes(2);
    });
  });
});

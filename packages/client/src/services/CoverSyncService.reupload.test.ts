import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  FALLBACK_COVER_MIME_TYPE,
  LOCAL_COVER_ID_PREFIX,
  MAX_COVER_BATCH_SIZE,
} from "@/constants";
import {
  createCoverRecord,
  createGoalWithServerCover,
  createMockCoverRepository,
  createMockGetCoversNotFound,
  createMockGoalRepository,
  createMockSyncAdapter,
  EXISTING_SERVER_FILE_ID,
  setupCoverSyncTests,
  setupReuploadDefaults,
} from "./CoverSyncService-test-utils";

describe("CoverSyncService", () => {
  const ctx = setupCoverSyncTests();

  describe("reuploadLocalCovers", () => {
    beforeEach(() => {
      setupReuploadDefaults(ctx);
    });

    it("should skip goals with empty cover_file_id", async () => {
      ctx.mockGoalRepository = createMockGoalRepository({
        getActive: vi
          .fn()
          .mockResolvedValue([
            createGoalWithServerCover({ cover_file_id: "" }),
          ]),
      });
      const service = ctx.createService();

      await service.reuploadLocalCovers();

      expect(ctx.mockSyncAdapter.uploadCovers).not.toHaveBeenCalled();
    });

    it("should skip goals with local: cover_file_id prefix", async () => {
      ctx.mockGoalRepository = createMockGoalRepository({
        getActive: vi.fn().mockResolvedValue([
          createGoalWithServerCover({
            cover_file_id: `${LOCAL_COVER_ID_PREFIX}some-uuid`,
          }),
        ]),
      });
      const service = ctx.createService();

      await service.reuploadLocalCovers();

      expect(ctx.mockSyncAdapter.uploadCovers).not.toHaveBeenCalled();
    });

    it("should skip goals without a cover blob in CoverRepository when server fetch also fails", async () => {
      ctx.mockCoverRepository = createMockCoverRepository({});
      ctx.mockSyncAdapter = createMockSyncAdapter({
        getCover: createMockGetCoversNotFound(EXISTING_SERVER_FILE_ID),
      });
      const service = ctx.createService();

      await service.reuploadLocalCovers();

      expect(ctx.mockSyncAdapter.uploadCovers).not.toHaveBeenCalled();
    });

    it("should skip goals with no CoverRecord at all when server fetch also fails", async () => {
      ctx.mockCoverRepository = createMockCoverRepository({
        getByFileId: vi.fn().mockResolvedValue(undefined),
      });
      ctx.mockSyncAdapter = createMockSyncAdapter({
        getCover: createMockGetCoversNotFound(EXISTING_SERVER_FILE_ID),
      });
      const service = ctx.createService();

      await service.reuploadLocalCovers();

      expect(ctx.mockSyncAdapter.uploadCovers).not.toHaveBeenCalled();
    });

    it("should call uploadCovers with goal_id in batch item when blob exists", async () => {
      const service = ctx.createService();

      await service.reuploadLocalCovers();

      expect(ctx.mockSyncAdapter.uploadCovers).toHaveBeenCalledWith(
        expect.objectContaining({
          covers: expect.arrayContaining([
            expect.objectContaining({ goal_id: "goal-reupload" }),
          ]),
        }),
      );
    });

    it("should form filename as hash prefix + extension matching server format", async () => {
      // cover-hash-xyz → first 12 chars: "cover-hash-x", image/jpeg → jpg
      const service = ctx.createService();

      await service.reuploadLocalCovers();

      expect(ctx.mockSyncAdapter.uploadCovers).toHaveBeenCalledWith(
        expect.objectContaining({
          covers: expect.arrayContaining([
            expect.objectContaining({ filename: "cover-hash-x.jpg" }),
          ]),
        }),
      );
    });

    it("should use blob.type as mime_type in batch item", async () => {
      const coverWithType = {
        ...createCoverRecord(),
        data: new Blob(["img"], { type: "image/png" }),
      };
      ctx.mockCoverRepository = createMockCoverRepository({
        getByFileId: vi.fn().mockResolvedValue(coverWithType),
      });
      const service = ctx.createService();

      await service.reuploadLocalCovers();

      expect(ctx.mockSyncAdapter.uploadCovers).toHaveBeenCalledWith(
        expect.objectContaining({
          covers: expect.arrayContaining([
            expect.objectContaining({ mime_type: "image/png" }),
          ]),
        }),
      );
    });

    it("should use FALLBACK_COVER_MIME_TYPE when blob.type is empty", async () => {
      const coverWithEmptyType = {
        ...createCoverRecord(),
        data: new Blob(["img"], { type: "" }),
      };
      ctx.mockCoverRepository = createMockCoverRepository({
        getByFileId: vi.fn().mockResolvedValue(coverWithEmptyType),
      });
      const service = ctx.createService();

      await service.reuploadLocalCovers();

      expect(ctx.mockSyncAdapter.uploadCovers).toHaveBeenCalledWith(
        expect.objectContaining({
          covers: expect.arrayContaining([
            expect.objectContaining({ mime_type: FALLBACK_COVER_MIME_TYPE }),
          ]),
        }),
      );
    });

    it("should not update goal when server returns the same file_id (file still alive)", async () => {
      const service = ctx.createService();

      await service.reuploadLocalCovers();

      expect(ctx.mockGoalRepository.update).not.toHaveBeenCalled();
    });

    it("should continue processing other goals when one has a per-item error", async () => {
      const goals = [
        createGoalWithServerCover({
          id: "goal-fail",
          cover_file_id: "file-fail",
        }),
        createGoalWithServerCover({ id: "goal-ok", cover_file_id: "file-ok" }),
      ];
      ctx.mockGoalRepository = createMockGoalRepository({
        getActive: vi.fn().mockResolvedValue(goals),
      });
      ctx.mockCoverRepository = createMockCoverRepository({
        getByFileId: vi.fn().mockResolvedValue(createCoverRecord("file-fail")),
      });
      ctx.mockSyncAdapter = createMockSyncAdapter({
        uploadCovers: vi.fn().mockResolvedValue({
          ok: true,
          results: [
            {
              local_id: "goal-fail",
              goal_id: "goal-fail",
              error: "FILE_TOO_LARGE",
            },
            {
              local_id: "goal-ok",
              goal_id: "goal-ok",
              file_id: "file-ok",
              reused: true,
            },
          ],
        }),
      });
      const service = ctx.createService();

      await service.reuploadLocalCovers();

      expect(ctx.mockSyncAdapter.uploadCovers).toHaveBeenCalledTimes(1);
      expect(ctx.mockGoalRepository.update).not.toHaveBeenCalled(); // file-ok is the same as goal's cover
    });

    it("should not update goal when uploadCovers throws (network error)", async () => {
      ctx.mockSyncAdapter = createMockSyncAdapter({
        uploadCovers: vi.fn().mockRejectedValue(new Error("Network error")),
      });
      const service = ctx.createService();

      await service.reuploadLocalCovers();

      expect(ctx.mockGoalRepository.update).not.toHaveBeenCalled();
    });

    it("should continue to next chunk when one chunk throws (best-effort)", async () => {
      const goals = Array.from({ length: MAX_COVER_BATCH_SIZE + 1 }, (_, i) =>
        createGoalWithServerCover({
          id: `goal-${i}`,
          cover_file_id: `file-${i}`,
        }),
      );
      ctx.mockGoalRepository = createMockGoalRepository({
        getActive: vi.fn().mockResolvedValue(goals),
      });
      ctx.mockCoverRepository = createMockCoverRepository({
        getByFileId: vi.fn().mockResolvedValue(createCoverRecord()),
      });
      ctx.mockSyncAdapter = createMockSyncAdapter({
        uploadCovers: vi
          .fn()
          .mockRejectedValueOnce(new Error("Network error"))
          .mockResolvedValueOnce({ ok: true, results: [] }),
      });
      const service = ctx.createService();

      await service.reuploadLocalCovers();

      expect(ctx.mockSyncAdapter.uploadCovers).toHaveBeenCalledTimes(2);
    });
  });
});

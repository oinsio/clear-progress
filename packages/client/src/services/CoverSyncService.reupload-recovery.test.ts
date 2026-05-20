import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createCoverRecord,
  createGoalWithServerCover,
  createMockCoverRepository,
  createMockGetCoversNotFound,
  createMockGetCoversSuccess,
  createMockGoalRepository,
  createMockSyncAdapter,
  EXISTING_SERVER_FILE_ID,
  localCoverCache,
  NEW_SERVER_FILE_ID,
  setupCoverSyncTests,
  setupReuploadDefaults,
} from "./CoverSyncService-test-utils";

describe("CoverSyncService", () => {
  const ctx = setupCoverSyncTests();

  describe("reuploadLocalCovers", () => {
    beforeEach(() => {
      setupReuploadDefaults(ctx);
    });

    describe("when cover has no local blob — fetch from server via get_cover API", () => {
      beforeEach(() => {
        ctx.mockGoalRepository = createMockGoalRepository({
          getActive: vi.fn().mockResolvedValue([createGoalWithServerCover()]),
        });
        ctx.mockCoverRepository = createMockCoverRepository({
          getByFileId: vi
            .fn()
            .mockResolvedValueOnce(undefined) // first call: no record
            .mockResolvedValueOnce(createCoverRecord()), // second call: after cacheFromServer
        });
        ctx.mockSyncAdapter = createMockSyncAdapter({
          uploadCovers: vi.fn().mockResolvedValue({
            ok: true,
            results: [
              {
                local_id: "goal-reupload",
                goal_id: "goal-reupload",
                file_id: EXISTING_SERVER_FILE_ID,
                reused: true,
              },
            ],
          }),
          getCover: createMockGetCoversSuccess(EXISTING_SERVER_FILE_ID),
        });
      });

      it("should call uploadCovers when getCover fetch succeeds", async () => {
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

      it("should save fetched blob to coverRepository", async () => {
        ctx.mockCoverRepository = createMockCoverRepository({
          getByFileId: vi.fn().mockResolvedValue(undefined),
        });
        ctx.mockSyncAdapter = createMockSyncAdapter({
          getCover: createMockGetCoversSuccess(EXISTING_SERVER_FILE_ID),
        });
        const service = ctx.createService();

        await service.reuploadLocalCovers();

        expect(ctx.mockCoverRepository.save).toHaveBeenCalledWith(
          expect.objectContaining({
            file_id: EXISTING_SERVER_FILE_ID,
            data: expect.any(Blob),
          }),
        );
      });

      it("should skip cover gracefully when getCover fails", async () => {
        ctx.mockCoverRepository = createMockCoverRepository({
          getByFileId: vi.fn().mockResolvedValue(undefined),
        });
        ctx.mockSyncAdapter = createMockSyncAdapter({
          uploadCovers: vi.fn(),
          getCover: createMockGetCoversNotFound(EXISTING_SERVER_FILE_ID),
        });
        const service = ctx.createService();

        await service.reuploadLocalCovers();

        expect(ctx.mockSyncAdapter.uploadCovers).not.toHaveBeenCalled();
      });
    });

    describe("when server returns a different file_id", () => {
      let coverRecord: ReturnType<typeof createCoverRecord>;

      beforeEach(() => {
        coverRecord = createCoverRecord();
        ctx.mockCoverRepository = createMockCoverRepository({
          getByFileId: vi.fn().mockResolvedValue(coverRecord),
        });
        ctx.mockSyncAdapter = createMockSyncAdapter({
          uploadCovers: vi.fn().mockResolvedValue({
            ok: true,
            results: [
              {
                local_id: "goal-reupload",
                goal_id: "goal-reupload",
                file_id: NEW_SERVER_FILE_ID,
                reused: false,
              },
            ],
          }),
        });
      });

      it("should update goal cover_file_id (file was lost)", async () => {
        const service = ctx.createService();

        await service.reuploadLocalCovers();

        expect(ctx.mockGoalRepository.update).toHaveBeenCalledWith(
          expect.objectContaining({ cover_file_id: NEW_SERVER_FILE_ID }),
        );
      });

      it("should save new CoverRecord", async () => {
        const service = ctx.createService();

        await service.reuploadLocalCovers();

        expect(ctx.mockCoverRepository.save).toHaveBeenCalledWith(
          expect.objectContaining({
            file_id: NEW_SERVER_FILE_ID,
            data: coverRecord.data,
            data_hash: coverRecord.data_hash,
          }),
        );
      });

      it("should delete old CoverRecord", async () => {
        const service = ctx.createService();

        await service.reuploadLocalCovers();

        expect(ctx.mockCoverRepository.delete).toHaveBeenCalledWith(
          EXISTING_SERVER_FILE_ID,
        );
      });

      it("should mark goal as needsSync after updating cover_file_id", async () => {
        const goalWithCleanDirty = createGoalWithServerCover({
          needsSync: false,
        });
        ctx.mockGoalRepository = createMockGoalRepository({
          getActive: vi.fn().mockResolvedValue([goalWithCleanDirty]),
        });
        const service = ctx.createService();

        await service.reuploadLocalCovers();

        expect(ctx.mockGoalRepository.update).toHaveBeenCalledWith(
          expect.objectContaining({ needsSync: true }),
        );
      });

      it("should transfer localCoverCache entry", async () => {
        const originalUrl = "blob:http://localhost/cover-original";
        localCoverCache.set(EXISTING_SERVER_FILE_ID, originalUrl);
        const service = ctx.createService();

        await service.reuploadLocalCovers();

        expect(localCoverCache.get(NEW_SERVER_FILE_ID)).toBe(originalUrl);
        expect(localCoverCache.get(EXISTING_SERVER_FILE_ID)).toBeUndefined();
      });
    });
  });
});

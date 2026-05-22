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
          getByHash: vi
            .fn()
            .mockResolvedValueOnce(undefined) // first call: no record
            .mockResolvedValueOnce(createCoverRecord()), // second call: after cacheFromServer
        });
        ctx.mockSyncAdapter = createMockSyncAdapter({
          uploadCovers: vi.fn().mockResolvedValue({
            ok: true,
            results: [
              {
                data_hash: EXISTING_SERVER_FILE_ID,
                goal_id: "goal-reupload",
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
          getByHash: vi.fn().mockResolvedValue(undefined),
        });
        ctx.mockSyncAdapter = createMockSyncAdapter({
          getCover: createMockGetCoversSuccess(EXISTING_SERVER_FILE_ID),
        });
        const service = ctx.createService();

        await service.reuploadLocalCovers();

        expect(ctx.mockCoverRepository.save).toHaveBeenCalledWith(
          expect.objectContaining({
            data_hash: EXISTING_SERVER_FILE_ID,
            data: expect.any(Blob),
          }),
        );
      });

      it("should skip cover gracefully when getCover fails", async () => {
        ctx.mockCoverRepository = createMockCoverRepository({
          getByHash: vi.fn().mockResolvedValue(undefined),
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

    describe("when server confirms upload (reused: false)", () => {
      let coverRecord: ReturnType<typeof createCoverRecord>;

      beforeEach(() => {
        coverRecord = createCoverRecord();
        ctx.mockCoverRepository = createMockCoverRepository({
          getByHash: vi.fn().mockResolvedValue(coverRecord),
        });
        ctx.mockSyncAdapter = createMockSyncAdapter({
          uploadCovers: vi.fn().mockResolvedValue({
            ok: true,
            results: [
              {
                data_hash: coverRecord.data_hash,
                goal_id: "goal-reupload",
                reused: false,
              },
            ],
          }),
        });
      });

      it("should save CoverRecord with blob data", async () => {
        const service = ctx.createService();

        await service.reuploadLocalCovers();

        expect(ctx.mockCoverRepository.save).toHaveBeenCalledWith(
          expect.objectContaining({
            data_hash: coverRecord.data_hash,
            data: coverRecord.data,
          }),
        );
      });

      it("should not update goal (cover_hash is content-addressable, unchanged)", async () => {
        const service = ctx.createService();

        await service.reuploadLocalCovers();

        expect(ctx.mockGoalRepository.update).not.toHaveBeenCalled();
      });
    });
  });
});

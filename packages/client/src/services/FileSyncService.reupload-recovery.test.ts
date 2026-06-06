import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createFileRecord,
  createGoalWithServerFile,
  createMockFileRepository,
  createMockGetFilesNotFound,
  createMockGetFilesSuccess,
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

    describe("when file has no local blob — fetch from server via get_file API", () => {
      beforeEach(() => {
        ctx.mockGoalRepository = createMockGoalRepository({
          getActive: vi.fn().mockResolvedValue([createGoalWithServerFile()]),
        });
        ctx.mockFileRepository = createMockFileRepository({
          getByHash: vi
            .fn()
            .mockResolvedValueOnce(undefined) // first call: no record
            .mockResolvedValueOnce(createFileRecord()), // second call: after cacheFromServer
        });
        ctx.mockSyncAdapter = createMockSyncAdapter({
          uploadFiles: vi.fn().mockResolvedValue({
            ok: true,
            results: [
              {
                data_hash: EXISTING_SERVER_FILE_ID,
                goal_id: "goal-reupload",
                reused: true,
              },
            ],
          }),
          getFile: createMockGetFilesSuccess(EXISTING_SERVER_FILE_ID),
        });
      });

      it("should call uploadFiles when getFile fetch succeeds", async () => {
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

      it("should save fetched blob to fileRepository", async () => {
        ctx.mockFileRepository = createMockFileRepository({
          getByHash: vi.fn().mockResolvedValue(undefined),
        });
        ctx.mockSyncAdapter = createMockSyncAdapter({
          getFile: createMockGetFilesSuccess(EXISTING_SERVER_FILE_ID),
        });
        const service = ctx.createService();

        await service.reuploadLocalFiles();

        expect(ctx.mockFileRepository.save).toHaveBeenCalledWith(
          expect.objectContaining({
            data_hash: EXISTING_SERVER_FILE_ID,
            data: expect.any(Blob),
          }),
        );
      });

      it("should skip file gracefully when getFile fails", async () => {
        ctx.mockFileRepository = createMockFileRepository({
          getByHash: vi.fn().mockResolvedValue(undefined),
        });
        ctx.mockSyncAdapter = createMockSyncAdapter({
          uploadFiles: vi.fn(),
          getFile: createMockGetFilesNotFound(EXISTING_SERVER_FILE_ID),
        });
        const service = ctx.createService();

        await service.reuploadLocalFiles();

        expect(ctx.mockSyncAdapter.uploadFiles).not.toHaveBeenCalled();
      });
    });

    describe("when server confirms upload (reused: false)", () => {
      let fileRecord: ReturnType<typeof createFileRecord>;

      beforeEach(() => {
        fileRecord = createFileRecord();
        ctx.mockFileRepository = createMockFileRepository({
          getByHash: vi.fn().mockResolvedValue(fileRecord),
        });
        ctx.mockSyncAdapter = createMockSyncAdapter({
          uploadFiles: vi.fn().mockResolvedValue({
            ok: true,
            results: [
              {
                data_hash: fileRecord.data_hash,
                goal_id: "goal-reupload",
                reused: false,
              },
            ],
          }),
        });
      });

      it("should save FileRecord with blob data", async () => {
        const service = ctx.createService();

        await service.reuploadLocalFiles();

        expect(ctx.mockFileRepository.save).toHaveBeenCalledWith(
          expect.objectContaining({
            data_hash: fileRecord.data_hash,
            data: fileRecord.data,
          }),
        );
      });

      it("should not update goal (cover_hash is content-addressable, unchanged)", async () => {
        const service = ctx.createService();

        await service.reuploadLocalFiles();

        expect(ctx.mockGoalRepository.update).not.toHaveBeenCalled();
      });
    });
  });
});

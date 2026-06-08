import { beforeEach, describe, expect, it, vi } from "vitest";
import { toISOTimestamp } from "@/utils/dateHelpers";
import {
  createMockFileRepository,
  createMockGetFilesNotFound,
  createMockGetFilesSuccess,
  createMockGoalRepository,
  createMockSyncAdapter,
  localFileCache,
  setupFileSyncTests,
} from "./FileSyncService-test-utils";

const REMOTE_HASH = "remote-file-id-abc";

function createActiveGoal(fileHash: string) {
  return {
    id: "goal-1",
    name: "Goal",
    description: "",
    cover_hash: fileHash,
    status: "in_progress" as const,
    sort_order: 0,
    is_deleted: false,
    created_at: toISOTimestamp(),
    updated_at: toISOTimestamp(),
  };
}

describe("FileSyncService", () => {
  const ctx = setupFileSyncTests();

  describe("fullSync — ensureServerFilesAreCached", () => {
    it("should skip goals with empty cover_hash", async () => {
      ctx.mockGoalRepository = createMockGoalRepository({
        getActive: vi.fn().mockResolvedValue([createActiveGoal("")]),
      });
      const service = ctx.createService();

      await service.fullSync();

      expect(ctx.mockFileRepository.getByHash).not.toHaveBeenCalled();
    });

    it("should skip file if already in localFileCache", async () => {
      localFileCache.set(REMOTE_HASH, "blob:http://localhost/cached");
      ctx.mockGoalRepository = createMockGoalRepository({
        getActive: vi.fn().mockResolvedValue([createActiveGoal(REMOTE_HASH)]),
      });
      const service = ctx.createService();

      await service.fullSync();

      expect(ctx.mockSyncAdapter.getFile).not.toHaveBeenCalled();
    });

    describe("when FileRecord with blob already exists in repository", () => {
      beforeEach(() => {
        const existingFile = {
          data_hash: REMOTE_HASH,
          data: new Blob(["img"], { type: "image/jpeg" }),
        };
        ctx.mockGoalRepository = createMockGoalRepository({
          getActive: vi.fn().mockResolvedValue([createActiveGoal(REMOTE_HASH)]),
        });
        ctx.mockFileRepository = createMockFileRepository({
          getByHash: vi.fn().mockResolvedValue(existingFile),
        });
      });

      it("should populate localFileCache from existing blob", async () => {
        const service = ctx.createService();

        await service.fullSync();

        expect(localFileCache.get(REMOTE_HASH)).toBeDefined();
      });

      it("should not call getFile when blob exists in IndexedDB", async () => {
        const service = ctx.createService();

        await service.fullSync();

        expect(ctx.mockSyncAdapter.getFile).not.toHaveBeenCalled();
      });
    });

    describe("when FileRecord is missing from repository", () => {
      beforeEach(() => {
        ctx.mockGoalRepository = createMockGoalRepository({
          getActive: vi.fn().mockResolvedValue([createActiveGoal(REMOTE_HASH)]),
        });
        ctx.mockFileRepository = createMockFileRepository({
          getByHash: vi.fn().mockResolvedValue(undefined),
        });
      });

      it("should call getFile API to fetch file", async () => {
        ctx.mockSyncAdapter = createMockSyncAdapter({
          getFile: createMockGetFilesSuccess(REMOTE_HASH),
        });
        const service = ctx.createService();

        await service.fullSync();

        expect(ctx.mockSyncAdapter.getFile).toHaveBeenCalled();
      });

      it("should save downloaded blob to fileRepository when getFile succeeds", async () => {
        ctx.mockSyncAdapter = createMockSyncAdapter({
          getFile: createMockGetFilesSuccess(REMOTE_HASH),
        });
        const service = ctx.createService();

        await service.fullSync();

        expect(ctx.mockFileRepository.save).toHaveBeenCalledWith(
          expect.objectContaining({
            data_hash: REMOTE_HASH,
            data: expect.any(Blob),
          }),
        );
      });

      it("should add file to localFileCache after successful download", async () => {
        ctx.mockSyncAdapter = createMockSyncAdapter({
          getFile: createMockGetFilesSuccess(REMOTE_HASH),
        });
        const service = ctx.createService();

        await service.fullSync();

        expect(localFileCache.get(REMOTE_HASH)).toBeDefined();
      });

      it("should not save to fileRepository when getFile fails", async () => {
        ctx.mockSyncAdapter = createMockSyncAdapter({
          getFile: vi.fn().mockRejectedValue(new Error("Network error")),
        });
        const service = ctx.createService();

        await service.fullSync();

        expect(ctx.mockFileRepository.save).not.toHaveBeenCalled();
      });

      it("should not add file to localFileCache when getFile fails", async () => {
        ctx.mockSyncAdapter = createMockSyncAdapter({
          getFile: vi.fn().mockRejectedValue(new Error("Network error")),
        });
        const service = ctx.createService();

        await service.fullSync();

        expect(localFileCache.get(REMOTE_HASH)).toBeUndefined();
      });

      it("should not save to fileRepository when getFile returns FILE_NOT_FOUND", async () => {
        ctx.mockSyncAdapter = createMockSyncAdapter({
          getFile: createMockGetFilesNotFound(REMOTE_HASH),
        });
        const service = ctx.createService();

        await service.fullSync();

        expect(ctx.mockFileRepository.save).not.toHaveBeenCalled();
      });
    });
  });
});

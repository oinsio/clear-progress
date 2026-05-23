import { beforeEach, describe, expect, it, vi } from "vitest";
import { toISOTimestamp } from "@/utils/dateHelpers";
import {
  createMockCoverRepository,
  createMockGetCoversNotFound,
  createMockGetCoversSuccess,
  createMockGoalRepository,
  createMockSyncAdapter,
  localCoverCache,
  setupCoverSyncTests,
} from "./CoverSyncService-test-utils";

const REMOTE_HASH = "remote-file-id-abc";

function createActiveGoal(coverHash: string) {
  return {
    id: "goal-1",
    name: "Goal",
    description: "",
    cover_hash: coverHash,
    status: "in_progress" as const,
    sort_order: 0,
    is_deleted: false,
    created_at: toISOTimestamp(),
    updated_at: toISOTimestamp(),
  };
}

describe("CoverSyncService", () => {
  const ctx = setupCoverSyncTests();

  describe("fullSync — ensureServerCoversAreCached", () => {
    it("should skip goals with empty cover_hash", async () => {
      ctx.mockGoalRepository = createMockGoalRepository({
        getActive: vi.fn().mockResolvedValue([createActiveGoal("")]),
      });
      const service = ctx.createService();

      await service.fullSync();

      expect(ctx.mockCoverRepository.getByHash).not.toHaveBeenCalled();
    });

    it("should skip cover if already in localCoverCache", async () => {
      localCoverCache.set(REMOTE_HASH, "blob:http://localhost/cached");
      ctx.mockGoalRepository = createMockGoalRepository({
        getActive: vi.fn().mockResolvedValue([createActiveGoal(REMOTE_HASH)]),
      });
      const service = ctx.createService();

      await service.fullSync();

      expect(ctx.mockSyncAdapter.getCover).not.toHaveBeenCalled();
    });

    describe("when CoverRecord with blob already exists in repository", () => {
      beforeEach(() => {
        const existingCover = {
          data_hash: REMOTE_HASH,
          data: new Blob(["img"], { type: "image/jpeg" }),
        };
        ctx.mockGoalRepository = createMockGoalRepository({
          getActive: vi.fn().mockResolvedValue([createActiveGoal(REMOTE_HASH)]),
        });
        ctx.mockCoverRepository = createMockCoverRepository({
          getByHash: vi.fn().mockResolvedValue(existingCover),
        });
      });

      it("should populate localCoverCache from existing blob", async () => {
        const service = ctx.createService();

        await service.fullSync();

        expect(localCoverCache.get(REMOTE_HASH)).toBeDefined();
      });

      it("should not call getCover when blob exists in IndexedDB", async () => {
        const service = ctx.createService();

        await service.fullSync();

        expect(ctx.mockSyncAdapter.getCover).not.toHaveBeenCalled();
      });
    });

    describe("when CoverRecord is missing from repository", () => {
      beforeEach(() => {
        ctx.mockGoalRepository = createMockGoalRepository({
          getActive: vi.fn().mockResolvedValue([createActiveGoal(REMOTE_HASH)]),
        });
        ctx.mockCoverRepository = createMockCoverRepository({
          getByHash: vi.fn().mockResolvedValue(undefined),
        });
      });

      it("should call getCover API to fetch cover", async () => {
        ctx.mockSyncAdapter = createMockSyncAdapter({
          getCover: createMockGetCoversSuccess(REMOTE_HASH),
        });
        const service = ctx.createService();

        await service.fullSync();

        expect(ctx.mockSyncAdapter.getCover).toHaveBeenCalled();
      });

      it("should save downloaded blob to coverRepository when getCover succeeds", async () => {
        ctx.mockSyncAdapter = createMockSyncAdapter({
          getCover: createMockGetCoversSuccess(REMOTE_HASH),
        });
        const service = ctx.createService();

        await service.fullSync();

        expect(ctx.mockCoverRepository.save).toHaveBeenCalledWith(
          expect.objectContaining({
            data_hash: REMOTE_HASH,
            data: expect.any(Blob),
          }),
        );
      });

      it("should add cover to localCoverCache after successful download", async () => {
        ctx.mockSyncAdapter = createMockSyncAdapter({
          getCover: createMockGetCoversSuccess(REMOTE_HASH),
        });
        const service = ctx.createService();

        await service.fullSync();

        expect(localCoverCache.get(REMOTE_HASH)).toBeDefined();
      });

      it("should not save to coverRepository when getCover fails", async () => {
        ctx.mockSyncAdapter = createMockSyncAdapter({
          getCover: vi.fn().mockRejectedValue(new Error("Network error")),
        });
        const service = ctx.createService();

        await service.fullSync();

        expect(ctx.mockCoverRepository.save).not.toHaveBeenCalled();
      });

      it("should not add cover to localCoverCache when getCover fails", async () => {
        ctx.mockSyncAdapter = createMockSyncAdapter({
          getCover: vi.fn().mockRejectedValue(new Error("Network error")),
        });
        const service = ctx.createService();

        await service.fullSync();

        expect(localCoverCache.get(REMOTE_HASH)).toBeUndefined();
      });

      it("should not save to coverRepository when getCover returns FILE_NOT_FOUND", async () => {
        ctx.mockSyncAdapter = createMockSyncAdapter({
          getCover: createMockGetCoversNotFound(REMOTE_HASH),
        });
        const service = ctx.createService();

        await service.fullSync();

        expect(ctx.mockCoverRepository.save).not.toHaveBeenCalled();
      });
    });
  });
});

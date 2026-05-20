import { describe, expect, it, vi } from "vitest";
import { LOCAL_COVER_ID_PREFIX, MAX_COVER_BATCH_SIZE } from "@/constants";
import {
  createGoalWithCover,
  createMockGoalRepository,
  createMockPendingCoverRepository,
  createMockSyncAdapter,
  createPendingCover,
  localCoverCache,
  setupCoverSyncTests,
} from "./CoverSyncService-test-utils";

describe("CoverSyncService", () => {
  const ctx = setupCoverSyncTests();

  describe("sync", () => {
    it("should upload pending covers and update goal cover_file_id", async () => {
      const pendingCover = createPendingCover();
      const localFileId = `${LOCAL_COVER_ID_PREFIX}${pendingCover.local_id}`;
      const matchingGoal = createGoalWithCover(
        pendingCover.goal_id,
        localFileId,
      );
      ctx.mockPendingCoverRepository = createMockPendingCoverRepository({
        getAll: vi.fn().mockResolvedValue([pendingCover]),
      });
      ctx.mockGoalRepository = createMockGoalRepository({
        getActive: vi.fn().mockResolvedValue([matchingGoal]),
      });
      const service = ctx.createService();

      await service.sync();

      expect(ctx.mockGoalRepository.update).toHaveBeenCalledWith(
        expect.objectContaining({
          cover_file_id: "uploaded-file-id",
        }),
      );
    });

    it("should delete pending cover after upload", async () => {
      const pendingCover = createPendingCover({ local_id: "to-delete-id" });
      ctx.mockPendingCoverRepository = createMockPendingCoverRepository({
        getAll: vi.fn().mockResolvedValue([pendingCover]),
      });
      const service = ctx.createService();

      await service.sync();

      expect(ctx.mockPendingCoverRepository.delete).toHaveBeenCalledWith(
        "to-delete-id",
      );
    });

    it("should remove local: mapping from cache after upload", async () => {
      const pendingCover = createPendingCover({ local_id: "revoke-local-id" });
      localCoverCache.set("revoke-local-id", "blob:http://localhost/revoke");
      ctx.mockPendingCoverRepository = createMockPendingCoverRepository({
        getAll: vi.fn().mockResolvedValue([pendingCover]),
      });
      const service = ctx.createService();

      await service.sync();

      expect(localCoverCache.get("revoke-local-id")).toBeUndefined();
    });

    it("should transfer object URL to real file_id in cache after upload", async () => {
      const pendingCover = createPendingCover({
        local_id: "transfer-local-id",
      });
      const originalUrl = "blob:http://localhost/original";
      localCoverCache.set("transfer-local-id", originalUrl);
      ctx.mockPendingCoverRepository = createMockPendingCoverRepository({
        getAll: vi.fn().mockResolvedValue([pendingCover]),
      });
      const service = ctx.createService();

      await service.sync();

      expect(localCoverCache.get("uploaded-file-id")).toBe(originalUrl);
    });

    it("should save cover blob data and hash to coverRepository after upload", async () => {
      const pendingCover = createPendingCover();
      ctx.mockPendingCoverRepository = createMockPendingCoverRepository({
        getAll: vi.fn().mockResolvedValue([pendingCover]),
      });
      const service = ctx.createService();

      await service.sync();

      expect(ctx.mockCoverRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          file_id: "uploaded-file-id",
          data: pendingCover.data,
          data_hash: pendingCover.data_hash,
        }),
      );
    });

    it("should stop on first API failure (uploadCovers throws)", async () => {
      const pendingCovers = Array.from(
        { length: MAX_COVER_BATCH_SIZE + 1 },
        (_, i) => createPendingCover({ local_id: `cover-id-${i}` }),
      );
      ctx.mockSyncAdapter = createMockSyncAdapter({
        uploadCovers: vi.fn().mockRejectedValue(new Error("Network error")),
      });
      ctx.mockPendingCoverRepository = createMockPendingCoverRepository({
        getAll: vi.fn().mockResolvedValue(pendingCovers),
      });
      const service = ctx.createService();

      await service.sync();

      expect(ctx.mockSyncAdapter.uploadCovers).toHaveBeenCalledTimes(1);
    });

    it("should skip per-item error and continue with remaining items in same chunk", async () => {
      const pendingCover1 = createPendingCover({
        local_id: "bad-id",
        goal_id: "bad-goal",
      });
      const pendingCover2 = createPendingCover({
        local_id: "ok-id",
        goal_id: "ok-goal",
      });
      ctx.mockSyncAdapter = createMockSyncAdapter({
        uploadCovers: vi.fn().mockResolvedValue({
          ok: true,
          results: [
            {
              local_id: "bad-id",
              goal_id: "bad-goal",
              error: "FILE_TOO_LARGE",
            },
            {
              local_id: "ok-id",
              goal_id: "ok-goal",
              file_id: "ok-file-id",
              reused: false,
            },
          ],
        }),
      });
      ctx.mockPendingCoverRepository = createMockPendingCoverRepository({
        getAll: vi.fn().mockResolvedValue([pendingCover1, pendingCover2]),
      });
      const service = ctx.createService();

      await service.sync();

      expect(ctx.mockPendingCoverRepository.delete).toHaveBeenCalledWith(
        "ok-id",
      );
      expect(ctx.mockPendingCoverRepository.delete).not.toHaveBeenCalledWith(
        "bad-id",
      );
    });

    it("should process covers in chunks of MAX_COVER_BATCH_SIZE", async () => {
      const pendingCovers = Array.from(
        { length: MAX_COVER_BATCH_SIZE + 1 },
        (_, i) => createPendingCover({ local_id: `cover-id-${i}` }),
      );
      ctx.mockPendingCoverRepository = createMockPendingCoverRepository({
        getAll: vi.fn().mockResolvedValue(pendingCovers),
      });
      const service = ctx.createService();

      await service.sync();

      expect(ctx.mockSyncAdapter.uploadCovers).toHaveBeenCalledTimes(2);
      const firstCallCovers = vi.mocked(ctx.mockSyncAdapter.uploadCovers).mock
        .calls[0][0];
      expect(firstCallCovers.covers.length).toBe(MAX_COVER_BATCH_SIZE);
    });

    it("should not update goal if cover_file_id no longer matches", async () => {
      const pendingCover = createPendingCover({ local_id: "changed-local-id" });
      const goalWithDifferentCover = createGoalWithCover(
        pendingCover.goal_id,
        "some-other-remote-file-id",
      );
      ctx.mockPendingCoverRepository = createMockPendingCoverRepository({
        getAll: vi.fn().mockResolvedValue([pendingCover]),
      });
      ctx.mockGoalRepository = createMockGoalRepository({
        getActive: vi.fn().mockResolvedValue([goalWithDifferentCover]),
      });
      const service = ctx.createService();

      await service.sync();

      expect(ctx.mockGoalRepository.update).not.toHaveBeenCalled();
    });

    it("should mark goal as needsSync after updating cover_file_id", async () => {
      const pendingCover = createPendingCover();
      const localFileId = `${LOCAL_COVER_ID_PREFIX}${pendingCover.local_id}`;
      const matchingGoal = createGoalWithCover(
        pendingCover.goal_id,
        localFileId,
        { needsSync: false },
      );
      ctx.mockPendingCoverRepository = createMockPendingCoverRepository({
        getAll: vi.fn().mockResolvedValue([pendingCover]),
      });
      ctx.mockGoalRepository = createMockGoalRepository({
        getActive: vi.fn().mockResolvedValue([matchingGoal]),
      });
      const service = ctx.createService();

      await service.sync();

      expect(ctx.mockGoalRepository.update).toHaveBeenCalledWith(
        expect.objectContaining({ needsSync: true }),
      );
    });

    // FR8: test deduplication handling (reused: true response)
    describe("when server returns reused: true (deduplication)", () => {
      function setupDeduplicationScenario(localId: string) {
        const pendingCover = createPendingCover({ local_id: localId });
        const localFileId = `${LOCAL_COVER_ID_PREFIX}${pendingCover.local_id}`;
        const existingServerId = "existing-server-file-id";
        const matchingGoal = createGoalWithCover(
          pendingCover.goal_id,
          localFileId,
        );
        ctx.mockPendingCoverRepository = createMockPendingCoverRepository({
          getAll: vi.fn().mockResolvedValue([pendingCover]),
        });
        ctx.mockGoalRepository = createMockGoalRepository({
          getActive: vi.fn().mockResolvedValue([matchingGoal]),
        });
        ctx.mockSyncAdapter = createMockSyncAdapter({
          uploadCovers: vi.fn().mockResolvedValue({
            ok: true,
            results: [
              {
                local_id: pendingCover.local_id,
                goal_id: pendingCover.goal_id,
                file_id: existingServerId,
                reused: true,
              },
            ],
          }),
        });
        return { pendingCover, existingServerId };
      }

      it("should update goal with existing file_id", async () => {
        const { existingServerId } =
          setupDeduplicationScenario("dedup-local-id");
        const service = ctx.createService();

        await service.sync();

        expect(ctx.mockGoalRepository.update).toHaveBeenCalledWith(
          expect.objectContaining({
            cover_file_id: existingServerId,
          }),
        );
      });

      it("should delete pending cover after deduplication", async () => {
        setupDeduplicationScenario("dedup-delete-id");
        const service = ctx.createService();

        await service.sync();

        expect(ctx.mockPendingCoverRepository.delete).toHaveBeenCalledWith(
          "dedup-delete-id",
        );
      });
    });

    it("should update all goals that share the same local cover file_id", async () => {
      const pendingCover = createPendingCover({ local_id: "shared-local-id" });
      const localFileId = `${LOCAL_COVER_ID_PREFIX}shared-local-id`;

      const goal1 = createGoalWithCover("goal-shared-1", localFileId);
      const goal2 = createGoalWithCover("goal-shared-2", localFileId);
      const goalOther = createGoalWithCover("goal-other", "other-file-id");

      ctx.mockPendingCoverRepository = createMockPendingCoverRepository({
        getAll: vi.fn().mockResolvedValue([pendingCover]),
      });
      ctx.mockGoalRepository = createMockGoalRepository({
        getActive: vi.fn().mockResolvedValue([goal1, goal2, goalOther]),
      });
      const service = ctx.createService();

      await service.sync();

      expect(ctx.mockGoalRepository.update).toHaveBeenCalledTimes(2);
      expect(ctx.mockGoalRepository.update).toHaveBeenCalledWith(
        expect.objectContaining({
          id: "goal-shared-1",
          cover_file_id: "uploaded-file-id",
        }),
      );
      expect(ctx.mockGoalRepository.update).toHaveBeenCalledWith(
        expect.objectContaining({
          id: "goal-shared-2",
          cover_file_id: "uploaded-file-id",
        }),
      );
    });
  });
});

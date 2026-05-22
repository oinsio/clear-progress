import { describe, expect, it, vi } from "vitest";
import { MAX_COVER_BATCH_SIZE } from "@/constants";
import {
  createMockPendingCoverRepository,
  createMockSyncAdapter,
  createPendingCover,
  setupCoverSyncTests,
} from "./CoverSyncService-test-utils";

describe("CoverSyncService", () => {
  const ctx = setupCoverSyncTests();

  describe("sync", () => {
    it("should delete pending cover after successful upload", async () => {
      const pendingCover = createPendingCover({ data_hash: "hash-to-delete" });
      ctx.mockPendingCoverRepository = createMockPendingCoverRepository({
        getAll: vi.fn().mockResolvedValue([pendingCover]),
      });
      ctx.mockSyncAdapter = createMockSyncAdapter({
        uploadCovers: vi.fn().mockResolvedValue({
          ok: true,
          results: [{ data_hash: "hash-to-delete", reused: false }],
        }),
      });
      const service = ctx.createService();

      await service.sync();

      expect(ctx.mockPendingCoverRepository.delete).toHaveBeenCalledWith(
        "hash-to-delete",
      );
    });

    it("should save cover blob data and hash to coverRepository after upload", async () => {
      const pendingCover = createPendingCover({ data_hash: "hash-upload" });
      ctx.mockPendingCoverRepository = createMockPendingCoverRepository({
        getAll: vi.fn().mockResolvedValue([pendingCover]),
      });
      ctx.mockSyncAdapter = createMockSyncAdapter({
        uploadCovers: vi.fn().mockResolvedValue({
          ok: true,
          results: [{ data_hash: "hash-upload", reused: false }],
        }),
      });
      const service = ctx.createService();

      await service.sync();

      expect(ctx.mockCoverRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          data_hash: "hash-upload",
          data: pendingCover.data,
        }),
      );
    });

    it("should not save to coverRepository when server returns reused: true", async () => {
      const pendingCover = createPendingCover({ data_hash: "hash-reused" });
      ctx.mockPendingCoverRepository = createMockPendingCoverRepository({
        getAll: vi.fn().mockResolvedValue([pendingCover]),
      });
      ctx.mockSyncAdapter = createMockSyncAdapter({
        uploadCovers: vi.fn().mockResolvedValue({
          ok: true,
          results: [{ data_hash: "hash-reused", reused: true }],
        }),
      });
      const service = ctx.createService();

      await service.sync();

      expect(ctx.mockCoverRepository.save).not.toHaveBeenCalled();
    });

    it("should delete pending cover after deduplication (reused: true)", async () => {
      const pendingCover = createPendingCover({ data_hash: "hash-dedup" });
      ctx.mockPendingCoverRepository = createMockPendingCoverRepository({
        getAll: vi.fn().mockResolvedValue([pendingCover]),
      });
      ctx.mockSyncAdapter = createMockSyncAdapter({
        uploadCovers: vi.fn().mockResolvedValue({
          ok: true,
          results: [{ data_hash: "hash-dedup", reused: true }],
        }),
      });
      const service = ctx.createService();

      await service.sync();

      expect(ctx.mockPendingCoverRepository.delete).toHaveBeenCalledWith(
        "hash-dedup",
      );
    });

    it("should stop on first API failure (uploadCovers throws)", async () => {
      const pendingCovers = Array.from(
        { length: MAX_COVER_BATCH_SIZE + 1 },
        (_, i) => createPendingCover({ data_hash: `hash-${i}` }),
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
        data_hash: "hash-bad",
        goal_id: "bad-goal",
      });
      const pendingCover2 = createPendingCover({
        data_hash: "hash-ok",
        goal_id: "ok-goal",
      });
      ctx.mockSyncAdapter = createMockSyncAdapter({
        uploadCovers: vi.fn().mockResolvedValue({
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
      ctx.mockPendingCoverRepository = createMockPendingCoverRepository({
        getAll: vi.fn().mockResolvedValue([pendingCover1, pendingCover2]),
      });
      const service = ctx.createService();

      await service.sync();

      expect(ctx.mockPendingCoverRepository.delete).toHaveBeenCalledWith(
        "hash-ok",
      );
      expect(ctx.mockPendingCoverRepository.delete).not.toHaveBeenCalledWith(
        "hash-bad",
      );
    });

    it("should process covers in chunks of MAX_COVER_BATCH_SIZE", async () => {
      const pendingCovers = Array.from(
        { length: MAX_COVER_BATCH_SIZE + 1 },
        (_, i) => createPendingCover({ data_hash: `hash-${i}` }),
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
  });
});

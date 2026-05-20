import { describe, expect, it, vi } from "vitest";
import {
  createMockCoverRepository,
  createMockGetCoversSuccess,
  createMockSyncAdapter,
  localCoverCache,
  setupCoverSyncTests,
} from "./CoverSyncService-test-utils";

const FILE_ID = "cover-file-id-xyz";

describe("CoverSyncService", () => {
  const ctx = setupCoverSyncTests();

  describe("ensureCoverCached", () => {
    it("should skip if cover is already in localCoverCache", async () => {
      localCoverCache.set(FILE_ID, "blob:http://localhost/cached");
      const service = ctx.createService();

      await service.ensureCoverCached(FILE_ID);

      expect(ctx.mockCoverRepository.getByFileId).not.toHaveBeenCalled();
    });

    it("should create object URL from existing IndexedDB blob without calling getCover", async () => {
      const existingBlob = new Blob(["img"], { type: "image/jpeg" });
      ctx.mockCoverRepository = createMockCoverRepository({
        getByFileId: vi.fn().mockResolvedValue({
          file_id: FILE_ID,
          data_hash: "hash-abc",
          data: existingBlob,
        }),
      });
      const service = ctx.createService();

      await service.ensureCoverCached(FILE_ID);

      expect(ctx.mockSyncAdapter.getCover).not.toHaveBeenCalled();
      expect(localCoverCache.get(FILE_ID)).toBeDefined();
    });

    it("should call getCover API and store in IndexedDB when blob is absent", async () => {
      ctx.mockSyncAdapter = createMockSyncAdapter({
        getCover: createMockGetCoversSuccess(FILE_ID),
      });
      ctx.mockCoverRepository = createMockCoverRepository({
        getByFileId: vi.fn().mockResolvedValue(undefined),
      });
      const service = ctx.createService();

      await service.ensureCoverCached(FILE_ID);

      expect(ctx.mockCoverRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ file_id: FILE_ID, data: expect.any(Blob) }),
      );
    });

    it("should add cover to localCoverCache after successful fetch from server", async () => {
      ctx.mockSyncAdapter = createMockSyncAdapter({
        getCover: createMockGetCoversSuccess(FILE_ID),
      });
      ctx.mockCoverRepository = createMockCoverRepository({
        getByFileId: vi.fn().mockResolvedValue(undefined),
      });
      const service = ctx.createService();

      await service.ensureCoverCached(FILE_ID);

      expect(localCoverCache.get(FILE_ID)).toBeDefined();
    });

    it("should not add to localCoverCache when getCover fails", async () => {
      ctx.mockSyncAdapter = createMockSyncAdapter({
        getCover: vi.fn().mockRejectedValue(new Error("Network error")),
      });
      ctx.mockCoverRepository = createMockCoverRepository({
        getByFileId: vi.fn().mockResolvedValue(undefined),
      });
      const service = ctx.createService();

      await service.ensureCoverCached(FILE_ID);

      expect(localCoverCache.get(FILE_ID)).toBeUndefined();
    });

    it("should not save to coverRepository when blob already exists in IndexedDB", async () => {
      ctx.mockCoverRepository = createMockCoverRepository({
        getByFileId: vi.fn().mockResolvedValue({
          file_id: FILE_ID,
          data_hash: "hash-abc",
          data: new Blob(["img"], { type: "image/jpeg" }),
        }),
      });
      const service = ctx.createService();

      await service.ensureCoverCached(FILE_ID);

      expect(ctx.mockCoverRepository.save).not.toHaveBeenCalled();
    });

    it("should make exactly one getCover call when called concurrently with the same fileId", async () => {
      ctx.mockSyncAdapter = createMockSyncAdapter({
        getCover: createMockGetCoversSuccess(FILE_ID),
      });
      ctx.mockCoverRepository = createMockCoverRepository({
        getByFileId: vi.fn().mockResolvedValue(undefined),
      });
      const service = ctx.createService();

      await Promise.all([
        service.ensureCoverCached(FILE_ID),
        service.ensureCoverCached(FILE_ID),
        service.ensureCoverCached(FILE_ID),
      ]);

      expect(ctx.mockSyncAdapter.getCover).toHaveBeenCalledTimes(1);
    });
  });
});

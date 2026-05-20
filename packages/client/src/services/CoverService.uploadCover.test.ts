import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MAX_COVER_SIZE_BYTES } from "@/constants";
import { toISOTimestamp } from "@/utils/dateHelpers";
import { CoverService } from "./CoverService";
import {
  type CoverServiceMocks,
  createCoverServiceMocks,
  createImageFile,
  createMockCoverRepository,
  createMockPendingCoverRepository,
  createMockSyncAdapter,
} from "./CoverService.test-utils";
import { localCoverCache } from "./LocalCoverCache";

describe("CoverService — uploadCover", () => {
  let mocks: CoverServiceMocks;

  beforeEach(() => {
    mocks = createCoverServiceMocks();
  });

  afterEach(() => {
    localCoverCache.clear();
  });

  function createService(overrides?: Partial<CoverServiceMocks>) {
    const { mockSyncAdapter, mockCoverRepository, mockPendingCoverRepository } =
      { ...mocks, ...overrides };
    return new CoverService(
      mockSyncAdapter,
      mockCoverRepository,
      mockPendingCoverRepository,
    );
  }

  it("should throw INVALID_TYPE if file is not an image", async () => {
    const service = createService();
    const file = createImageFile({ type: "application/pdf" });
    await expect(service.uploadCover(file, "goal-1")).rejects.toThrow(
      "INVALID_TYPE",
    );
  });

  it("should throw FILE_TOO_LARGE if file exceeds MAX_COVER_SIZE_BYTES", async () => {
    const service = createService();
    const file = createImageFile({ size: MAX_COVER_SIZE_BYTES + 1 });
    await expect(service.uploadCover(file, "goal-1")).rejects.toThrow(
      "FILE_TOO_LARGE",
    );
  });

  it("should return cached cover without API call if same hash exists in DB", async () => {
    const cached = { file_id: "cached-id", data_hash: "any-hash" };
    const mockCoverRepository = createMockCoverRepository({
      getByHash: vi.fn().mockResolvedValue(cached),
    });
    const service = createService({ mockCoverRepository });

    const result = await service.uploadCover(createImageFile(), "goal-1");

    expect(result.file_id).toBe("cached-id");
    expect(mocks.mockSyncAdapter.uploadCover).not.toHaveBeenCalled();
  });

  it("should call API when no cached cover exists for the hash", async () => {
    const service = createService();

    await service.uploadCover(createImageFile(), "goal-1");

    expect(mocks.mockSyncAdapter.uploadCover).toHaveBeenCalledWith(
      expect.objectContaining({
        goal_id: "goal-1",
        filename: "cover.jpg",
        mime_type: "image/jpeg",
        data: expect.any(String),
      }),
    );
  });

  it("should save cover record to DB after successful upload", async () => {
    const service = createService();

    await service.uploadCover(createImageFile(), "goal-1");

    expect(mocks.mockCoverRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        file_id: "new-file-id",
        data_hash: expect.any(String),
      }),
    );
  });

  it("should save blob data to cover record after successful online upload", async () => {
    const service = createService();

    await service.uploadCover(createImageFile(), "goal-1");

    expect(mocks.mockCoverRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.any(Blob),
      }),
    );
  });

  it("should add blob URL to localCoverCache after successful online upload", async () => {
    const service = createService();

    await service.uploadCover(createImageFile(), "goal-1");

    expect(localCoverCache.get("new-file-id")).toBeDefined();
  });

  it("should return file_id from API response", async () => {
    const service = createService();

    const result = await service.uploadCover(createImageFile(), "goal-1");

    expect(result.file_id).toBe("new-file-id");
  });

  it("should not save to DB when reusing cached cover", async () => {
    const cached = { file_id: "cached-id", data_hash: "any-hash" };
    const mockCoverRepository = createMockCoverRepository({
      getByHash: vi.fn().mockResolvedValue(cached),
    });
    const service = createService({ mockCoverRepository });

    await service.uploadCover(createImageFile(), "goal-1");

    expect(mockCoverRepository.save).not.toHaveBeenCalled();
  });

  it("should save locally when API fails with network error", async () => {
    const mockSyncAdapter = createMockSyncAdapter({
      uploadCover: vi.fn().mockRejectedValue(new Error("Network error")),
    });
    const service = createService({ mockSyncAdapter });

    await service.uploadCover(createImageFile(), "goal-1");

    expect(mocks.mockPendingCoverRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        goal_id: "goal-1",
        filename: "cover.jpg",
        mime_type: "image/jpeg",
        data_hash: expect.any(String),
      }),
    );
  });

  it("should return local:* file_id when saved locally", async () => {
    const mockSyncAdapter = createMockSyncAdapter({
      uploadCover: vi.fn().mockRejectedValue(new Error("Network error")),
    });
    const service = createService({ mockSyncAdapter });

    const result = await service.uploadCover(createImageFile(), "goal-1");

    expect(result.file_id).toMatch(/^local:/);
  });

  it("should not save locally for INVALID_TYPE error", async () => {
    const service = createService();
    const file = createImageFile({ type: "application/pdf" });

    await expect(service.uploadCover(file, "goal-1")).rejects.toThrow(
      "INVALID_TYPE",
    );

    expect(mocks.mockPendingCoverRepository.save).not.toHaveBeenCalled();
  });

  it("should not save locally for FILE_TOO_LARGE error", async () => {
    const service = createService();
    const file = createImageFile({ size: MAX_COVER_SIZE_BYTES + 1 });

    await expect(service.uploadCover(file, "goal-1")).rejects.toThrow(
      "FILE_TOO_LARGE",
    );

    expect(mocks.mockPendingCoverRepository.save).not.toHaveBeenCalled();
  });

  it("should return existing local cover when same hash in pendingCoverRepository", async () => {
    const existingLocalId = "existing-local-uuid";
    const existingObjectUrl = "blob:http://localhost/existing";
    localCoverCache.set(existingLocalId, existingObjectUrl);
    const mockPendingCoverRepository = createMockPendingCoverRepository({
      getByHash: vi.fn().mockResolvedValue({
        local_id: existingLocalId,
        goal_id: "goal-1",
        data: new Blob(["fake"]),
        filename: "cover.jpg",
        mime_type: "image/jpeg",
        data_hash: "some-hash",
        created_at: toISOTimestamp(),
      }),
    });
    const service = createService({ mockPendingCoverRepository });

    const result = await service.uploadCover(createImageFile(), "goal-1");

    expect(result.file_id).toBe(`local:${existingLocalId}`);
    expect(mocks.mockSyncAdapter.uploadCover).not.toHaveBeenCalled();
  });
});

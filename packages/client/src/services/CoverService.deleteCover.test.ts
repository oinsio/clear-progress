import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CoverService } from "./CoverService";
import {
  type CoverServiceMocks,
  createCoverServiceMocks,
  createMockPendingCoverRepository,
  createMockSyncAdapter,
} from "./CoverService.test-utils";
import { localCoverCache } from "./LocalCoverCache";

describe("CoverService — deleteCover", () => {
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

  it("should call API deleteCover with the hash", async () => {
    const service = createService();

    await service.deleteCover("hash-abc", "goal-1");

    expect(mocks.mockSyncAdapter.deleteCover).toHaveBeenCalledWith({
      hash: "hash-abc",
      goal_id: "goal-1",
    });
  });

  it("should remove local record from DB when backend confirms deletion", async () => {
    const service = createService();

    await service.deleteCover("hash-abc", "goal-1");

    expect(mocks.mockCoverRepository.delete).toHaveBeenCalledWith("hash-abc");
  });

  it("should keep local record when backend says not deleted (ref_count > 0)", async () => {
    const mockSyncAdapter = createMockSyncAdapter({
      deleteCover: vi.fn().mockResolvedValue({ deleted: false, ref_count: 2 }),
    });
    const service = createService({ mockSyncAdapter });

    await service.deleteCover("hash-abc", "goal-1");

    expect(mocks.mockCoverRepository.delete).not.toHaveBeenCalled();
  });

  it("should remove cover URL from localCoverCache when backend confirms deletion", async () => {
    localCoverCache.set("hash-abc", "blob:http://localhost/abc");
    const service = createService();

    await service.deleteCover("hash-abc", "goal-1");

    expect(localCoverCache.get("hash-abc")).toBeUndefined();
  });

  it("should not remove cover from localCoverCache when backend says not deleted", async () => {
    localCoverCache.set("hash-abc", "blob:http://localhost/abc");
    const mockSyncAdapter = createMockSyncAdapter({
      deleteCover: vi.fn().mockResolvedValue({ deleted: false, ref_count: 2 }),
    });
    const service = createService({ mockSyncAdapter });

    await service.deleteCover("hash-abc", "goal-1");

    expect(localCoverCache.get("hash-abc")).toBeDefined();
  });

  it("should delete pending cover from pendingCoverRepository when pending cover exists for hash", async () => {
    const mockPendingCoverRepository = createMockPendingCoverRepository({
      getByHash: vi.fn().mockResolvedValue({
        goal_id: "goal-1",
        data: new Blob(["fake"]),
        filename: "cover.jpg",
        mime_type: "image/jpeg",
        data_hash: "pending-hash",
        created_at: "2026-01-01T00:00:00.000Z" as never,
      }),
    });
    const service = createService({ mockPendingCoverRepository });

    await service.deleteCover("pending-hash", "goal-1");

    expect(mockPendingCoverRepository.delete).toHaveBeenCalledWith(
      "pending-hash",
    );
  });

  it("should not call API when pending cover exists for hash", async () => {
    const mockPendingCoverRepository = createMockPendingCoverRepository({
      getByHash: vi.fn().mockResolvedValue({
        goal_id: "goal-1",
        data: new Blob(["fake"]),
        filename: "cover.jpg",
        mime_type: "image/jpeg",
        data_hash: "pending-hash",
        created_at: "2026-01-01T00:00:00.000Z" as never,
      }),
    });
    const service = createService({ mockPendingCoverRepository });

    await service.deleteCover("pending-hash", "goal-1");

    expect(mocks.mockSyncAdapter.deleteCover).not.toHaveBeenCalled();
  });

  it("should remove cover from localCoverCache when pending cover exists for hash", async () => {
    localCoverCache.set("pending-hash", "blob:http://localhost/local");
    const mockPendingCoverRepository = createMockPendingCoverRepository({
      getByHash: vi.fn().mockResolvedValue({
        goal_id: "goal-1",
        data: new Blob(["fake"]),
        filename: "cover.jpg",
        mime_type: "image/jpeg",
        data_hash: "pending-hash",
        created_at: "2026-01-01T00:00:00.000Z" as never,
      }),
    });
    const service = createService({ mockPendingCoverRepository });

    await service.deleteCover("pending-hash", "goal-1");

    expect(localCoverCache.get("pending-hash")).toBeUndefined();
  });
});

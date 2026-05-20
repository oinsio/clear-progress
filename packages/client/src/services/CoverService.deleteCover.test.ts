import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CoverService } from "./CoverService";
import {
  type CoverServiceMocks,
  createCoverServiceMocks,
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

  it("should call API deleteCover with the file_id", async () => {
    const service = createService();

    await service.deleteCover("file-abc", "goal-1");

    expect(mocks.mockSyncAdapter.deleteCover).toHaveBeenCalledWith({
      file_id: "file-abc",
      goal_id: "goal-1",
    });
  });

  it("should remove local record from DB when backend confirms deletion", async () => {
    const service = createService();

    await service.deleteCover("file-abc", "goal-1");

    expect(mocks.mockCoverRepository.delete).toHaveBeenCalledWith("file-abc");
  });

  it("should keep local record when backend says not deleted (ref_count > 0)", async () => {
    const mockSyncAdapter = createMockSyncAdapter({
      deleteCover: vi.fn().mockResolvedValue({ deleted: false, ref_count: 2 }),
    });
    const service = createService({ mockSyncAdapter });

    await service.deleteCover("file-abc", "goal-1");

    expect(mocks.mockCoverRepository.delete).not.toHaveBeenCalled();
  });

  it("should remove cover URL from localCoverCache when backend confirms deletion", async () => {
    localCoverCache.set("file-abc", "blob:http://localhost/abc");
    const service = createService();

    await service.deleteCover("file-abc", "goal-1");

    expect(localCoverCache.get("file-abc")).toBeUndefined();
  });

  it("should not remove cover from localCoverCache when backend says not deleted", async () => {
    localCoverCache.set("file-abc", "blob:http://localhost/abc");
    const mockSyncAdapter = createMockSyncAdapter({
      deleteCover: vi.fn().mockResolvedValue({ deleted: false, ref_count: 2 }),
    });
    const service = createService({ mockSyncAdapter });

    await service.deleteCover("file-abc", "goal-1");

    expect(localCoverCache.get("file-abc")).toBeDefined();
  });

  it("should delete pending cover from pendingCoverRepository when file_id starts with local:", async () => {
    const service = createService();

    await service.deleteCover("local:some-local-uuid", "goal-1");

    expect(mocks.mockPendingCoverRepository.delete).toHaveBeenCalledWith(
      "some-local-uuid",
    );
  });

  it("should not call API when file_id starts with local:", async () => {
    const service = createService();

    await service.deleteCover("local:some-local-uuid", "goal-1");

    expect(mocks.mockSyncAdapter.deleteCover).not.toHaveBeenCalled();
  });

  it("should remove local cover from localCoverCache when file_id starts with local:", async () => {
    localCoverCache.set("some-local-uuid", "blob:http://localhost/local");
    const service = createService();

    await service.deleteCover("local:some-local-uuid", "goal-1");

    expect(localCoverCache.get("some-local-uuid")).toBeUndefined();
  });
});

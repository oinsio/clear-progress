import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { FileService } from "./FileService";
import {
  createFileServiceMocks,
  createMockPendingFileRepository,
  createMockSyncAdapter,
  type FileServiceMocks,
} from "./FileService.test-utils";
import { localFileCache } from "./LocalFileCache";

describe("FileService — deleteCover", () => {
  let mocks: FileServiceMocks;

  beforeEach(() => {
    mocks = createFileServiceMocks();
  });

  afterEach(() => {
    localFileCache.clear();
  });

  function createService(overrides?: Partial<FileServiceMocks>) {
    const { mockSyncAdapter, mockFileRepository, mockPendingFileRepository } = {
      ...mocks,
      ...overrides,
    };
    return new FileService(
      mockSyncAdapter,
      mockFileRepository,
      mockPendingFileRepository,
    );
  }

  it("should call API deleteCover with the hash", async () => {
    const service = createService();

    await service.deleteFile("hash-abc", "goal-1");

    expect(mocks.mockSyncAdapter.deleteFile).toHaveBeenCalledWith({
      hash: "hash-abc",
    });
  });

  it("should remove local record from DB when backend confirms deletion", async () => {
    const service = createService();

    await service.deleteFile("hash-abc", "goal-1");

    expect(mocks.mockFileRepository.delete).toHaveBeenCalledWith("hash-abc");
  });

  it("should keep local record when backend says not deleted (ref_count > 0)", async () => {
    const mockSyncAdapter = createMockSyncAdapter({
      deleteFile: vi.fn().mockResolvedValue({ deleted: false, ref_count: 2 }),
    });
    const service = createService({ mockSyncAdapter });

    await service.deleteFile("hash-abc", "goal-1");

    expect(mocks.mockFileRepository.delete).not.toHaveBeenCalled();
  });

  it("should remove cover URL from localFileCache when backend confirms deletion", async () => {
    localFileCache.set("hash-abc", "blob:http://localhost/abc");
    const service = createService();

    await service.deleteFile("hash-abc", "goal-1");

    expect(localFileCache.get("hash-abc")).toBeUndefined();
  });

  it("should not remove cover from localFileCache when backend says not deleted", async () => {
    localFileCache.set("hash-abc", "blob:http://localhost/abc");
    const mockSyncAdapter = createMockSyncAdapter({
      deleteFile: vi.fn().mockResolvedValue({ deleted: false, ref_count: 2 }),
    });
    const service = createService({ mockSyncAdapter });

    await service.deleteFile("hash-abc", "goal-1");

    expect(localFileCache.get("hash-abc")).toBeDefined();
  });

  it("should delete pending cover from pendingFileRepository when pending cover exists for hash", async () => {
    const mockPendingFileRepository = createMockPendingFileRepository({
      getByHash: vi.fn().mockResolvedValue({
        goal_id: "goal-1",
        data: new Blob(["fake"]),
        filename: "cover.jpg",
        mime_type: "image/jpeg",
        data_hash: "pending-hash",
        created_at: "2026-01-01T00:00:00.000Z" as never,
      }),
    });
    const service = createService({ mockPendingFileRepository });

    await service.deleteFile("pending-hash", "goal-1");

    expect(mockPendingFileRepository.delete).toHaveBeenCalledWith(
      "pending-hash",
    );
  });

  it("should not call API when pending cover exists for hash", async () => {
    const mockPendingFileRepository = createMockPendingFileRepository({
      getByHash: vi.fn().mockResolvedValue({
        goal_id: "goal-1",
        data: new Blob(["fake"]),
        filename: "cover.jpg",
        mime_type: "image/jpeg",
        data_hash: "pending-hash",
        created_at: "2026-01-01T00:00:00.000Z" as never,
      }),
    });
    const service = createService({ mockPendingFileRepository });

    await service.deleteFile("pending-hash", "goal-1");

    expect(mocks.mockSyncAdapter.deleteFile).not.toHaveBeenCalled();
  });

  it("should remove cover from localFileCache when pending cover exists for hash", async () => {
    localFileCache.set("pending-hash", "blob:http://localhost/local");
    const mockPendingFileRepository = createMockPendingFileRepository({
      getByHash: vi.fn().mockResolvedValue({
        goal_id: "goal-1",
        data: new Blob(["fake"]),
        filename: "cover.jpg",
        mime_type: "image/jpeg",
        data_hash: "pending-hash",
        created_at: "2026-01-01T00:00:00.000Z" as never,
      }),
    });
    const service = createService({ mockPendingFileRepository });

    await service.deleteFile("pending-hash", "goal-1");

    expect(localFileCache.get("pending-hash")).toBeUndefined();
  });
});

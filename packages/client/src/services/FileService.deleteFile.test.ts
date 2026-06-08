import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { FileService, type LocalFileRefCounter } from "./FileService";
import {
  createFileServiceMocks,
  createMockPendingFileRepository,
  createMockSyncAdapter,
  type FileServiceMocks,
} from "./FileService.test-utils";
import { localFileCache } from "./LocalFileCache";

function createMockRefCounter(
  countLocalRefs: (hash: string) => Promise<number>,
): LocalFileRefCounter {
  return { countLocalRefs };
}

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

describe("FileService — deleteFile with local ref-counting", () => {
  let mocks: FileServiceMocks;

  beforeEach(() => {
    mocks = createFileServiceMocks();
  });

  afterEach(() => {
    localFileCache.clear();
  });

  it("should keep pending file and cache when local refs exist", async () => {
    localFileCache.set("shared-hash", "blob:http://localhost/shared");
    const mockPendingFileRepository = createMockPendingFileRepository({
      getByHash: vi.fn().mockResolvedValue({
        goal_id: "goal-1",
        data: new Blob(["fake"]),
        filename: "cover.jpg",
        mime_type: "image/jpeg",
        data_hash: "shared-hash",
        created_at: "2026-01-01T00:00:00.000Z" as never,
      }),
    });
    const refCounter = createMockRefCounter(async () => 1);
    const service = new FileService(
      mocks.mockSyncAdapter,
      mocks.mockFileRepository,
      mockPendingFileRepository,
      refCounter,
    );

    await service.deleteFile("shared-hash", "goal-1");

    expect(mockPendingFileRepository.delete).not.toHaveBeenCalled();
    expect(localFileCache.get("shared-hash")).toBe(
      "blob:http://localhost/shared",
    );
  });

  it("should remove pending file and cache when no local refs exist", async () => {
    localFileCache.set("lonely-hash", "blob:http://localhost/lonely");
    const mockPendingFileRepository = createMockPendingFileRepository({
      getByHash: vi.fn().mockResolvedValue({
        goal_id: "goal-1",
        data: new Blob(["fake"]),
        filename: "cover.jpg",
        mime_type: "image/jpeg",
        data_hash: "lonely-hash",
        created_at: "2026-01-01T00:00:00.000Z" as never,
      }),
    });
    const refCounter = createMockRefCounter(async () => 0);
    const service = new FileService(
      mocks.mockSyncAdapter,
      mocks.mockFileRepository,
      mockPendingFileRepository,
      refCounter,
    );

    await service.deleteFile("lonely-hash", "goal-1");

    expect(mockPendingFileRepository.delete).toHaveBeenCalledWith(
      "lonely-hash",
    );
    expect(localFileCache.get("lonely-hash")).toBeUndefined();
  });

  it("should keep file repo and cache when server deletes but local refs exist", async () => {
    localFileCache.set("ref-hash", "blob:http://localhost/ref");
    const refCounter = createMockRefCounter(async () => 2);
    const service = new FileService(
      mocks.mockSyncAdapter,
      mocks.mockFileRepository,
      mocks.mockPendingFileRepository,
      refCounter,
    );

    await service.deleteFile("ref-hash", "goal-1");

    expect(mocks.mockFileRepository.delete).not.toHaveBeenCalled();
    expect(localFileCache.get("ref-hash")).toBe("blob:http://localhost/ref");
  });

  it("should remove file repo and cache when server deletes and no local refs", async () => {
    localFileCache.set("no-ref-hash", "blob:http://localhost/no-ref");
    const refCounter = createMockRefCounter(async () => 0);
    const service = new FileService(
      mocks.mockSyncAdapter,
      mocks.mockFileRepository,
      mocks.mockPendingFileRepository,
      refCounter,
    );

    await service.deleteFile("no-ref-hash", "goal-1");

    expect(mocks.mockFileRepository.delete).toHaveBeenCalledWith("no-ref-hash");
    expect(localFileCache.get("no-ref-hash")).toBeUndefined();
  });
});

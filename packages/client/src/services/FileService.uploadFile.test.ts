import { validateMagicBytes } from "@clear-progress/contract";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MAX_COVER_SIZE_BYTES } from "@/constants";
import { toISOTimestamp } from "@/utils/dateHelpers";
import { FileService } from "./FileService";
import {
  createFileServiceMocks,
  createImageFile,
  createMockFileRepository,
  createMockPendingFileRepository,
  createMockSyncAdapter,
  type FileServiceMocks,
} from "./FileService.test-utils";
import { localFileCache } from "./LocalFileCache";

vi.mock("@clear-progress/contract", async (importOriginal) => {
  const original =
    await importOriginal<typeof import("@clear-progress/contract")>();
  return { ...original, validateMagicBytes: vi.fn(() => true) };
});

describe("FileService — uploadCover", () => {
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

  it("should throw INVALID_TYPE if file is not an image", async () => {
    const service = createService();
    const file = createImageFile({ type: "application/octet-stream" });
    await expect(
      service.uploadFile(file, "goal-1", MAX_COVER_SIZE_BYTES),
    ).rejects.toThrow("INVALID_TYPE");
  });

  it("should throw FILE_TOO_LARGE if file exceeds MAX_COVER_SIZE_BYTES", async () => {
    const service = createService();
    const file = createImageFile({ size: MAX_COVER_SIZE_BYTES + 1 });
    await expect(
      service.uploadFile(file, "goal-1", MAX_COVER_SIZE_BYTES),
    ).rejects.toThrow("FILE_TOO_LARGE");
  });

  it("should return cached cover without API call if same hash exists in DB", async () => {
    const cached = { data_hash: "any-hash" };
    const mockFileRepository = createMockFileRepository({
      getByHash: vi.fn().mockResolvedValue(cached),
    });
    const service = createService({ mockFileRepository });

    const result = await service.uploadFile(
      createImageFile(),
      "goal-1",
      MAX_COVER_SIZE_BYTES,
    );

    expect(result.data_hash).toBeDefined();
    expect(mocks.mockSyncAdapter.uploadFile).not.toHaveBeenCalled();
  });

  it("should call API when no cached cover exists for the hash", async () => {
    const service = createService();

    await service.uploadFile(createImageFile(), "goal-1", MAX_COVER_SIZE_BYTES);

    expect(mocks.mockSyncAdapter.uploadFile).toHaveBeenCalledWith(
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

    await service.uploadFile(createImageFile(), "goal-1", MAX_COVER_SIZE_BYTES);

    expect(mocks.mockFileRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        data_hash: expect.any(String),
      }),
    );
  });

  it("should save blob data to cover record after successful online upload", async () => {
    const service = createService();

    await service.uploadFile(createImageFile(), "goal-1", MAX_COVER_SIZE_BYTES);

    expect(mocks.mockFileRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.any(Blob),
      }),
    );
  });

  it("should add blob URL to localFileCache after successful online upload", async () => {
    const service = createService();

    const result = await service.uploadFile(
      createImageFile(),
      "goal-1",
      MAX_COVER_SIZE_BYTES,
    );

    expect(localFileCache.get(result.data_hash)).toBeDefined();
  });

  it("should return data_hash from upload", async () => {
    const service = createService();

    const result = await service.uploadFile(
      createImageFile(),
      "goal-1",
      MAX_COVER_SIZE_BYTES,
    );

    expect(result.data_hash).toBeDefined();
    expect(typeof result.data_hash).toBe("string");
  });

  it("should not save to DB when reusing cached cover", async () => {
    const cached = { file_id: "cached-id", data_hash: "any-hash" };
    const mockFileRepository = createMockFileRepository({
      getByHash: vi.fn().mockResolvedValue(cached),
    });
    const service = createService({ mockFileRepository });

    await service.uploadFile(createImageFile(), "goal-1", MAX_COVER_SIZE_BYTES);

    expect(mockFileRepository.save).not.toHaveBeenCalled();
  });

  it("should save locally when API fails with network error", async () => {
    const mockSyncAdapter = createMockSyncAdapter({
      uploadFile: vi.fn().mockRejectedValue(new Error("Network error")),
    });
    const service = createService({ mockSyncAdapter });

    await service.uploadFile(createImageFile(), "goal-1", MAX_COVER_SIZE_BYTES);

    expect(mocks.mockPendingFileRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        goal_id: "goal-1",
        filename: "cover.jpg",
        mime_type: "image/jpeg",
        data_hash: expect.any(String),
      }),
    );
  });

  it("should return data_hash when saved locally after network error", async () => {
    const mockSyncAdapter = createMockSyncAdapter({
      uploadFile: vi.fn().mockRejectedValue(new Error("Network error")),
    });
    const service = createService({ mockSyncAdapter });

    const result = await service.uploadFile(
      createImageFile(),
      "goal-1",
      MAX_COVER_SIZE_BYTES,
    );

    expect(result.data_hash).toBeDefined();
    expect(typeof result.data_hash).toBe("string");
  });

  it("should not save locally for INVALID_TYPE error", async () => {
    const service = createService();
    const file = createImageFile({ type: "application/octet-stream" });

    await expect(
      service.uploadFile(file, "goal-1", MAX_COVER_SIZE_BYTES),
    ).rejects.toThrow("INVALID_TYPE");

    expect(mocks.mockPendingFileRepository.save).not.toHaveBeenCalled();
  });

  it("should not save locally for FILE_TOO_LARGE error", async () => {
    const service = createService();
    const file = createImageFile({ size: MAX_COVER_SIZE_BYTES + 1 });

    await expect(
      service.uploadFile(file, "goal-1", MAX_COVER_SIZE_BYTES),
    ).rejects.toThrow("FILE_TOO_LARGE");

    expect(mocks.mockPendingFileRepository.save).not.toHaveBeenCalled();
  });

  it("should not throw FILE_TOO_LARGE when file size equals sizeLimit (boundary)", async () => {
    const service = createService();
    const file = createImageFile({ size: MAX_COVER_SIZE_BYTES });

    // file.size === sizeLimit must pass (only strictly > should throw)
    const result = await service.uploadFile(
      file,
      "goal-1",
      MAX_COVER_SIZE_BYTES,
    );

    expect(result.data_hash).toBeDefined();
  });

  it("should throw INVALID_MAGIC_BYTES when validateMagicBytes returns false", async () => {
    vi.mocked(validateMagicBytes).mockReturnValueOnce(false);
    const service = createService();
    const file = createImageFile();

    await expect(
      service.uploadFile(file, "goal-1", MAX_COVER_SIZE_BYTES),
    ).rejects.toThrow("INVALID_MAGIC_BYTES");
  });

  it("should not save locally when INVALID_MAGIC_BYTES error occurs", async () => {
    vi.mocked(validateMagicBytes).mockReturnValueOnce(false);
    const service = createService();
    const file = createImageFile();

    await expect(
      service.uploadFile(file, "goal-1", MAX_COVER_SIZE_BYTES),
    ).rejects.toThrow("INVALID_MAGIC_BYTES");

    expect(mocks.mockPendingFileRepository.save).not.toHaveBeenCalled();
  });

  it("should create Blob with non-zero size from file buffer when uploading successfully", async () => {
    const service = createService();

    await service.uploadFile(createImageFile(), "goal-1", MAX_COVER_SIZE_BYTES);

    const savedCall = vi.mocked(mocks.mockFileRepository.save).mock.calls[0];
    const savedBlob = savedCall?.[0]?.data as Blob;
    expect(savedBlob).toBeInstanceOf(Blob);
    // Blob must contain actual data (created with [buffer], not [])
    expect(savedBlob.size).toBeGreaterThan(0);
  });

  it("should create Blob with correct mime type when uploading successfully", async () => {
    const service = createService();

    await service.uploadFile(
      createImageFile({ type: "image/jpeg" }),
      "goal-1",
      MAX_COVER_SIZE_BYTES,
    );

    const savedCall = vi.mocked(mocks.mockFileRepository.save).mock.calls[0];
    const savedBlob = savedCall?.[0]?.data as Blob;
    expect(savedBlob.type).toBe("image/jpeg");
  });

  it("should create pending Blob with non-zero size from file buffer on network error", async () => {
    const mockSyncAdapter = createMockSyncAdapter({
      uploadFile: vi.fn().mockRejectedValue(new Error("Network error")),
    });
    const service = createService({ mockSyncAdapter });

    await service.uploadFile(createImageFile(), "goal-1", MAX_COVER_SIZE_BYTES);

    const pendingCall = vi.mocked(mocks.mockPendingFileRepository.save).mock
      .calls[0];
    const pendingBlob = pendingCall?.[0]?.data as Blob;
    expect(pendingBlob).toBeInstanceOf(Blob);
    // Blob must contain actual data (created with [buffer], not [])
    expect(pendingBlob.size).toBeGreaterThan(0);
  });

  it("should create pending Blob with correct mime type on network error", async () => {
    const mockSyncAdapter = createMockSyncAdapter({
      uploadFile: vi.fn().mockRejectedValue(new Error("Network error")),
    });
    const service = createService({ mockSyncAdapter });

    await service.uploadFile(
      createImageFile({ type: "image/jpeg" }),
      "goal-1",
      MAX_COVER_SIZE_BYTES,
    );

    const pendingCall = vi.mocked(mocks.mockPendingFileRepository.save).mock
      .calls[0];
    const pendingBlob = pendingCall?.[0]?.data as Blob;
    expect(pendingBlob.type).toBe("image/jpeg");
  });

  it("should re-throw error when API throws with FILE_ERROR message instead of saving locally", async () => {
    const mockSyncAdapter = createMockSyncAdapter({
      uploadFile: vi.fn().mockRejectedValue(new Error("INVALID_TYPE")),
    });
    const service = createService({ mockSyncAdapter });

    await expect(
      service.uploadFile(createImageFile(), "goal-1", MAX_COVER_SIZE_BYTES),
    ).rejects.toThrow("INVALID_TYPE");

    expect(mocks.mockPendingFileRepository.save).not.toHaveBeenCalled();
  });

  it("should return existing data_hash when same hash in pendingFileRepository", async () => {
    const existingDataHash = "some-hash";
    const existingObjectUrl = "blob:http://localhost/existing";
    localFileCache.set(existingDataHash, existingObjectUrl);
    const mockPendingFileRepository = createMockPendingFileRepository({
      getByHash: vi.fn().mockResolvedValue({
        goal_id: "goal-1",
        data: new Blob(["fake"]),
        filename: "cover.jpg",
        mime_type: "image/jpeg",
        data_hash: existingDataHash,
        created_at: toISOTimestamp(),
      }),
    });
    const service = createService({ mockPendingFileRepository });

    const result = await service.uploadFile(
      createImageFile(),
      "goal-1",
      MAX_COVER_SIZE_BYTES,
    );

    expect(result.data_hash).toBeDefined();
    expect(mocks.mockSyncAdapter.uploadFile).not.toHaveBeenCalled();
  });
});

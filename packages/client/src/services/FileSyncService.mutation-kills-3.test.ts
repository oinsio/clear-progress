/** Kills remaining Stryker mutants in FileSyncService.ts — part 3 */
import { describe, expect, it, vi } from "vitest";
import {
  createFileRecord,
  createGoalWithServerFile,
  createMockFileRepository,
  createMockGoalRepository,
  createMockPendingFileRepository,
  createMockSyncAdapter,
  createPendingFile,
  EXISTING_SERVER_FILE_ID,
  localFileCache,
  MOCK_BASE64,
  MOCK_MIME_TYPE,
  setupFileSyncTests,
} from "./FileSyncService-test-utils";

describe("FileSyncService mutation kills — part 3", () => {
  const ctx = setupFileSyncTests();

  // L88: handleSuccessfulUpload block → {} — pendingFileRepository.delete must be called
  it("should delete pending file after successful upload", async () => {
    const pendingFile = createPendingFile({ data_hash: "hash-success" });
    ctx.mockPendingFileRepository = createMockPendingFileRepository({
      getAll: vi.fn().mockResolvedValue([pendingFile]),
    });
    ctx.mockSyncAdapter = createMockSyncAdapter({
      uploadFiles: vi.fn().mockResolvedValue({
        ok: true,
        results: [{ data_hash: "hash-success", reused: false }],
      }),
    });
    const service = ctx.createService();
    await service.sync();
    expect(ctx.mockPendingFileRepository.delete).toHaveBeenCalledWith(
      "hash-success",
    );
  });

  // L88: handleSuccessfulUpload — fileRepository.save called when reused=false
  it("should save file record when upload succeeds with reused=false", async () => {
    const pendingFile = createPendingFile({ data_hash: "hash-new-upload" });
    ctx.mockPendingFileRepository = createMockPendingFileRepository({
      getAll: vi.fn().mockResolvedValue([pendingFile]),
    });
    ctx.mockSyncAdapter = createMockSyncAdapter({
      uploadFiles: vi.fn().mockResolvedValue({
        ok: true,
        results: [{ data_hash: "hash-new-upload", reused: false }],
      }),
    });
    const service = ctx.createService();
    await service.sync();
    expect(ctx.mockFileRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({ data_hash: "hash-new-upload" }),
    );
  });

  // L88: handleSuccessfulUpload — fileRepository.save NOT called when reused=true
  it("should not save file record when upload succeeds with reused=true", async () => {
    const pendingFile = createPendingFile({ data_hash: "hash-reused" });
    ctx.mockPendingFileRepository = createMockPendingFileRepository({
      getAll: vi.fn().mockResolvedValue([pendingFile]),
    });
    ctx.mockSyncAdapter = createMockSyncAdapter({
      uploadFiles: vi.fn().mockResolvedValue({
        ok: true,
        results: [{ data_hash: "hash-reused", reused: true }],
      }),
    });
    const service = ctx.createService();
    await service.sync();
    expect(ctx.mockFileRepository.save).not.toHaveBeenCalled();
    expect(ctx.mockPendingFileRepository.delete).toHaveBeenCalledWith(
      "hash-reused",
    );
  });

  // L68: catch in buildBatchItem → break — sync stops on buildBatchItem error
  it("should stop uploading when buildBatchItem throws", async () => {
    const badBlob = { arrayBuffer: () => Promise.reject(new Error("fail")) };
    const pendingFile = createPendingFile({
      data_hash: "hash-bad-blob",
      data: badBlob as unknown as Blob,
    });
    ctx.mockPendingFileRepository = createMockPendingFileRepository({
      getAll: vi.fn().mockResolvedValue([pendingFile]),
    });
    ctx.mockSyncAdapter = createMockSyncAdapter({
      uploadFiles: vi.fn(),
    });
    const service = ctx.createService();
    await service.sync();
    expect(ctx.mockSyncAdapter.uploadFiles).not.toHaveBeenCalled();
  });

  // L336: fetchFromServerAndStore — error=true returns null (no save)
  it("should not save when server returns error flag in cacheFromServer", async () => {
    ctx.mockSyncAdapter = createMockSyncAdapter({
      getFile: vi.fn().mockResolvedValue({
        ok: true,
        files: [{ hash: "hash-err", error: "FILE_NOT_FOUND" }],
      }),
    });
    const service = ctx.createService();
    await service.cacheFromServer("hash-err");
    expect(ctx.mockFileRepository.save).not.toHaveBeenCalled();
    expect(localFileCache.get("hash-err")).toBeUndefined();
  });

  // L336: fetchFromServerAndStore — data=null returns null (no save)
  it("should not save when server returns null data in cacheFromServer", async () => {
    ctx.mockSyncAdapter = createMockSyncAdapter({
      getFile: vi.fn().mockResolvedValue({
        ok: true,
        files: [
          { hash: "hash-no-data", data: null, mime_type: MOCK_MIME_TYPE },
        ],
      }),
    });
    const service = ctx.createService();
    await service.cacheFromServer("hash-no-data");
    expect(ctx.mockFileRepository.save).not.toHaveBeenCalled();
  });

  // L346: fetchFromServerAndStore save block — verify save IS called with correct data_hash
  it("should save file record with correct data_hash in cacheFromServer", async () => {
    ctx.mockSyncAdapter = createMockSyncAdapter({
      getFile: vi.fn().mockResolvedValue({
        ok: true,
        files: [
          {
            hash: "hash-save-check",
            data: MOCK_BASE64,
            mime_type: MOCK_MIME_TYPE,
          },
        ],
      }),
    });
    const service = ctx.createService();
    await service.cacheFromServer("hash-save-check");
    expect(ctx.mockFileRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({ data_hash: "hash-save-check" }),
    );
  });

  // L346: fetchFromServerAndStore — verify localFileCache is populated
  it("should populate localFileCache after successful cacheFromServer", async () => {
    vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:cached-url");
    ctx.mockSyncAdapter = createMockSyncAdapter({
      getFile: vi.fn().mockResolvedValue({
        ok: true,
        files: [
          {
            hash: "hash-cache-pop",
            data: MOCK_BASE64,
            mime_type: MOCK_MIME_TYPE,
          },
        ],
      }),
    });
    const service = ctx.createService();
    await service.cacheFromServer("hash-cache-pop");
    expect(localFileCache.get("hash-cache-pop")).toBe("blob:cached-url");
    vi.mocked(URL.createObjectURL).mockRestore();
  });

  // L356: buildBatchItem ObjectLiteral → {} — verify uploadFiles receives correct payload
  it("should send correct payload fields in uploadFiles request", async () => {
    const pendingFile = createPendingFile({
      data_hash: "hash-payload",
      goal_id: "goal-payload",
      filename: "payload.jpg",
      mime_type: "image/jpeg",
    });
    ctx.mockPendingFileRepository = createMockPendingFileRepository({
      getAll: vi.fn().mockResolvedValue([pendingFile]),
    });
    ctx.mockSyncAdapter = createMockSyncAdapter({
      uploadFiles: vi.fn().mockResolvedValue({ ok: true, results: [] }),
    });
    const service = ctx.createService();
    await service.sync();
    const uploadCall = vi.mocked(ctx.mockSyncAdapter.uploadFiles).mock
      .calls[0][0];
    const firstFile = uploadCall.files[0];
    expect(firstFile).toMatchObject({
      local_id: "hash-payload",
      goal_id: "goal-payload",
      filename: "payload.jpg",
      mime_type: "image/jpeg",
      data_hash: "hash-payload",
    });
    expect(firstFile.data).toBeDefined();
    expect(firstFile.data.length).toBeGreaterThan(0);
  });

  // L175: reuploadLocalFiles — verify save called with correct blob data
  it("should save file with blob data in reupload when result.reused is false", async () => {
    const fileRecord = createFileRecord(EXISTING_SERVER_FILE_ID);
    ctx.mockGoalRepository = createMockGoalRepository({
      getActive: vi
        .fn()
        .mockResolvedValue([
          createGoalWithServerFile({ cover_hash: EXISTING_SERVER_FILE_ID }),
        ]),
    });
    ctx.mockFileRepository = createMockFileRepository({
      getByHash: vi.fn().mockResolvedValue(fileRecord),
    });
    ctx.mockSyncAdapter = createMockSyncAdapter({
      uploadFiles: vi.fn().mockResolvedValue({
        ok: true,
        results: [{ data_hash: EXISTING_SERVER_FILE_ID, reused: false }],
      }),
    });
    const service = ctx.createService();
    await service.reuploadLocalFiles();
    const savedArg = vi.mocked(ctx.mockFileRepository.save).mock.calls[0][0];
    expect(savedArg.data_hash).toBe(EXISTING_SERVER_FILE_ID);
    expect(savedArg.data).toBeInstanceOf(Blob);
  });
});

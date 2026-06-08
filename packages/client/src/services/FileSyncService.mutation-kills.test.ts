/** Kills surviving Stryker mutants in FileSyncService.ts */
import { describe, expect, it, vi } from "vitest";
import { MAX_FILE_BATCH_SIZE } from "@/constants";
import {
  createFileRecord,
  createGoalWithFile,
  createGoalWithServerFile,
  createMockFileRepository,
  createMockGoalRepository,
  createMockPendingFileRepository,
  createMockSyncAdapter,
  createPendingFile,
  EXISTING_SERVER_FILE_ID,
  localFileCache,
  setupFileSyncTests,
} from "./FileSyncService-test-utils";

describe("FileSyncService mutation kills", () => {
  const ctx = setupFileSyncTests();

  // Mutant 1: line 39 — `file.data && !localFileCache.get(...)` mutated to `||`
  // When file IS in cache, createObjectURL must NOT be called a second time
  it("should not call createObjectURL for file already present in localFileCache", async () => {
    const existingUrl = "blob:http://localhost/already-cached";
    localFileCache.set("hash-already-cached", existingUrl);

    const fileWithBlob = {
      data_hash: "hash-already-cached",
      data: new Blob(["img"], { type: "image/jpeg" }),
    };
    ctx.mockFileRepository = createMockFileRepository({
      getAll: vi.fn().mockResolvedValue([fileWithBlob]),
    });
    const createObjectURLSpy = vi
      .spyOn(URL, "createObjectURL")
      .mockReturnValue("blob:new-url");

    const service = ctx.createService();
    await service.initializeLocalFiles();

    expect(createObjectURLSpy).not.toHaveBeenCalled();
    expect(localFileCache.get("hash-already-cached")).toBe(existingUrl);
    createObjectURLSpy.mockRestore();
  });

  // Mutant 2: line 58 — `offset <= pendingFiles.length` boundary
  // pendingFiles.length === MAX_FILE_BATCH_SIZE must trigger exactly one upload call
  it("should upload exactly once when pendingFiles.length equals MAX_FILE_BATCH_SIZE", async () => {
    const pendingFiles = Array.from({ length: MAX_FILE_BATCH_SIZE }, (_, i) =>
      createPendingFile({ data_hash: `hash-exact-${i}` }),
    );
    ctx.mockPendingFileRepository = createMockPendingFileRepository({
      getAll: vi.fn().mockResolvedValue(pendingFiles),
    });
    ctx.mockSyncAdapter = createMockSyncAdapter({
      uploadFiles: vi.fn().mockResolvedValue({ ok: true, results: [] }),
    });
    const service = ctx.createService();

    await service.sync();

    expect(ctx.mockSyncAdapter.uploadFiles).toHaveBeenCalledTimes(1);
  });

  // Mutant 3: line 86 — result.error=true → pending file must NOT be promoted
  it("should not delete pending file when server returns error for that item", async () => {
    const pendingFile = createPendingFile({ data_hash: "hash-error-item" });
    ctx.mockPendingFileRepository = createMockPendingFileRepository({
      getAll: vi.fn().mockResolvedValue([pendingFile]),
    });
    ctx.mockSyncAdapter = createMockSyncAdapter({
      uploadFiles: vi.fn().mockResolvedValue({
        ok: true,
        results: [{ data_hash: "hash-error-item", error: "FILE_TOO_LARGE" }],
      }),
    });
    const service = ctx.createService();

    await service.sync();

    expect(ctx.mockPendingFileRepository.delete).not.toHaveBeenCalled();
    expect(ctx.mockFileRepository.save).not.toHaveBeenCalled();
  });

  // Mutant 4: line 112 — `!existingFile?.data` mutated to `true`
  // File with data → cacheFromServer must NOT be called
  it("should not fetch from server when FileRecord with data already exists in reupload", async () => {
    ctx.mockGoalRepository = createMockGoalRepository({
      getActive: vi
        .fn()
        .mockResolvedValue([
          createGoalWithServerFile({ cover_hash: "hash-has-data" }),
        ]),
    });
    ctx.mockFileRepository = createMockFileRepository({
      getByHash: vi.fn().mockResolvedValue(createFileRecord("hash-has-data")),
    });
    ctx.mockSyncAdapter = createMockSyncAdapter({
      getFile: vi.fn(),
      uploadFiles: vi.fn().mockResolvedValue({ ok: true, results: [] }),
    });
    const service = ctx.createService();

    await service.reuploadLocalFiles();

    expect(ctx.mockSyncAdapter.getFile).not.toHaveBeenCalled();
  });

  // Mutant 5: line 140 — `.slice(...)` removed in reuploadLocalFiles batch loop
  // batchEntries > MAX_FILE_BATCH_SIZE → must call uploadFiles twice
  it("should split reupload into multiple chunks when files exceed MAX_FILE_BATCH_SIZE", async () => {
    const goals = Array.from({ length: MAX_FILE_BATCH_SIZE + 1 }, (_, i) =>
      createGoalWithFile(`goal-${i}`, `hash-reup-${i}`),
    );
    ctx.mockGoalRepository = createMockGoalRepository({
      getActive: vi.fn().mockResolvedValue(goals),
    });
    ctx.mockFileRepository = createMockFileRepository({
      getByHash: vi.fn().mockResolvedValue(createFileRecord()),
    });
    ctx.mockSyncAdapter = createMockSyncAdapter({
      uploadFiles: vi.fn().mockResolvedValue({ ok: true, results: [] }),
    });
    const service = ctx.createService();

    await service.reuploadLocalFiles();

    expect(ctx.mockSyncAdapter.uploadFiles).toHaveBeenCalledTimes(2);
    const firstCallFiles = vi.mocked(ctx.mockSyncAdapter.uploadFiles).mock
      .calls[0][0];
    expect(firstCallFiles.files.length).toBe(MAX_FILE_BATCH_SIZE);
  });

  // Mutant 6a: line 153 — result.error=true → fileRepository.save must NOT be called
  it("should not call fileRepository.save in reupload when result has error", async () => {
    ctx.mockGoalRepository = createMockGoalRepository({
      getActive: vi
        .fn()
        .mockResolvedValue([
          createGoalWithServerFile({ cover_hash: EXISTING_SERVER_FILE_ID }),
        ]),
    });
    ctx.mockFileRepository = createMockFileRepository({
      getByHash: vi
        .fn()
        .mockResolvedValue(createFileRecord(EXISTING_SERVER_FILE_ID)),
    });
    ctx.mockSyncAdapter = createMockSyncAdapter({
      uploadFiles: vi.fn().mockResolvedValue({
        ok: true,
        results: [
          { data_hash: EXISTING_SERVER_FILE_ID, error: "FILE_TOO_LARGE" },
        ],
      }),
    });
    const service = ctx.createService();

    await service.reuploadLocalFiles();

    expect(ctx.mockFileRepository.save).not.toHaveBeenCalled();
  });

  // Mutant 6b: line 157 — result.reused=true → fileRepository.save must NOT be called
  it("should not call fileRepository.save in reupload when result.reused is true", async () => {
    ctx.mockGoalRepository = createMockGoalRepository({
      getActive: vi
        .fn()
        .mockResolvedValue([
          createGoalWithServerFile({ cover_hash: EXISTING_SERVER_FILE_ID }),
        ]),
    });
    ctx.mockFileRepository = createMockFileRepository({
      getByHash: vi
        .fn()
        .mockResolvedValue(createFileRecord(EXISTING_SERVER_FILE_ID)),
    });
    ctx.mockSyncAdapter = createMockSyncAdapter({
      uploadFiles: vi.fn().mockResolvedValue({
        ok: true,
        results: [{ data_hash: EXISTING_SERVER_FILE_ID, reused: true }],
      }),
    });
    const service = ctx.createService();

    await service.reuploadLocalFiles();

    expect(ctx.mockFileRepository.save).not.toHaveBeenCalled();
  });

  // Mutant 6c: line 157 — result.reused=false → fileRepository.save IS called
  it("should call fileRepository.save in reupload when result.reused is false", async () => {
    ctx.mockGoalRepository = createMockGoalRepository({
      getActive: vi
        .fn()
        .mockResolvedValue([
          createGoalWithServerFile({ cover_hash: EXISTING_SERVER_FILE_ID }),
        ]),
    });
    const fileRecord = createFileRecord(EXISTING_SERVER_FILE_ID);
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

    expect(ctx.mockFileRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({ data_hash: EXISTING_SERVER_FILE_ID }),
    );
  });
});

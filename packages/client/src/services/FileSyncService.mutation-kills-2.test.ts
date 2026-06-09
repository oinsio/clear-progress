/** Kills surviving Stryker mutants in FileSyncService.ts — part 2 */
import { describe, expect, it, vi } from "vitest";
import { FALLBACK_FILE_MIME_TYPE } from "@/constants";
import { toISOTimestamp } from "@/utils/dateHelpers";
import {
  createGoalWithFile,
  createMockFileRepository,
  createMockGoalRepository,
  createMockSyncAdapter,
  localFileCache,
  MOCK_BASE64,
  MOCK_MIME_TYPE,
  setupFileSyncTests,
} from "./FileSyncService-test-utils";

function createActiveAttachment(
  dataHash: string,
  overrides: Record<string, unknown> = {},
) {
  return {
    id: `attachment-${dataHash}`,
    entity_type: "goal" as const,
    entity_id: "goal-1",
    data_hash: dataHash,
    filename: "file.jpg",
    mime_type: "image/jpeg",
    sort_order: "0",
    is_deleted: false,
    version: 1,
    created_at: toISOTimestamp(),
    updated_at: toISOTimestamp(),
    ...overrides,
  };
}

describe("FileSyncService mutation kills — part 2", () => {
  const ctx = setupFileSyncTests();

  // Mutant 7: lines 224-226 — `missingFromDb.length > 0` → true
  // All files already in DB → batchCacheFromServer must NOT be called
  it("should not call batchCacheFromServer when all hashes are already in DB", async () => {
    const fileHash = "hash-already-in-db";
    const existingFile = {
      data_hash: fileHash,
      data: new Blob(["img"], { type: "image/jpeg" }),
    };
    ctx.mockGoalRepository = createMockGoalRepository({
      getActive: vi
        .fn()
        .mockResolvedValue([createGoalWithFile("goal-1", fileHash)]),
    });
    ctx.mockFileRepository = createMockFileRepository({
      getByHash: vi.fn().mockResolvedValue(existingFile),
    });
    ctx.mockSyncAdapter = createMockSyncAdapter({
      getFile: vi.fn(),
    });
    const service = ctx.createService();

    await service.ensureServerFilesAreCached();

    expect(ctx.mockSyncAdapter.getFile).not.toHaveBeenCalled();
  });

  // Mutant 8: line 269 — fileResult.error=true → fileRepository.save must NOT be called
  it("should not save file when server returns error in batchCacheFromServer result", async () => {
    const errorHash = "hash-error-batch";
    ctx.mockSyncAdapter = createMockSyncAdapter({
      getFile: vi.fn().mockResolvedValue({
        ok: true,
        files: [{ hash: errorHash, error: "FILE_NOT_FOUND" }],
      }),
    });
    const service = ctx.createService();

    await service.batchCacheFromServer([errorHash]);

    expect(ctx.mockFileRepository.save).not.toHaveBeenCalled();
  });

  // Mutant 9: line 271 — mime_type absent in batchCacheFromServer → FALLBACK_FILE_MIME_TYPE
  it("should use FALLBACK_FILE_MIME_TYPE when mime_type is null in batchCacheFromServer", async () => {
    const fallbackHash = "hash-no-mime";
    ctx.mockSyncAdapter = createMockSyncAdapter({
      getFile: vi.fn().mockResolvedValue({
        ok: true,
        files: [{ hash: fallbackHash, data: MOCK_BASE64, mime_type: null }],
      }),
    });
    const service = ctx.createService();

    await service.batchCacheFromServer([fallbackHash]);

    const savedRecord = vi.mocked(ctx.mockFileRepository.save).mock.calls[0][0];
    expect((savedRecord.data as Blob).type).toBe(FALLBACK_FILE_MIME_TYPE);
  });

  // Mutants 10a/10b: lines 318-319 — deleted attachments and empty data_hash must be excluded
  it.each([
    [
      "deleted attachment (is_deleted: true)",
      createActiveAttachment("hash-deleted-attachment", { is_deleted: true }),
    ],
    [
      "attachment with empty data_hash",
      createActiveAttachment("", { data_hash: "" }),
    ],
  ] as const)("should not call getFile when attachment is excluded: %s", async (_label, attachment) => {
    ctx.mockAttachmentRepository = {
      ...ctx.mockAttachmentRepository,
      getAll: vi.fn().mockResolvedValue([attachment]),
    } as unknown as typeof ctx.mockAttachmentRepository;
    ctx.mockGoalRepository = createMockGoalRepository({
      getActive: vi.fn().mockResolvedValue([]),
    });
    ctx.mockSyncAdapter = createMockSyncAdapter({
      getFile: vi.fn().mockResolvedValue({ ok: true, files: [] }),
    });
    const service = ctx.createService();

    await service.ensureServerFilesAreCached();

    expect(ctx.mockSyncAdapter.getFile).not.toHaveBeenCalled();
  });

  // Mutant 11: line 336 — files=[], error=true, data=null → fetchFromServerAndStore returns null
  it("should not save file when server returns empty files array in cacheFromServer", async () => {
    ctx.mockSyncAdapter = createMockSyncAdapter({
      getFile: vi.fn().mockResolvedValue({ ok: true, files: [] }),
    });
    const service = ctx.createService();

    await service.cacheFromServer("hash-empty-files");

    expect(ctx.mockFileRepository.save).not.toHaveBeenCalled();
    expect(localFileCache.get("hash-empty-files")).toBeUndefined();
  });

  // Mutant 12: line 338 — mime_type=null in fetchFromServerAndStore → fallback
  it("should use FALLBACK_FILE_MIME_TYPE when mime_type is absent in fetchFromServerAndStore", async () => {
    const hashNoMime = "hash-fetchserver-no-mime";
    ctx.mockSyncAdapter = createMockSyncAdapter({
      getFile: vi.fn().mockResolvedValue({
        ok: true,
        files: [{ hash: hashNoMime, data: MOCK_BASE64 }],
      }),
    });
    const service = ctx.createService();

    await service.cacheFromServer(hashNoMime);

    const savedRecord = vi.mocked(ctx.mockFileRepository.save).mock.calls[0][0];
    expect((savedRecord.data as Blob).type).toBe(FALLBACK_FILE_MIME_TYPE);
  });

  // Mutant 13: lines 385-388 — base64ToBlob loop/ArrayDeclaration/ObjectLiteral
  // Verify that a Blob is produced with correct type and non-zero size
  it("should produce a Blob with correct mime_type and non-zero size from base64 data", async () => {
    const originalBase64 = btoa("round-trip test data");
    const mimeType = MOCK_MIME_TYPE;

    ctx.mockSyncAdapter = createMockSyncAdapter({
      getFile: vi.fn().mockResolvedValue({
        ok: true,
        files: [
          { hash: "hash-blob-size", data: originalBase64, mime_type: mimeType },
        ],
      }),
    });
    const service = ctx.createService();

    await service.cacheFromServer("hash-blob-size");

    const savedRecord = vi.mocked(ctx.mockFileRepository.save).mock.calls[0][0];
    const blob = savedRecord.data as Blob;
    expect(blob).toBeInstanceOf(Blob);
    expect(blob.type).toBe(mimeType);
    // size must equal the length of the decoded binary string (not zero)
    const expectedByteLength = atob(originalBase64).length;
    expect(blob.size).toBe(expectedByteLength);
  });
});

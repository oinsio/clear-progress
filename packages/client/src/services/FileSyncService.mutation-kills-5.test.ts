/** Final Stryker mutant kills for FileSyncService.ts */
import { afterEach, describe, expect, it, vi } from "vitest";
import { localFileCache, makeService } from "./FileSyncService-test-utils";

afterEach(() => localFileCache.clear());

describe("FileSyncService final mutation kills", () => {
  // L88: result.data_hash doesn't match any pending → skip gracefully
  it("sync: unmatched result data_hash does not crash or call delete", async () => {
    const { service, pendingRepo } = makeService({
      pendingRepo: {
        getAll: vi.fn().mockResolvedValue([
          {
            goal_id: "g1",
            data: new Blob(["x"], { type: "image/jpeg" }),
            filename: "f.jpg",
            mime_type: "image/jpeg",
            data_hash: "pending-hash",
            created_at: "2025-01-15T10:30:00.000Z",
          },
        ]),
        delete: vi.fn(),
        save: vi.fn(),
        getByHash: vi.fn(),
      },
      uploadFiles: vi.fn().mockResolvedValue({
        ok: true,
        results: [{ data_hash: "DIFFERENT-hash", reused: false }],
      }),
    });
    await service.sync();
    // Should not crash and should not delete the pending file
    expect(pendingRepo.delete).not.toHaveBeenCalled();
  });

  // L385-390: base64ToBlob produces correct bytes — verify via blob content
  it("cacheFromServer: blob bytes match decoded base64", async () => {
    const originalText = "AB"; // simple 2-byte string
    const b64 = btoa(originalText);
    const { service, fileRepo } = makeService({
      getFile: vi.fn().mockResolvedValue({
        ok: true,
        files: [{ hash: "byte-h", data: b64, mime_type: "image/png" }],
      }),
    });
    await service.cacheFromServer("byte-h");
    const savedBlob = vi.mocked(fileRepo.save).mock.calls[0][0].data as Blob;
    // Blob size must equal original byte count
    expect(savedBlob.size).toBe(originalText.length);
    expect(savedBlob.type).toBe("image/png");
  });

  // L385: single-byte base64 → 1-byte blob (verifies loop runs)
  it("cacheFromServer: single char base64 produces correct size blob", async () => {
    const oneChar = "X"; // 1 byte
    const b64 = btoa(oneChar);
    const { service, fileRepo } = makeService({
      getFile: vi.fn().mockResolvedValue({
        ok: true,
        files: [{ hash: "one-b64", data: b64, mime_type: "image/jpeg" }],
      }),
    });
    await service.cacheFromServer("one-b64");
    const savedBlob = vi.mocked(fileRepo.save).mock.calls[0][0].data as Blob;
    expect(savedBlob.size).toBe(1);
  });

  // L336: fileResult with error AND data — error takes precedence, no save
  it("cacheFromServer: error flag overrides data presence", async () => {
    const { service, fileRepo } = makeService({
      getFile: vi.fn().mockResolvedValue({
        ok: true,
        files: [{ hash: "err-data", error: "ERR", data: btoa("x") }],
      }),
    });
    await service.cacheFromServer("err-data");
    expect(fileRepo.save).not.toHaveBeenCalled();
  });

  // L269: batchCacheFromServer — valid result IS saved (block not empty)
  it("batchCache: valid result saves to fileRepo and populates cache", async () => {
    const createUrl = vi
      .spyOn(URL, "createObjectURL")
      .mockReturnValue("blob:b");
    const { service, fileRepo } = makeService({
      getFile: vi.fn().mockResolvedValue({
        ok: true,
        files: [{ hash: "bv", data: btoa("data"), mime_type: "image/jpeg" }],
      }),
    });
    await service.batchCacheFromServer(["bv"]);
    expect(fileRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({ data_hash: "bv" }),
    );
    expect(localFileCache.get("bv")).toBe("blob:b");
    createUrl.mockRestore();
  });

  // L224: empty hashes set → no server call at all
  it("ensureServerFilesAreCached: no goals/attachments → no getFile call", async () => {
    const { service, adapter } = makeService();
    await service.ensureServerFilesAreCached();
    expect(adapter.getFile).not.toHaveBeenCalled();
  });

  // L155: reupload entry not found by data_hash → skip (no crash)
  it("reupload: unmatched result data_hash skips save", async () => {
    const blob = new Blob(["img"], { type: "image/jpeg" });
    const { service, fileRepo } = makeService({
      goalRepo: {
        getActive: vi
          .fn()
          .mockResolvedValue([
            { id: "g1", cover_hash: "rh-match", is_deleted: false },
          ]),
      },
      fileRepo: {
        getByHash: vi
          .fn()
          .mockResolvedValue({ data_hash: "rh-match", data: blob }),
        save: vi.fn(),
        getAll: vi.fn().mockResolvedValue([]),
      },
      uploadFiles: vi.fn().mockResolvedValue({
        ok: true,
        results: [{ data_hash: "rh-NOMATCH", reused: false }],
      }),
    });
    await service.reuploadLocalFiles();
    expect(fileRepo.save).not.toHaveBeenCalled();
  });
});

/** Kills Stryker mutants with inline setup to ensure per-test coverage */
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  localFileCache,
  MOCK_BASE64,
  makeService,
} from "./FileSyncService-test-utils";

function makePending(hash: string) {
  return {
    goal_id: "g1",
    data: new Blob(["img"], { type: "image/jpeg" }),
    filename: "f.jpg",
    mime_type: "image/jpeg",
    data_hash: hash,
    created_at: "2025-01-15T10:30:00.000Z",
  };
}

afterEach(() => localFileCache.clear());

describe("FileSyncService inline mutation kills", () => {
  // L88: if (!pendingFile) continue → false kills handleSuccessfulUpload
  it("sync: successful result calls pendingRepo.delete", async () => {
    const { service, pendingRepo } = makeService({
      pendingRepo: { getAll: vi.fn().mockResolvedValue([makePending("h1")]) },
      uploadFiles: vi.fn().mockResolvedValue({
        ok: true,
        results: [{ data_hash: "h1", reused: false }],
      }),
    });
    await service.sync();
    expect(pendingRepo.delete).toHaveBeenCalledWith("h1");
  });

  // L175: reupload save block — fileRepo.save must be called with data
  it("reupload: reused=false calls fileRepo.save with blob", async () => {
    const blob = new Blob(["img"], { type: "image/jpeg" });
    const { service, fileRepo } = makeService({
      goalRepo: {
        getActive: vi
          .fn()
          .mockResolvedValue([
            { id: "g1", cover_hash: "rh1", is_deleted: false },
          ]),
      },
      fileRepo: {
        getByHash: vi.fn().mockResolvedValue({ data_hash: "rh1", data: blob }),
        save: vi.fn(),
        getAll: vi.fn().mockResolvedValue([]),
      },
      uploadFiles: vi.fn().mockResolvedValue({
        ok: true,
        results: [{ data_hash: "rh1", reused: false }],
      }),
    });
    await service.reuploadLocalFiles();
    expect(fileRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({ data_hash: "rh1" }),
    );
  });

  // L155: entry find result — reused=true skips save
  it("reupload: reused=true does not call fileRepo.save", async () => {
    const blob = new Blob(["img"], { type: "image/jpeg" });
    const { service, fileRepo } = makeService({
      goalRepo: {
        getActive: vi
          .fn()
          .mockResolvedValue([
            { id: "g1", cover_hash: "rh2", is_deleted: false },
          ]),
      },
      fileRepo: {
        getByHash: vi.fn().mockResolvedValue({ data_hash: "rh2", data: blob }),
        save: vi.fn(),
        getAll: vi.fn().mockResolvedValue([]),
      },
      uploadFiles: vi.fn().mockResolvedValue({
        ok: true,
        results: [{ data_hash: "rh2", reused: true }],
      }),
    });
    await service.reuploadLocalFiles();
    expect(fileRepo.save).not.toHaveBeenCalled();
  });

  // L269: batchCacheFromServer skips error result
  it("batchCache: error result does not call fileRepo.save", async () => {
    const { service, fileRepo } = makeService({
      getFile: vi.fn().mockResolvedValue({
        ok: true,
        files: [{ hash: "bh1", error: "NOT_FOUND" }],
      }),
    });
    await service.batchCacheFromServer(["bh1"]);
    expect(fileRepo.save).not.toHaveBeenCalled();
  });

  // L269: batchCacheFromServer skips result with no data
  it("batchCache: result with null data does not call fileRepo.save", async () => {
    const { service, fileRepo } = makeService({
      getFile: vi.fn().mockResolvedValue({
        ok: true,
        files: [{ hash: "bh2", data: null, mime_type: "image/jpeg" }],
      }),
    });
    await service.batchCacheFromServer(["bh2"]);
    expect(fileRepo.save).not.toHaveBeenCalled();
  });

  // L319: attachment filter — deleted excluded
  it("ensureServerFilesAreCached excludes deleted attachments", async () => {
    const { service, adapter } = makeService({
      attachRepo: {
        getAll: vi
          .fn()
          .mockResolvedValue([{ data_hash: "del-h", is_deleted: true }]),
      },
    });
    await service.ensureServerFilesAreCached();
    expect(adapter.getFile).not.toHaveBeenCalled();
  });

  // L319: attachment filter — empty hash excluded
  it("ensureServerFilesAreCached excludes empty data_hash", async () => {
    const { service, adapter } = makeService({
      attachRepo: {
        getAll: vi
          .fn()
          .mockResolvedValue([{ data_hash: "", is_deleted: false }]),
      },
    });
    await service.ensureServerFilesAreCached();
    expect(adapter.getFile).not.toHaveBeenCalled();
  });

  // L321: attachment hash IS added when active
  it("ensureServerFilesAreCached includes active attachment hash", async () => {
    const { service, adapter } = makeService({
      attachRepo: {
        getAll: vi
          .fn()
          .mockResolvedValue([{ data_hash: "att-h1", is_deleted: false }]),
      },
      fileRepo: {
        getByHash: vi.fn().mockResolvedValue(null),
        save: vi.fn(),
        getAll: vi.fn().mockResolvedValue([]),
      },
      getFile: vi.fn().mockResolvedValue({
        ok: true,
        files: [{ hash: "att-h1", data: MOCK_BASE64, mime_type: "image/jpeg" }],
      }),
    });
    await service.ensureServerFilesAreCached();
    expect(adapter.getFile).toHaveBeenCalled();
  });

  // L336: fetchFromServerAndStore — error flag
  it("cacheFromServer: error flag prevents save", async () => {
    const { service, fileRepo } = makeService({
      getFile: vi.fn().mockResolvedValue({
        ok: true,
        files: [{ hash: "eh", error: "NOT_FOUND" }],
      }),
    });
    await service.cacheFromServer("eh");
    expect(fileRepo.save).not.toHaveBeenCalled();
  });

  // L336: fetchFromServerAndStore — no data
  it("cacheFromServer: null data prevents save", async () => {
    const { service, fileRepo } = makeService({
      getFile: vi.fn().mockResolvedValue({
        ok: true,
        files: [{ hash: "nd", data: null }],
      }),
    });
    await service.cacheFromServer("nd");
    expect(fileRepo.save).not.toHaveBeenCalled();
  });

  // L346: fetchFromServerAndStore save block — verify save and cache
  it("cacheFromServer: success saves and populates cache", async () => {
    const createUrl = vi
      .spyOn(URL, "createObjectURL")
      .mockReturnValue("blob:u");
    const { service, fileRepo } = makeService({
      getFile: vi.fn().mockResolvedValue({
        ok: true,
        files: [{ hash: "sh", data: MOCK_BASE64, mime_type: "image/jpeg" }],
      }),
    });
    await service.cacheFromServer("sh");
    expect(fileRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({ data_hash: "sh" }),
    );
    expect(localFileCache.get("sh")).toBe("blob:u");
    createUrl.mockRestore();
  });

  // L385-388: base64ToBlob — verify blob size matches decoded length
  it("cacheFromServer: blob size matches base64 decoded length", async () => {
    const testData = "hello world test data for blob";
    const b64 = btoa(testData);
    const { service, fileRepo } = makeService({
      getFile: vi.fn().mockResolvedValue({
        ok: true,
        files: [{ hash: "bl", data: b64, mime_type: "image/png" }],
      }),
    });
    await service.cacheFromServer("bl");
    const saved = vi.mocked(fileRepo.save).mock.calls[0][0];
    expect((saved.data as Blob).size).toBe(testData.length);
    expect((saved.data as Blob).type).toBe("image/png");
  });

  // L224: missingFromDb.length > 0 boundary — all in DB → no server call
  it("ensureServerFilesAreCached: all hashes in DB skips server call", async () => {
    const blob = new Blob(["x"], { type: "image/jpeg" });
    const { service, adapter } = makeService({
      goalRepo: {
        getActive: vi
          .fn()
          .mockResolvedValue([
            { id: "g1", cover_hash: "db-h", is_deleted: false },
          ]),
      },
      fileRepo: {
        getByHash: vi.fn().mockResolvedValue({ data_hash: "db-h", data: blob }),
        save: vi.fn(),
        getAll: vi.fn().mockResolvedValue([]),
      },
    });
    await service.ensureServerFilesAreCached();
    expect(adapter.getFile).not.toHaveBeenCalled();
  });
});

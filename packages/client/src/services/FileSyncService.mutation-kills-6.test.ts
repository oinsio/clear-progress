/** Kills remaining Stryker mutants in FileSyncService.ts:
 * - deleteOrphanedFiles (lines 316-337): NoCoverage + Survived
 * - ensureFileCached .finally() (line 180-182): Survived
 * - base64ToBlob loop byte fidelity (line 426-428): Survived
 * - missingFromDb boundary (line 235): Survived
 * - handleSuccessfulUpload default param (line 410): NoCoverage
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { localFileCache, makeService } from "./FileSyncService-test-utils";

afterEach(() => localFileCache.clear());

describe("FileSyncService — deleteOrphanedFiles (via sync)", () => {
  it("should call deleteFile for orphaned files not referenced by goals or attachments", async () => {
    const orphanedFile = {
      data_hash: "orphan-hash",
      data: new Blob(["img"], { type: "image/jpeg" }),
    };
    const { service, adapter } = makeService({
      fileRepo: {
        getAll: vi.fn().mockResolvedValue([orphanedFile]),
        getByHash: vi.fn().mockResolvedValue(null),
        save: vi.fn(),
        delete: vi.fn(),
      },
      goalRepo: { getActive: vi.fn().mockResolvedValue([]) },
      attachRepo: { getAll: vi.fn().mockResolvedValue([]) },
    });

    await service.sync();

    expect(adapter.deleteFile).toHaveBeenCalledWith({ hash: "orphan-hash" });
  });

  it("should delete orphaned file from fileRepository when server confirms deletion", async () => {
    const orphanedFile = {
      data_hash: "orphan-del",
      data: new Blob(["img"], { type: "image/jpeg" }),
    };
    const deleteRepoFn = vi.fn();
    const { service } = makeService({
      fileRepo: {
        getAll: vi.fn().mockResolvedValue([orphanedFile]),
        getByHash: vi.fn().mockResolvedValue(null),
        save: vi.fn(),
        delete: deleteRepoFn,
      },
      deleteFile: vi.fn().mockResolvedValue({ deleted: true }),
    });

    await service.sync();

    expect(deleteRepoFn).toHaveBeenCalledWith("orphan-del");
  });

  it("should remove orphaned file from localFileCache when server confirms deletion", async () => {
    localFileCache.set("orphan-cache", "blob:http://localhost/orphan");
    const orphanedFile = {
      data_hash: "orphan-cache",
      data: new Blob(["img"], { type: "image/jpeg" }),
    };
    const { service } = makeService({
      fileRepo: {
        getAll: vi.fn().mockResolvedValue([orphanedFile]),
        getByHash: vi.fn().mockResolvedValue(null),
        save: vi.fn(),
        delete: vi.fn(),
      },
      deleteFile: vi.fn().mockResolvedValue({ deleted: true }),
    });

    await service.sync();

    expect(localFileCache.get("orphan-cache")).toBeUndefined();
  });

  it("should NOT delete file referenced by active goal cover_hash", async () => {
    const activeFile = {
      data_hash: "active-cover",
      data: new Blob(["img"], { type: "image/jpeg" }),
    };
    const { service, adapter } = makeService({
      fileRepo: {
        getAll: vi.fn().mockResolvedValue([activeFile]),
        getByHash: vi.fn().mockResolvedValue(null),
        save: vi.fn(),
        delete: vi.fn(),
      },
      goalRepo: {
        getActive: vi
          .fn()
          .mockResolvedValue([
            { id: "g1", cover_hash: "active-cover", is_deleted: false },
          ]),
      },
    });

    await service.sync();

    expect(adapter.deleteFile).not.toHaveBeenCalled();
  });

  it("should NOT delete file referenced by active attachment data_hash", async () => {
    const attachedFile = {
      data_hash: "attached-hash",
      data: new Blob(["img"], { type: "image/jpeg" }),
    };
    const { service, adapter } = makeService({
      fileRepo: {
        getAll: vi.fn().mockResolvedValue([attachedFile]),
        getByHash: vi.fn().mockResolvedValue(null),
        save: vi.fn(),
        delete: vi.fn(),
      },
      attachRepo: {
        getAll: vi
          .fn()
          .mockResolvedValue([
            { id: "a1", data_hash: "attached-hash", is_deleted: false },
          ]),
      },
    });

    await service.sync();

    expect(adapter.deleteFile).not.toHaveBeenCalled();
  });

  it("should NOT delete file from repo when server says not deleted", async () => {
    const orphanedFile = {
      data_hash: "not-del",
      data: new Blob(["img"], { type: "image/jpeg" }),
    };
    const deleteRepoFn = vi.fn();
    const { service } = makeService({
      fileRepo: {
        getAll: vi.fn().mockResolvedValue([orphanedFile]),
        getByHash: vi.fn().mockResolvedValue(null),
        save: vi.fn(),
        delete: deleteRepoFn,
      },
      deleteFile: vi.fn().mockResolvedValue({ deleted: false, ref_count: 1 }),
    });

    await service.sync();

    expect(deleteRepoFn).not.toHaveBeenCalled();
  });

  it("should continue gracefully when deleteFile throws for one orphan", async () => {
    const orphan1 = {
      data_hash: "err-orphan",
      data: new Blob(["img"], { type: "image/jpeg" }),
    };
    const orphan2 = {
      data_hash: "ok-orphan",
      data: new Blob(["img"], { type: "image/jpeg" }),
    };
    const deleteRepoFn = vi.fn();
    const { service } = makeService({
      fileRepo: {
        getAll: vi.fn().mockResolvedValue([orphan1, orphan2]),
        getByHash: vi.fn().mockResolvedValue(null),
        save: vi.fn(),
        delete: deleteRepoFn,
      },
      deleteFile: vi
        .fn()
        .mockRejectedValueOnce(new Error("Network error"))
        .mockResolvedValueOnce({ deleted: true }),
    });

    await service.sync();

    // First orphan fails, second succeeds — second should still be deleted
    expect(deleteRepoFn).toHaveBeenCalledWith("ok-orphan");
    expect(deleteRepoFn).not.toHaveBeenCalledWith("err-orphan");
  });

  it("should skip deleted attachments when computing active hashes", async () => {
    const attachedFile = {
      data_hash: "del-attach-hash",
      data: new Blob(["img"], { type: "image/jpeg" }),
    };
    const { service, adapter } = makeService({
      fileRepo: {
        getAll: vi.fn().mockResolvedValue([attachedFile]),
        getByHash: vi.fn().mockResolvedValue(null),
        save: vi.fn(),
        delete: vi.fn(),
      },
      attachRepo: {
        getAll: vi
          .fn()
          .mockResolvedValue([
            { id: "a1", data_hash: "del-attach-hash", is_deleted: true },
          ]),
      },
    });

    await service.sync();

    // File only referenced by deleted attachment → should be orphaned
    expect(adapter.deleteFile).toHaveBeenCalledWith({
      hash: "del-attach-hash",
    });
  });
});

describe("FileSyncService — ensureFileCached .finally() cleanup", () => {
  it("should allow a second call after first call fails (inFlightCaches cleaned up)", async () => {
    let callCount = 0;
    const { service } = makeService({
      fileRepo: {
        getAll: vi.fn().mockResolvedValue([]),
        getByHash: vi.fn().mockResolvedValue(null),
        save: vi.fn(),
        delete: vi.fn(),
      },
      pendingRepo: {
        getAll: vi.fn().mockResolvedValue([]),
        getByHash: vi.fn().mockResolvedValue(null),
        save: vi.fn(),
        delete: vi.fn(),
      },
      getFile: vi.fn().mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.reject(new Error("First call fails"));
        }
        return Promise.resolve({
          ok: true,
          files: [
            { hash: "retry-hash", data: btoa("x"), mime_type: "image/jpeg" },
          ],
        });
      }),
    });

    // First call — fails, but ensureFileCached swallows the error
    await service.ensureFileCached("retry-hash");
    expect(localFileCache.get("retry-hash")).toBeUndefined();

    // Second call — should NOT reuse the failed promise (thanks to .finally cleanup)
    await service.ensureFileCached("retry-hash");
    expect(localFileCache.get("retry-hash")).toBeDefined();
  });
});

describe("FileSyncService — base64ToBlob byte fidelity", () => {
  it("should produce blob with correct byte content from base64", async () => {
    const originalText = "Hello";
    const base64 = btoa(originalText);
    const saveFn = vi.fn();
    const { service } = makeService({
      getFile: vi.fn().mockResolvedValue({
        ok: true,
        files: [{ hash: "byte-check", data: base64, mime_type: "image/png" }],
      }),
      fileRepo: {
        getAll: vi.fn().mockResolvedValue([]),
        getByHash: vi.fn().mockResolvedValue(null),
        save: saveFn,
        delete: vi.fn(),
      },
    });

    await service.cacheFromServer("byte-check");

    const savedBlob = saveFn.mock.calls[0][0].data as Blob;
    expect(savedBlob.size).toBe(originalText.length);
    // Verify byte content via FileReader (jsdom doesn't support Blob.text/arrayBuffer)
    const readBytes = await new Promise<Uint8Array>((resolve) => {
      const reader = new FileReader();
      reader.onload = () =>
        resolve(new Uint8Array(reader.result as ArrayBuffer));
      reader.readAsArrayBuffer(savedBlob);
    });
    const expectedBytes = Array.from(originalText).map((char) =>
      char.charCodeAt(0),
    );
    expect(Array.from(readBytes)).toEqual(expectedBytes);
  });

  it("should produce blob with correct size for multi-byte base64", async () => {
    // 3 bytes → 4 base64 chars, tests loop runs fully
    const threeBytes = String.fromCharCode(255, 128, 0);
    const base64 = btoa(threeBytes);
    const saveFn = vi.fn();
    const { service } = makeService({
      getFile: vi.fn().mockResolvedValue({
        ok: true,
        files: [{ hash: "multi-byte", data: base64, mime_type: "image/jpeg" }],
      }),
      fileRepo: {
        getAll: vi.fn().mockResolvedValue([]),
        getByHash: vi.fn().mockResolvedValue(null),
        save: saveFn,
        delete: vi.fn(),
      },
    });

    await service.cacheFromServer("multi-byte");

    const savedBlob = saveFn.mock.calls[0][0].data as Blob;
    expect(savedBlob.size).toBe(3);
  });
});

describe("FileSyncService — ensureServerFilesAreCached boundary", () => {
  it("should NOT call batchCacheFromServer when all hashes are in DB", async () => {
    const existingBlob = new Blob(["img"], { type: "image/jpeg" });
    const { service, adapter } = makeService({
      goalRepo: {
        getActive: vi
          .fn()
          .mockResolvedValue([
            { id: "g1", cover_hash: "db-hash", is_deleted: false },
          ]),
      },
      fileRepo: {
        getAll: vi.fn().mockResolvedValue([]),
        getByHash: vi
          .fn()
          .mockResolvedValue({ data_hash: "db-hash", data: existingBlob }),
        save: vi.fn(),
        delete: vi.fn(),
      },
    });

    await service.ensureServerFilesAreCached();

    // All hashes resolved from DB → no server call
    expect(adapter.getFile).not.toHaveBeenCalled();
    expect(localFileCache.get("db-hash")).toBeDefined();
  });

  it("should call batchCacheFromServer only for hashes missing from DB", async () => {
    const existingBlob = new Blob(["img"], { type: "image/jpeg" });
    const { service, adapter } = makeService({
      goalRepo: {
        getActive: vi.fn().mockResolvedValue([
          { id: "g1", cover_hash: "in-db", is_deleted: false },
          { id: "g2", cover_hash: "not-in-db", is_deleted: false },
        ]),
      },
      fileRepo: {
        getAll: vi.fn().mockResolvedValue([]),
        getByHash: vi.fn().mockImplementation((hash: string) => {
          if (hash === "in-db") {
            return Promise.resolve({ data_hash: "in-db", data: existingBlob });
          }
          return Promise.resolve(null);
        }),
        save: vi.fn(),
        delete: vi.fn(),
      },
      getFile: vi.fn().mockResolvedValue({
        ok: true,
        files: [
          {
            hash: "not-in-db",
            data: btoa("server-data"),
            mime_type: "image/jpeg",
          },
        ],
      }),
    });

    await service.ensureServerFilesAreCached();

    // Should only request the hash not in DB
    expect(adapter.getFile).toHaveBeenCalledWith({
      hashes: ["not-in-db"],
    });
  });
});

describe("FileSyncService — handleSuccessfulUpload default reused param", () => {
  it("should save to fileRepository when result has no reused field (defaults to false)", async () => {
    const pendingFile = {
      goal_id: "g1",
      data: new Blob(["img"], { type: "image/jpeg" }),
      filename: "f.jpg",
      mime_type: "image/jpeg",
      data_hash: "no-reused-field",
      created_at: "2025-01-15T10:30:00.000Z",
    };
    const saveFn = vi.fn();
    const { service } = makeService({
      pendingRepo: {
        getAll: vi.fn().mockResolvedValue([pendingFile]),
        delete: vi.fn(),
        save: vi.fn(),
        getByHash: vi.fn(),
      },
      fileRepo: {
        getAll: vi.fn().mockResolvedValue([]),
        getByHash: vi.fn().mockResolvedValue(null),
        save: saveFn,
        delete: vi.fn(),
      },
      uploadFiles: vi.fn().mockResolvedValue({
        ok: true,
        // result without `reused` field — ?? false defaults to false → should save
        results: [{ data_hash: "no-reused-field" }],
      }),
    });

    await service.sync();

    expect(saveFn).toHaveBeenCalledWith(
      expect.objectContaining({ data_hash: "no-reused-field" }),
    );
  });
});

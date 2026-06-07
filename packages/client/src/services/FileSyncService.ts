/** Implements FR4, FR7 of add-file-attachments */
import type {
  SyncAdapter,
  UploadFileBatchItem,
} from "@clear-progress/contract";
import { FALLBACK_FILE_MIME_TYPE, MAX_FILE_BATCH_SIZE } from "@/constants";
import type { AttachmentRepository } from "@/db/repositories/AttachmentRepository";
import type { FileRepository } from "@/db/repositories/FileRepository";
import type { GoalRepository } from "@/db/repositories/GoalRepository";
import type { PendingFileRepository } from "@/db/repositories/PendingFileRepository";
import type { FileRecord, PendingFileRecord } from "@/types/entities";
import { arrayBufferToBase64, buildFileFilename } from "./FileService";
import { localFileCache } from "./LocalFileCache";

/**
 * Handles file sync operations: upload pending files, download/cache server files, reupload.
 *
 * File deletion (FR7 of add-file-attachments) is handled by {@link FileService.deleteFile}
 * because deletion is a goal-lifecycle operation, not a sync-cycle operation.
 *
 * Implements FR4, FR7 of add-file-attachments
 */
export class FileSyncService {
  constructor(
    private readonly syncAdapter: SyncAdapter,
    private readonly pendingFileRepository: PendingFileRepository,
    private readonly fileRepository: FileRepository,
    private readonly goalRepository: GoalRepository,
    private readonly attachmentRepository: AttachmentRepository,
  ) {}

  async initializeLocalFiles(): Promise<void> {
    const [pendingFiles, files] = await Promise.all([
      this.pendingFileRepository.getAll(),
      this.fileRepository.getAll(),
    ]);

    for (const file of files) {
      if (file.data && !localFileCache.get(file.data_hash)) {
        this.populateLocalCache(file.data_hash, file.data);
      }
    }

    for (const pendingFile of pendingFiles) {
      if (!localFileCache.get(pendingFile.data_hash)) {
        this.populateLocalCache(pendingFile.data_hash, pendingFile.data);
      }
    }
  }

  async sync(): Promise<void> {
    const pendingFiles = await this.pendingFileRepository.getAll();

    for (
      let offset = 0;
      offset < pendingFiles.length;
      offset += MAX_FILE_BATCH_SIZE
    ) {
      const chunk = pendingFiles.slice(offset, offset + MAX_FILE_BATCH_SIZE);

      let batchItems: UploadFileBatchItem[];
      try {
        batchItems = await Promise.all(
          chunk.map((file) => this.buildBatchItem(file)),
        );
      } catch {
        break;
      }

      let response: Awaited<ReturnType<typeof this.syncAdapter.uploadFiles>>;
      try {
        response = await this.syncAdapter.uploadFiles({
          files: batchItems,
        });
      } catch {
        break;
      }

      const pendingByDataHash = new Map(
        chunk.map((file) => [file.data_hash, file]),
      );

      for (const result of response.results) {
        if (result.error || !result.data_hash) continue;
        const pendingFile = pendingByDataHash.get(result.data_hash);
        if (!pendingFile) continue;
        await this.handleSuccessfulUpload(pendingFile, result.reused ?? false);
      }
    }

    await this.deleteOrphanedFiles();
  }

  async fullSync(): Promise<void> {
    await this.sync();
    await this.ensureServerFilesAreCached();
  }

  /** Implements FR7 of add-file-attachments */
  async reuploadLocalFiles(): Promise<void> {
    const allHashes = await this.collectActiveFileHashes();

    type BatchEntry = {
      fileRecord: FileRecord;
      item: UploadFileBatchItem;
    };

    const batchEntries: BatchEntry[] = [];

    for (const hash of allHashes) {
      let existingFile = await this.fileRepository.getByHash(hash);
      if (!existingFile?.data) {
        await this.cacheFromServer(hash);
        existingFile = await this.fileRepository.getByHash(hash);
      }
      if (!existingFile?.data) continue;

      const buffer = await existingFile.data.arrayBuffer();
      const base64Data = arrayBufferToBase64(buffer);
      const mimeType = existingFile.data.type || FALLBACK_FILE_MIME_TYPE;

      batchEntries.push({
        fileRecord: existingFile,
        item: {
          local_id: existingFile.data_hash,
          goal_id: "",
          filename: buildFileFilename(existingFile.data_hash, mimeType),
          mime_type: mimeType,
          data: base64Data,
          data_hash: existingFile.data_hash,
        },
      });
    }

    for (
      let offset = 0;
      offset < batchEntries.length;
      offset += MAX_FILE_BATCH_SIZE
    ) {
      const chunk = batchEntries.slice(offset, offset + MAX_FILE_BATCH_SIZE);

      let response: Awaited<ReturnType<typeof this.syncAdapter.uploadFiles>>;
      try {
        response = await this.syncAdapter.uploadFiles({
          files: chunk.map((entry) => entry.item),
        });
      } catch {
        continue; // best-effort: skip this chunk
      }

      // implements FR4, FR7 of add-file-attachments
      for (const result of response.results) {
        if (result.error || !result.data_hash) continue;
        const entry = chunk.find(
          (batchEntry) => batchEntry.fileRecord.data_hash === result.data_hash,
        );
        if (!entry || result.reused) continue;

        await this.fileRepository.save({
          data_hash: entry.fileRecord.data_hash,
          data: entry.fileRecord.data,
        });
      }
    }
  }

  private populateLocalCache(hash: string, data: Blob): void {
    const url = URL.createObjectURL(data);
    localFileCache.set(hash, url);
  }

  private readonly inFlightCaches = new Map<string, Promise<void>>();

  async ensureFileCached(hash: string): Promise<void> {
    if (localFileCache.get(hash)) return;

    const inflightRequest = this.inFlightCaches.get(hash);
    if (inflightRequest) return inflightRequest;

    const cachePromise = this.fetchAndPopulateCache(hash).finally(() => {
      this.inFlightCaches.delete(hash);
    });
    this.inFlightCaches.set(hash, cachePromise);
    return cachePromise;
  }

  private async fetchAndPopulateCache(hash: string): Promise<void> {
    const existingFile = await this.fileRepository.getByHash(hash);
    if (existingFile?.data) {
      const url = URL.createObjectURL(existingFile.data);
      localFileCache.set(hash, url);
      return;
    }
    await this.cacheFromServer(hash);
  }

  /** Implements FR7 of add-file-attachments */
  async ensureServerFilesAreCached(): Promise<void> {
    const allHashes = await this.collectActiveFileHashes();

    console.log(
      "[FileSyncService] ensureServerFilesAreCached: total hashes count =",
      allHashes.size,
    );

    const uncachedHashes = [...allHashes].filter(
      (hash) => hash && !localFileCache.get(hash),
    );
    console.log(
      "[FileSyncService] ensureServerFilesAreCached: uncached hashes =",
      uncachedHashes,
    );

    const missingFromDb: string[] = [];
    for (const hash of uncachedHashes) {
      const existingFile = await this.fileRepository.getByHash(hash);
      if (existingFile?.data) {
        const url = URL.createObjectURL(existingFile.data);
        localFileCache.set(hash, url);
      } else {
        missingFromDb.push(hash);
      }
    }
    console.log(
      "[FileSyncService] ensureServerFilesAreCached: missing from DB =",
      missingFromDb,
    );

    if (missingFromDb.length > 0) {
      console.log(
        "[FileSyncService] ensureServerFilesAreCached: calling batchCacheFromServer",
      );
      await this.batchCacheFromServer(missingFromDb);
    }
  }

  async cacheFromServer(hash: string): Promise<void> {
    const fetchedFile = await this.fetchFromServerAndStore(hash);
    if (fetchedFile?.data) {
      const url = URL.createObjectURL(fetchedFile.data);
      localFileCache.set(hash, url);
    }
  }

  async batchCacheFromServer(hashes: string[]): Promise<void> {
    console.log(
      "[FileSyncService] batchCacheFromServer: total hashes =",
      hashes.length,
    );

    for (
      let offset = 0;
      offset < hashes.length;
      offset += MAX_FILE_BATCH_SIZE
    ) {
      const chunk = hashes.slice(offset, offset + MAX_FILE_BATCH_SIZE);
      console.log(
        "[FileSyncService] batchCacheFromServer: requesting chunk, size =",
        chunk.length,
        "hashes =",
        chunk,
      );

      try {
        const response = await this.syncAdapter.getFile({
          hashes: chunk,
        });
        console.log(
          "[FileSyncService] batchCacheFromServer: received response, files count =",
          response.files.length,
        );

        for (const fileResult of response.files) {
          if (fileResult.error || !fileResult.data) continue;
          try {
            const mimeType = fileResult.mime_type ?? FALLBACK_FILE_MIME_TYPE;
            const blob = base64ToBlob(fileResult.data, mimeType);
            const fileRecord: FileRecord = {
              data_hash: fileResult.hash,
              data: blob,
            };
            await this.fileRepository.save(fileRecord);
            const url = URL.createObjectURL(blob);
            localFileCache.set(fileResult.hash, url);
          } catch (fileError) {
            console.error(
              "[FileSyncService] batchCacheFromServer: failed to process file",
              fileResult.hash,
              fileError,
            );
          }
        }
      } catch (error) {
        console.error(
          "[FileSyncService] batchCacheFromServer: request failed for chunk",
          chunk,
          error,
        );
      }
    }
  }

  /**
   * Deletes files from the server that are no longer referenced by any
   * active goal cover or active attachment. Called after push so the server
   * has up-to-date entity state for accurate ref counting.
   *
   * Implements FR7 of add-file-attachments
   */
  private async deleteOrphanedFiles(): Promise<void> {
    const [allFiles, activeHashes] = await Promise.all([
      this.fileRepository.getAll(),
      this.collectActiveFileHashes(),
    ]);

    for (const file of allFiles) {
      if (activeHashes.has(file.data_hash)) continue;

      try {
        const response = await this.syncAdapter.deleteFile({
          hash: file.data_hash,
        });
        if (response.deleted) {
          await this.fileRepository.delete(file.data_hash);
          localFileCache.delete(file.data_hash);
        }
      } catch {
        // Best-effort: will retry on next sync cycle
      }
    }
  }

  /**
   * Collects all unique file hashes from active goals (cover_hash)
   * and active attachments (data_hash).
   *
   * Implements FR7 of add-file-attachments
   */
  private async collectActiveFileHashes(): Promise<Set<string>> {
    const [activeGoals, allAttachments] = await Promise.all([
      this.goalRepository.getActive(),
      this.attachmentRepository.getAll(),
    ]);

    const hashes = new Set<string>();

    for (const goal of activeGoals) {
      if (goal.cover_hash) {
        hashes.add(goal.cover_hash);
      }
    }

    const activeAttachments = allAttachments.filter(
      (attachment) => !attachment.is_deleted && attachment.data_hash,
    );
    for (const attachment of activeAttachments) {
      hashes.add(attachment.data_hash);
    }

    return hashes;
  }

  private async fetchFromServerAndStore(
    hash: string,
  ): Promise<FileRecord | null> {
    try {
      const response = await this.syncAdapter.getFile({
        hashes: [hash],
      });
      const fileResult = response.files[0];
      if (!fileResult || fileResult.error || !fileResult.data) return null;

      const mimeType = fileResult.mime_type ?? FALLBACK_FILE_MIME_TYPE;
      const blob = base64ToBlob(fileResult.data, mimeType);
      const fileRecord: FileRecord = {
        data_hash: fileResult.hash,
        data: blob,
      };
      await this.fileRepository.save(fileRecord);
      return fileRecord;
    } catch {
      return null;
    }
  }

  private async buildBatchItem(
    pending: PendingFileRecord,
  ): Promise<UploadFileBatchItem> {
    const buffer = await pending.data.arrayBuffer();
    const base64Data = arrayBufferToBase64(buffer);
    return {
      local_id: pending.data_hash,
      goal_id: pending.goal_id,
      filename: pending.filename,
      mime_type: pending.mime_type,
      data: base64Data,
      data_hash: pending.data_hash,
    };
  }

  // implements FR4, FR7 of add-file-attachments
  private async handleSuccessfulUpload(
    pendingFile: PendingFileRecord,
    reused: boolean = false,
  ): Promise<void> {
    if (!reused) {
      await this.fileRepository.save({
        data_hash: pendingFile.data_hash,
        data: pendingFile.data,
      });
    }

    await this.pendingFileRepository.delete(pendingFile.data_hash);
  }
}

function base64ToBlob(base64: string, mimeType: string): Blob {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return new Blob([bytes], { type: mimeType });
}

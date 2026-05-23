import type {
  SyncAdapter,
  UploadCoverBatchItem,
} from "@clear-progress/contract";
import { FALLBACK_COVER_MIME_TYPE, MAX_COVER_BATCH_SIZE } from "@/constants";
import type { CoverRepository } from "@/db/repositories/CoverRepository";
import type { GoalRepository } from "@/db/repositories/GoalRepository";
import type { PendingCoverRepository } from "@/db/repositories/PendingCoverRepository";
import type { CoverRecord, PendingCoverRecord } from "@/types/entities";
import { arrayBufferToBase64, buildCoverFilename } from "./CoverService";
import { localCoverCache } from "./LocalCoverCache";

/**
 * Handles cover sync operations: upload pending covers, download/cache server covers, reupload.
 *
 * Cover deletion (FR11 of spec-sync-protocol) is handled by {@link CoverService.deleteCover}
 * because deletion is a goal-lifecycle operation, not a sync-cycle operation.
 */
export class CoverSyncService {
  constructor(
    private readonly syncAdapter: SyncAdapter,
    private readonly pendingCoverRepository: PendingCoverRepository,
    private readonly coverRepository: CoverRepository,
    private readonly goalRepository: GoalRepository,
  ) {}

  async initializeLocalCovers(): Promise<void> {
    const [pendingCovers, covers] = await Promise.all([
      this.pendingCoverRepository.getAll(),
      this.coverRepository.getAll(),
    ]);

    for (const cover of covers) {
      if (cover.data && !localCoverCache.get(cover.data_hash)) {
        const url = URL.createObjectURL(cover.data);
        localCoverCache.set(cover.data_hash, url);
      }
    }

    for (const pendingCover of pendingCovers) {
      if (!localCoverCache.get(pendingCover.data_hash)) {
        const url = URL.createObjectURL(pendingCover.data);
        localCoverCache.set(pendingCover.data_hash, url);
      }
    }
  }

  async sync(): Promise<void> {
    const pendingCovers = await this.pendingCoverRepository.getAll();

    for (
      let offset = 0;
      offset < pendingCovers.length;
      offset += MAX_COVER_BATCH_SIZE
    ) {
      const chunk = pendingCovers.slice(offset, offset + MAX_COVER_BATCH_SIZE);

      let batchItems: UploadCoverBatchItem[];
      try {
        batchItems = await Promise.all(
          chunk.map((cover) => this.buildBatchItem(cover)),
        );
      } catch {
        break;
      }

      let response: Awaited<ReturnType<typeof this.syncAdapter.uploadCovers>>;
      try {
        response = await this.syncAdapter.uploadCovers({
          covers: batchItems,
        });
      } catch {
        break;
      }

      const pendingByDataHash = new Map(
        chunk.map((cover) => [cover.data_hash, cover]),
      );

      for (const result of response.results) {
        if (result.error || !result.data_hash) continue;
        const pendingCover = pendingByDataHash.get(result.data_hash);
        if (!pendingCover) continue;
        await this.handleSuccessfulUpload(pendingCover, result.reused ?? false);
      }
    }
  }

  async fullSync(): Promise<void> {
    await this.sync();
    await this.ensureServerCoversAreCached();
  }

  async reuploadLocalCovers(): Promise<void> {
    const activeGoals = await this.goalRepository.getActive();

    type BatchEntry = {
      goal: (typeof activeGoals)[number];
      cover: CoverRecord;
      item: UploadCoverBatchItem;
    };

    const batchEntries: BatchEntry[] = [];

    for (const goal of activeGoals) {
      if (!goal.cover_hash) continue;

      let existingCover = await this.coverRepository.getByHash(goal.cover_hash);
      if (!existingCover?.data) {
        await this.cacheFromServer(goal.cover_hash);
        existingCover = await this.coverRepository.getByHash(goal.cover_hash);
      }
      if (!existingCover?.data) continue;

      const buffer = await existingCover.data.arrayBuffer();
      const base64Data = arrayBufferToBase64(buffer);
      const mimeType = existingCover.data.type || FALLBACK_COVER_MIME_TYPE;

      batchEntries.push({
        goal,
        cover: existingCover,
        item: {
          local_id: existingCover.data_hash,
          goal_id: goal.id,
          filename: buildCoverFilename(existingCover.data_hash, mimeType),
          mime_type: mimeType,
          data: base64Data,
          data_hash: existingCover.data_hash,
        },
      });
    }

    for (
      let offset = 0;
      offset < batchEntries.length;
      offset += MAX_COVER_BATCH_SIZE
    ) {
      const chunk = batchEntries.slice(offset, offset + MAX_COVER_BATCH_SIZE);

      let response: Awaited<ReturnType<typeof this.syncAdapter.uploadCovers>>;
      try {
        response = await this.syncAdapter.uploadCovers({
          covers: chunk.map((entry) => entry.item),
        });
      } catch {
        continue; // best-effort: skip this chunk
      }

      // implements FR5, FR7 of content-addressable-covers
      for (const result of response.results) {
        if (result.error || !result.data_hash) continue;
        const entry = chunk.find(
          (batchEntry) => batchEntry.cover.data_hash === result.data_hash,
        );
        if (!entry || result.reused) continue;

        await this.coverRepository.save({
          data_hash: entry.cover.data_hash,
          data: entry.cover.data,
        });
      }
    }
  }

  private readonly inFlightCaches = new Map<string, Promise<void>>();

  async ensureCoverCached(hash: string): Promise<void> {
    if (localCoverCache.get(hash)) return;

    const inflightRequest = this.inFlightCaches.get(hash);
    if (inflightRequest) return inflightRequest;

    const cachePromise = this.fetchAndPopulateCache(hash).finally(() => {
      this.inFlightCaches.delete(hash);
    });
    this.inFlightCaches.set(hash, cachePromise);
    return cachePromise;
  }

  private async fetchAndPopulateCache(hash: string): Promise<void> {
    const existingCover = await this.coverRepository.getByHash(hash);
    if (existingCover?.data) {
      const url = URL.createObjectURL(existingCover.data);
      localCoverCache.set(hash, url);
      return;
    }
    await this.cacheFromServer(hash);
  }

  async ensureServerCoversAreCached(): Promise<void> {
    const activeGoals = await this.goalRepository.getActive();
    console.log(
      "[CoverSyncService] ensureServerCoversAreCached: active goals count =",
      activeGoals.length,
    );

    // implements FR5, FR7 of content-addressable-covers
    const uncachedHashes = activeGoals
      .map((goal) => goal.cover_hash)
      .filter((hash) => hash && !localCoverCache.get(hash));
    console.log(
      "[CoverSyncService] ensureServerCoversAreCached: uncached hashes =",
      uncachedHashes,
    );

    const missingFromDb: string[] = [];
    for (const hash of uncachedHashes) {
      const existingCover = await this.coverRepository.getByHash(hash);
      if (existingCover?.data) {
        const url = URL.createObjectURL(existingCover.data);
        localCoverCache.set(hash, url);
      } else {
        missingFromDb.push(hash);
      }
    }
    console.log(
      "[CoverSyncService] ensureServerCoversAreCached: missing from DB =",
      missingFromDb,
    );

    if (missingFromDb.length > 0) {
      console.log(
        "[CoverSyncService] ensureServerCoversAreCached: calling batchCacheFromServer",
      );
      await this.batchCacheFromServer(missingFromDb);
    }
  }

  async cacheFromServer(hash: string): Promise<void> {
    const fetchedCover = await this.fetchFromServerAndStore(hash);
    if (fetchedCover?.data) {
      const url = URL.createObjectURL(fetchedCover.data);
      localCoverCache.set(hash, url);
    }
  }

  async batchCacheFromServer(hashes: string[]): Promise<void> {
    console.log(
      "[CoverSyncService] batchCacheFromServer: total hashes =",
      hashes.length,
    );

    for (
      let offset = 0;
      offset < hashes.length;
      offset += MAX_COVER_BATCH_SIZE
    ) {
      const chunk = hashes.slice(offset, offset + MAX_COVER_BATCH_SIZE);
      console.log(
        "[CoverSyncService] batchCacheFromServer: requesting chunk, size =",
        chunk.length,
        "hashes =",
        chunk,
      );

      try {
        const response = await this.syncAdapter.getCover({
          hashes: chunk,
        });
        console.log(
          "[CoverSyncService] batchCacheFromServer: received response, covers count =",
          response.covers.length,
        );

        for (const coverResult of response.covers) {
          if (coverResult.error || !coverResult.data) continue;
          try {
            const mimeType = coverResult.mime_type ?? FALLBACK_COVER_MIME_TYPE;
            const blob = base64ToBlob(coverResult.data, mimeType);
            const coverRecord: CoverRecord = {
              data_hash: coverResult.hash,
              data: blob,
            };
            await this.coverRepository.save(coverRecord);
            const url = URL.createObjectURL(blob);
            localCoverCache.set(coverResult.hash, url);
          } catch (coverError) {
            console.error(
              "[CoverSyncService] batchCacheFromServer: failed to process cover",
              coverResult.hash,
              coverError,
            );
          }
        }
      } catch (error) {
        console.error(
          "[CoverSyncService] batchCacheFromServer: request failed for chunk",
          chunk,
          error,
        );
      }
    }
  }

  private async fetchFromServerAndStore(
    hash: string,
  ): Promise<CoverRecord | null> {
    try {
      const response = await this.syncAdapter.getCover({
        hashes: [hash],
      });
      const coverResult = response.covers[0];
      if (!coverResult || coverResult.error || !coverResult.data) return null;

      const mimeType = coverResult.mime_type ?? FALLBACK_COVER_MIME_TYPE;
      const blob = base64ToBlob(coverResult.data, mimeType);
      const coverRecord: CoverRecord = {
        data_hash: coverResult.hash,
        data: blob,
      };
      await this.coverRepository.save(coverRecord);
      return coverRecord;
    } catch {
      return null;
    }
  }

  private async buildBatchItem(
    pending: PendingCoverRecord,
  ): Promise<UploadCoverBatchItem> {
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

  // implements FR5, FR7 of content-addressable-covers
  private async handleSuccessfulUpload(
    pendingCover: PendingCoverRecord,
    reused: boolean = false,
  ): Promise<void> {
    if (!reused) {
      await this.coverRepository.save({
        data_hash: pendingCover.data_hash,
        data: pendingCover.data,
      });
    }

    await this.pendingCoverRepository.delete(pendingCover.data_hash);
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

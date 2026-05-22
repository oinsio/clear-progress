// implements FR5 of content-addressable-covers
import type { SyncAdapter } from "@clear-progress/contract";
import {
  COVER_HASH_PREFIX_LENGTH,
  DEFAULT_COVER_EXTENSION,
  MAX_COVER_SIZE_BYTES,
} from "@/constants";
import type { CoverRepository } from "@/db/repositories/CoverRepository";
import type { PendingCoverRepository } from "@/db/repositories/PendingCoverRepository";
import { toISOTimestamp } from "@/utils/dateHelpers";
import { localCoverCache } from "./LocalCoverCache";

const COVER_ERROR = {
  INVALID_TYPE: "INVALID_TYPE",
  FILE_TOO_LARGE: "FILE_TOO_LARGE",
} as const;

export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  const chunkSize = 8192;
  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    binary += String.fromCharCode(
      ...bytes.subarray(offset, offset + chunkSize),
    );
  }
  return btoa(binary);
}

export async function computeSha256Hex(buffer: ArrayBuffer): Promise<string> {
  const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
  return Array.from(new Uint8Array(hashBuffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export function buildCoverFilename(dataHash: string, mimeType: string): string {
  const subtype = mimeType.split("/")[1] ?? "";
  const ext =
    subtype === "jpeg"
      ? DEFAULT_COVER_EXTENSION
      : subtype || DEFAULT_COVER_EXTENSION;
  return `${dataHash.substring(0, COVER_HASH_PREFIX_LENGTH)}.${ext}`;
}

export function getCoverDisplayUrl(dataHash: string): string | null {
  if (!dataHash) return null;
  return localCoverCache.get(dataHash) ?? null;
}

export class CoverService {
  constructor(
    private readonly syncAdapter: SyncAdapter,
    private readonly coverRepository: CoverRepository,
    private readonly pendingCoverRepository: PendingCoverRepository,
  ) {}

  async uploadCover(
    file: File,
    goalId: string,
  ): Promise<{ data_hash: string }> {
    if (!file.type.startsWith("image/")) {
      throw new Error(COVER_ERROR.INVALID_TYPE);
    }
    if (file.size > MAX_COVER_SIZE_BYTES) {
      throw new Error(COVER_ERROR.FILE_TOO_LARGE);
    }

    const buffer = await file.arrayBuffer();
    const dataHash = await computeSha256Hex(buffer);

    const existingPending =
      await this.pendingCoverRepository.getByHash(dataHash);
    if (existingPending) {
      return { data_hash: dataHash };
    }

    const existingRemote = await this.coverRepository.getByHash(dataHash);
    if (existingRemote) {
      return { data_hash: dataHash };
    }

    try {
      const base64Data = arrayBufferToBase64(buffer);
      await this.syncAdapter.uploadCover({
        goal_id: goalId,
        filename: file.name,
        mime_type: file.type,
        data: base64Data,
        data_hash: dataHash,
      });

      const blob = new Blob([buffer], { type: file.type });
      await this.coverRepository.save({
        data_hash: dataHash,
        data: blob,
      });
      const blobUrl = URL.createObjectURL(blob);
      localCoverCache.set(dataHash, blobUrl);

      return { data_hash: dataHash };
    } catch (error) {
      if (
        error instanceof Error &&
        Object.values(COVER_ERROR).includes(
          error.message as (typeof COVER_ERROR)[keyof typeof COVER_ERROR],
        )
      ) {
        throw error;
      }

      const blob = new Blob([buffer], { type: file.type });
      await this.pendingCoverRepository.save({
        goal_id: goalId,
        data: blob,
        filename: file.name,
        mime_type: file.type,
        data_hash: dataHash,
        created_at: toISOTimestamp(),
      });

      const objectUrl = URL.createObjectURL(blob);
      localCoverCache.set(dataHash, objectUrl);

      return { data_hash: dataHash };
    }
  }

  async deleteCover(dataHash: string, goalId: string): Promise<void> {
    const pendingCover = await this.pendingCoverRepository.getByHash(dataHash);
    if (pendingCover) {
      await this.pendingCoverRepository.delete(dataHash);
      localCoverCache.delete(dataHash);
      return;
    }
    const response = await this.syncAdapter.deleteCover({
      hash: dataHash,
      goal_id: goalId,
    });
    if (response.deleted) {
      await this.coverRepository.delete(dataHash);
      localCoverCache.delete(dataHash);
    }
  }
}

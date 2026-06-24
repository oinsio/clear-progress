/** Implements FR4, FR7 of add-file-attachments */
/** Implements FR2, FR4, FR5 of fix-file-mime-detection */
import type { SyncAdapter } from "@clear-progress/contract";
import {
  ALLOWED_FILE_MIME_TYPES,
  detectMimeType,
} from "@clear-progress/contract";
import { DEFAULT_FILE_EXTENSION, FILE_HASH_PREFIX_LENGTH } from "@/constants";
import type { FileRepository } from "@/db/repositories/FileRepository";
import type { PendingFileRepository } from "@/db/repositories/PendingFileRepository";
import { toISOTimestamp } from "@/utils/dateHelpers";
import { localFileCache } from "./LocalFileCache";

export interface LocalFileRefCounter {
  countLocalRefs(dataHash: string): Promise<number>;
}

const FILE_ERROR = {
  INVALID_TYPE: "INVALID_TYPE",
  FILE_TOO_LARGE: "FILE_TOO_LARGE",
  INVALID_MAGIC_BYTES: "INVALID_MAGIC_BYTES",
  UNRECOGNIZED_FORMAT: "UNRECOGNIZED_FORMAT",
} as const;

/** Implements FR2, FR5 of fix-file-mime-detection */
const TEXT_MIME_TYPES = ["text/plain", "text/markdown"] as const;

function resolveEffectiveMimeType(
  detectedType: string | null,
  browserType: string,
): string {
  if (detectedType !== null) return detectedType;
  if ((TEXT_MIME_TYPES as readonly string[]).includes(browserType))
    return browserType;
  throw new Error(FILE_ERROR.UNRECOGNIZED_FORMAT);
}

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

export function buildFileFilename(dataHash: string, mimeType: string): string {
  const subtype = mimeType.split("/")[1] ?? "";
  const ext =
    subtype === "jpeg"
      ? DEFAULT_FILE_EXTENSION
      : subtype || DEFAULT_FILE_EXTENSION;
  return `${dataHash.substring(0, FILE_HASH_PREFIX_LENGTH)}.${ext}`;
}

export function getFileDisplayUrl(dataHash: string): string | null {
  if (!dataHash) return null;
  return localFileCache.get(dataHash) ?? null;
}

/** Implements FR4, FR7 of add-file-attachments */
export class FileService {
  constructor(
    private readonly syncAdapter: SyncAdapter,
    private readonly fileRepository: FileRepository,
    private readonly pendingFileRepository: PendingFileRepository,
    private readonly localRefCounter?: LocalFileRefCounter,
  ) {}

  /** Implements FR2, FR4, FR5 of fix-file-mime-detection */
  async uploadFile(
    file: File,
    goalId: string,
    sizeLimit: number,
  ): Promise<{ data_hash: string; mime_type: string }> {
    if (file.size > sizeLimit) {
      throw new Error(FILE_ERROR.FILE_TOO_LARGE);
    }

    const buffer = await file.arrayBuffer();
    const detectedMimeType = detectMimeType(buffer);
    const effectiveMimeType = resolveEffectiveMimeType(
      detectedMimeType,
      file.type,
    );

    const allowedTypes: readonly string[] = ALLOWED_FILE_MIME_TYPES;
    if (!allowedTypes.includes(effectiveMimeType)) {
      throw new Error(FILE_ERROR.INVALID_TYPE);
    }

    const dataHash = await computeSha256Hex(buffer);

    const existingPending =
      await this.pendingFileRepository.getByHash(dataHash);
    if (existingPending) {
      return { data_hash: dataHash, mime_type: effectiveMimeType };
    }

    const existingRemote = await this.fileRepository.getByHash(dataHash);
    if (existingRemote) {
      return { data_hash: dataHash, mime_type: effectiveMimeType };
    }

    try {
      const base64Data = arrayBufferToBase64(buffer);
      await this.syncAdapter.uploadFile({
        goal_id: goalId,
        filename: file.name,
        mime_type: effectiveMimeType,
        data: base64Data,
        data_hash: dataHash,
      });

      const blob = new Blob([buffer], { type: effectiveMimeType });
      await this.fileRepository.save({
        data_hash: dataHash,
        data: blob,
      });
      const blobUrl = URL.createObjectURL(blob);
      localFileCache.set(dataHash, blobUrl);

      return { data_hash: dataHash, mime_type: effectiveMimeType };
    } catch (error) {
      if (
        error instanceof Error &&
        Object.values(FILE_ERROR).includes(
          error.message as (typeof FILE_ERROR)[keyof typeof FILE_ERROR],
        )
      ) {
        throw error;
      }

      const blob = new Blob([buffer], { type: effectiveMimeType });
      await this.pendingFileRepository.save({
        goal_id: goalId,
        data: blob,
        filename: file.name,
        mime_type: effectiveMimeType,
        data_hash: dataHash,
        created_at: toISOTimestamp(),
      });

      const objectUrl = URL.createObjectURL(blob);
      localFileCache.set(dataHash, objectUrl);

      return { data_hash: dataHash, mime_type: effectiveMimeType };
    }
  }

  async deleteFile(dataHash: string, _goalId: string): Promise<void> {
    const pendingFile = await this.pendingFileRepository.getByHash(dataHash);
    if (pendingFile) {
      const hasOtherLocalRefs = await this.hasLocalRefs(dataHash);
      if (!hasOtherLocalRefs) {
        await this.pendingFileRepository.delete(dataHash);
        localFileCache.delete(dataHash);
      }
      return;
    }
    const response = await this.syncAdapter.deleteFile({
      hash: dataHash,
    });
    if (response.deleted) {
      const hasOtherLocalRefs = await this.hasLocalRefs(dataHash);
      if (!hasOtherLocalRefs) {
        await this.fileRepository.delete(dataHash);
        localFileCache.delete(dataHash);
      }
    }
  }

  private async hasLocalRefs(dataHash: string): Promise<boolean> {
    if (!this.localRefCounter) return false;
    const refCount = await this.localRefCounter.countLocalRefs(dataHash);
    return refCount > 0;
  }
}

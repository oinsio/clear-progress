/** Implements FR4, FR7 of add-file-attachments */
import type { SyncAdapter } from "@clear-progress/contract";
import {
  ALLOWED_FILE_MIME_TYPES,
  validateMagicBytes,
} from "@clear-progress/contract";
import { DEFAULT_FILE_EXTENSION, FILE_HASH_PREFIX_LENGTH } from "@/constants";
import type { FileRepository } from "@/db/repositories/FileRepository";
import type { PendingFileRepository } from "@/db/repositories/PendingFileRepository";
import { toISOTimestamp } from "@/utils/dateHelpers";
import { localFileCache } from "./LocalFileCache";

const FILE_ERROR = {
  INVALID_TYPE: "INVALID_TYPE",
  FILE_TOO_LARGE: "FILE_TOO_LARGE",
  INVALID_MAGIC_BYTES: "INVALID_MAGIC_BYTES",
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
  ) {}

  async uploadFile(
    file: File,
    goalId: string,
    sizeLimit: number,
  ): Promise<{ data_hash: string }> {
    const allowedTypes: readonly string[] = ALLOWED_FILE_MIME_TYPES;
    if (!allowedTypes.includes(file.type)) {
      throw new Error(FILE_ERROR.INVALID_TYPE);
    }
    if (file.size > sizeLimit) {
      throw new Error(FILE_ERROR.FILE_TOO_LARGE);
    }

    const buffer = await file.arrayBuffer();

    if (!validateMagicBytes(buffer, file.type)) {
      throw new Error(FILE_ERROR.INVALID_MAGIC_BYTES);
    }

    const dataHash = await computeSha256Hex(buffer);

    const existingPending =
      await this.pendingFileRepository.getByHash(dataHash);
    if (existingPending) {
      return { data_hash: dataHash };
    }

    const existingRemote = await this.fileRepository.getByHash(dataHash);
    if (existingRemote) {
      return { data_hash: dataHash };
    }

    try {
      const base64Data = arrayBufferToBase64(buffer);
      await this.syncAdapter.uploadFile({
        goal_id: goalId,
        filename: file.name,
        mime_type: file.type,
        data: base64Data,
        data_hash: dataHash,
      });

      const blob = new Blob([buffer], { type: file.type });
      await this.fileRepository.save({
        data_hash: dataHash,
        data: blob,
      });
      const blobUrl = URL.createObjectURL(blob);
      localFileCache.set(dataHash, blobUrl);

      return { data_hash: dataHash };
    } catch (error) {
      if (
        error instanceof Error &&
        Object.values(FILE_ERROR).includes(
          error.message as (typeof FILE_ERROR)[keyof typeof FILE_ERROR],
        )
      ) {
        throw error;
      }

      const blob = new Blob([buffer], { type: file.type });
      await this.pendingFileRepository.save({
        goal_id: goalId,
        data: blob,
        filename: file.name,
        mime_type: file.type,
        data_hash: dataHash,
        created_at: toISOTimestamp(),
      });

      const objectUrl = URL.createObjectURL(blob);
      localFileCache.set(dataHash, objectUrl);

      return { data_hash: dataHash };
    }
  }

  async deleteFile(dataHash: string, _goalId: string): Promise<void> {
    const pendingFile = await this.pendingFileRepository.getByHash(dataHash);
    if (pendingFile) {
      await this.pendingFileRepository.delete(dataHash);
      localFileCache.delete(dataHash);
      return;
    }
    const response = await this.syncAdapter.deleteFile({
      hash: dataHash,
    });
    if (response.deleted) {
      await this.fileRepository.delete(dataHash);
      localFileCache.delete(dataHash);
    }
  }
}

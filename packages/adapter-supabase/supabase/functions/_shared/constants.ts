// implements FR9, FR10 of add-supabase-adapter
// implements FR2, FR4 of add-file-attachments
// Shared constants: error codes, storage config, file path builder, MIME validation

export const APP_VERSION = "0.1.0";

export const FILES_BUCKET = "files";

export const BATCH_FILE_LIMIT = 10;

export enum ErrorCode {
  UNAUTHORIZED = "UNAUTHORIZED",
  INVALID_PAYLOAD = "INVALID_PAYLOAD",
  NOT_INITIALIZED = "NOT_INITIALIZED",
  INTERNAL_ERROR = "INTERNAL_ERROR",
  SYNC_LOCK_TIMEOUT = "SYNC_LOCK_TIMEOUT",
  FILE_TOO_LARGE = "FILE_TOO_LARGE",
  FILE_NOT_FOUND = "FILE_NOT_FOUND",
  INVALID_MIME_TYPE = "INVALID_MIME_TYPE",
  INVALID_FILE_CONTENT = "INVALID_FILE_CONTENT",
}

/**
 * Builds the Storage path for a file.
 * Pattern (D5): {userId[0:2]}/{userId}/{dataHash[0:2]}/{fileId}.{ext}
 * For single-char userId the prefix is that single char.
 */
export function buildStoragePath(
  userId: string,
  dataHash: string,
  fileId: string,
  ext: string,
): string {
  const userPrefix = userId.length >= 2 ? userId.slice(0, 2) : userId;
  const hashPrefix = dataHash.length >= 2 ? dataHash.slice(0, 2) : dataHash;
  return `${userPrefix}/${userId}/${hashPrefix}/${fileId}.${ext}`;
}

// Duplicated from @clear-progress/contract (not importable in Deno edge functions)
// Source: packages/contract/src/constants.ts — ALLOWED_FILE_MIME_TYPES
export const ALLOWED_FILE_MIME_TYPES: readonly string[] = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "text/plain",
  "text/markdown",
  "application/pdf",
];

// Duplicated from @clear-progress/contract (not importable in Deno edge functions)
// Source: packages/contract/src/constants.ts — FILE_MAGIC_BYTES
export const FILE_MAGIC_BYTES: Record<string, number[][]> = {
  "image/jpeg": [[0xff, 0xd8, 0xff]],
  "image/png": [[0x89, 0x50, 0x4e, 0x47]],
  "image/webp": [[0x52, 0x49, 0x46, 0x46]], // RIFF header
  "image/gif": [[0x47, 0x49, 0x46, 0x38]], // GIF8
  "application/pdf": [[0x25, 0x50, 0x44, 0x46]], // %PDF
  // text/plain and text/markdown have no magic bytes — validated by absence of null bytes
};

// Duplicated from @clear-progress/contract
// Source: packages/contract/src/constants.ts — TEXT_PLAIN_NULL_CHECK_BYTES
export const TEXT_PLAIN_NULL_CHECK_BYTES = 8192;

// implements FR9, FR10 of add-supabase-adapter
// Shared constants: error codes, storage config, cover path builder

export const APP_VERSION = "0.1.0";

export const COVERS_BUCKET = "covers";

export const BATCH_COVER_LIMIT = 10;

export enum ErrorCode {
  UNAUTHORIZED = "UNAUTHORIZED",
  INVALID_PAYLOAD = "INVALID_PAYLOAD",
  NOT_INITIALIZED = "NOT_INITIALIZED",
  INTERNAL_ERROR = "INTERNAL_ERROR",
  SYNC_LOCK_TIMEOUT = "SYNC_LOCK_TIMEOUT",
  FILE_TOO_LARGE = "FILE_TOO_LARGE",
  FILE_NOT_FOUND = "FILE_NOT_FOUND",
}

/**
 * Builds the Storage path for a cover file.
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

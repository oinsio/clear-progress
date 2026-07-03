// implements FR9 of attachment-drag-and-drop
// Server API helpers for upload-file and upload-files Edge Functions.

import type { ServerCallCredentials } from "./server-api.js";

/** Response shape from upload-file / upload-files Edge Functions. */
export interface UploadFileResponse {
  ok: boolean;
  error_code?: string;
  error?: string;
  data_hash?: string;
  reused?: boolean;
}

/**
 * Calls the upload-file Edge Function to upload a single file.
 * Does NOT throw on non-ok HTTP responses — returns the parsed JSON body
 * so callers can assert on error_code.
 * Implements FR9 of attachment-drag-and-drop.
 */
export async function uploadFileToServer(
  credentials: ServerCallCredentials,
  body: Record<string, unknown>,
): Promise<UploadFileResponse> {
  const response = await fetch(
    `${credentials.supabaseUrl}/functions/v1/upload-file`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${credentials.accessToken}`,
        apikey: credentials.anonKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    },
  );
  return (await response.json()) as UploadFileResponse;
}

/** Shape of a single item in the upload-files batch result. */
export interface UploadFileBatchResultItem {
  local_id: string;
  goal_id: string;
  ok: boolean;
  data_hash?: string;
  reused?: boolean;
  error?: string;
  error_code?: string;
}

/** Response shape for upload-files (batch) Edge Function. */
export interface UploadFilesResponse {
  ok: boolean;
  error_code?: string;
  error?: string;
  results?: Array<UploadFileBatchResultItem>;
}

/**
 * Calls the upload-files Edge Function to upload multiple files in a batch.
 * Does NOT throw on non-ok HTTP responses — returns the parsed JSON body
 * so callers can assert on error_code.
 * Implements FR9 of attachment-drag-and-drop.
 */
export async function uploadFilesToServer(
  credentials: ServerCallCredentials,
  body: Record<string, unknown>,
): Promise<UploadFilesResponse> {
  const response = await fetch(
    `${credentials.supabaseUrl}/functions/v1/upload-files`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${credentials.accessToken}`,
        apikey: credentials.anonKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    },
  );
  return (await response.json()) as UploadFilesResponse;
}

// implements FR4 of add-file-attachments
// POST /upload-file — upload a single file with hash deduplication, MIME + magic bytes validation

import { errorResponse, okResponse } from "../_shared/auth.ts";
import { createUserClient } from "../_shared/client.ts";
import {
  buildStoragePath,
  ErrorCode,
  FILES_BUCKET,
} from "../_shared/constants.ts";
import {
  getExtensionFromMimeType,
  isAllowedMimeType,
  validateMagicBytes,
} from "../_shared/files.ts";
import { createAuthHandler, parseJsonBody } from "../_shared/handler.ts";

interface UploadFilePayload {
  goal_id: string;
  filename: string;
  mime_type: string;
  data: string;
  data_hash: string;
}

function isValidPayload(body: unknown): body is UploadFilePayload {
  if (!body || typeof body !== "object") return false;
  const payload = body as Record<string, unknown>;
  return (
    typeof payload.goal_id === "string" &&
    typeof payload.filename === "string" &&
    typeof payload.mime_type === "string" &&
    typeof payload.data === "string" &&
    typeof payload.data_hash === "string"
  );
}

Deno.serve(
  createAuthHandler(
    "POST",
    async ({ userId, accessToken, serviceClient, request }) => {
      const parsed = await parseJsonBody(request);
      if ("error" in parsed) return parsed.error;
      const { body } = parsed;

      if (!isValidPayload(body)) {
        return errorResponse(
          ErrorCode.INVALID_PAYLOAD,
          "Required fields: goal_id, filename, mime_type, data, data_hash",
        );
      }

      // Validate MIME type against allowlist (FR2 of add-file-attachments)
      if (!isAllowedMimeType(body.mime_type)) {
        return errorResponse(
          ErrorCode.INVALID_MIME_TYPE,
          `MIME type not allowed: ${body.mime_type}`,
        );
      }

      // Decode base64 data
      let fileBytes: Uint8Array;
      try {
        fileBytes = Uint8Array.from(atob(body.data), (char) =>
          char.charCodeAt(0),
        );
      } catch {
        return errorResponse(ErrorCode.INVALID_PAYLOAD, "Invalid base64 data");
      }

      // Validate magic bytes (FR2 of add-file-attachments)
      if (!validateMagicBytes(fileBytes, body.mime_type)) {
        return errorResponse(
          ErrorCode.INVALID_FILE_CONTENT,
          "File content does not match declared MIME type",
        );
      }

      // Check for existing file with same hash for this user
      const { data: existingFiles, error: lookupError } = await serviceClient
        .from("files")
        .select("file_id, data_hash")
        .eq("user_id", userId)
        .eq("data_hash", body.data_hash)
        .limit(1);

      if (lookupError) {
        return errorResponse(
          ErrorCode.INTERNAL_ERROR,
          lookupError.message,
          500,
        );
      }

      if (existingFiles && existingFiles.length > 0) {
        const existingFile = existingFiles[0] as {
          file_id: string;
          data_hash: string;
        };

        return okResponse({
          ok: true,
          data_hash: existingFile.data_hash,
          reused: true,
        });
      }

      // New file — upload to Storage
      const fileId = crypto.randomUUID();
      const ext = getExtensionFromMimeType(body.mime_type);
      const storagePath = buildStoragePath(userId, body.data_hash, fileId, ext);

      const userClient = createUserClient(accessToken);
      const { error: uploadError } = await userClient.storage
        .from(FILES_BUCKET)
        .upload(storagePath, fileBytes, {
          contentType: body.mime_type,
          upsert: false,
        });

      if (uploadError) {
        return errorResponse(
          ErrorCode.INTERNAL_ERROR,
          uploadError.message,
          500,
        );
      }

      const { error: insertError } = await serviceClient.from("files").insert({
        file_id: fileId,
        user_id: userId,
        filename: body.filename,
        mime_type: body.mime_type,
        data_hash: body.data_hash,
        storage_path: storagePath,
      });

      if (insertError) {
        // Attempt to clean up the uploaded file
        await userClient.storage.from(FILES_BUCKET).remove([storagePath]);
        return errorResponse(
          ErrorCode.INTERNAL_ERROR,
          insertError.message,
          500,
        );
      }

      return okResponse({ ok: true, data_hash: body.data_hash, reused: false });
    },
  ),
);

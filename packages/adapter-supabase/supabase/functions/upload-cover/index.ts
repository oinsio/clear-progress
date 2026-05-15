// implements FR10 of add-supabase-adapter
// POST /upload-cover — upload a single cover file with hash deduplication

import { errorResponse, okResponse } from "../_shared/auth.ts";
import { createUserClient } from "../_shared/client.ts";
import {
  buildStoragePath,
  COVERS_BUCKET,
  ErrorCode,
} from "../_shared/constants.ts";
import { getExtensionFromMimeType } from "../_shared/covers.ts";
import { createAuthHandler, parseJsonBody } from "../_shared/handler.ts";

interface UploadCoverPayload {
  goal_id: string;
  filename: string;
  mime_type: string;
  data: string;
  data_hash: string;
}

function isValidPayload(body: unknown): body is UploadCoverPayload {
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

      // Check for existing cover with same hash for this user
      const { data: existingCovers, error: lookupError } = await serviceClient
        .from("covers")
        .select("file_id, ref_count")
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

      if (existingCovers && existingCovers.length > 0) {
        const existingCover = existingCovers[0] as {
          file_id: string;
          ref_count: number;
        };

        const { error: updateError } = await serviceClient
          .from("covers")
          .update({ ref_count: existingCover.ref_count + 1 })
          .eq("file_id", existingCover.file_id);

        if (updateError) {
          return errorResponse(
            ErrorCode.INTERNAL_ERROR,
            updateError.message,
            500,
          );
        }

        return okResponse({
          ok: true,
          file_id: existingCover.file_id,
          reused: true,
        });
      }

      // New cover — upload to Storage
      const fileId = crypto.randomUUID();
      const ext = getExtensionFromMimeType(body.mime_type);
      const storagePath = buildStoragePath(userId, body.data_hash, fileId, ext);

      const fileBytes = Uint8Array.from(atob(body.data), (char) =>
        char.charCodeAt(0),
      );

      const userClient = createUserClient(accessToken);
      const { error: uploadError } = await userClient.storage
        .from(COVERS_BUCKET)
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

      const { error: insertError } = await serviceClient.from("covers").insert({
        file_id: fileId,
        user_id: userId,
        filename: body.filename,
        mime_type: body.mime_type,
        data_hash: body.data_hash,
        storage_path: storagePath,
        ref_count: 1,
      });

      if (insertError) {
        // Attempt to clean up the uploaded file
        await userClient.storage.from(COVERS_BUCKET).remove([storagePath]);
        return errorResponse(
          ErrorCode.INTERNAL_ERROR,
          insertError.message,
          500,
        );
      }

      return okResponse({ ok: true, file_id: fileId, reused: false });
    },
  ),
);

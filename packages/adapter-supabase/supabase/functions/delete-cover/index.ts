// implements FR1 of add-supabase-adapter
// implements FR4 of content-addressable-covers
// POST /delete-cover — decrement ref_count; delete file+row when ref_count reaches 0

import { errorResponse, okResponse } from "../_shared/auth.ts";
import { createUserClient } from "../_shared/client.ts";
import { COVERS_BUCKET, ErrorCode } from "../_shared/constants.ts";
import { createAuthHandler, parseJsonBody } from "../_shared/handler.ts";

interface DeleteCoverPayload {
  hash: string;
  goal_id: string;
}

function isValidPayload(body: unknown): body is DeleteCoverPayload {
  if (!body || typeof body !== "object") return false;
  const payload = body as Record<string, unknown>;
  return (
    typeof payload.hash === "string" && typeof payload.goal_id === "string"
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
          "Required fields: hash, goal_id",
        );
      }

      // Fetch cover metadata by (user_id, data_hash)
      const { data: coverRows, error: lookupError } = await serviceClient
        .from("covers")
        .select("file_id, storage_path, ref_count")
        .eq("data_hash", body.hash)
        .eq("user_id", userId)
        .limit(1);

      if (lookupError) {
        return errorResponse(
          ErrorCode.INTERNAL_ERROR,
          lookupError.message,
          500,
        );
      }

      if (!coverRows || coverRows.length === 0) {
        return errorResponse(ErrorCode.FILE_NOT_FOUND, "Cover not found", 404);
      }

      const cover = coverRows[0] as {
        file_id: string;
        storage_path: string;
        ref_count: number;
      };

      if (cover.ref_count > 1) {
        const newRefCount = cover.ref_count - 1;

        const { error: updateError } = await serviceClient
          .from("covers")
          .update({ ref_count: newRefCount })
          .eq("file_id", cover.file_id);

        if (updateError) {
          return errorResponse(
            ErrorCode.INTERNAL_ERROR,
            updateError.message,
            500,
          );
        }

        return okResponse({
          ok: true,
          deleted: false,
          ref_count: newRefCount,
        });
      }

      // Last reference — delete from Storage and remove row
      const userClient = createUserClient(accessToken);
      const { error: storageError } = await userClient.storage
        .from(COVERS_BUCKET)
        .remove([cover.storage_path]);

      if (storageError) {
        return errorResponse(
          ErrorCode.INTERNAL_ERROR,
          storageError.message,
          500,
        );
      }

      const { error: deleteError } = await serviceClient
        .from("covers")
        .delete()
        .eq("file_id", cover.file_id);

      if (deleteError) {
        return errorResponse(
          ErrorCode.INTERNAL_ERROR,
          deleteError.message,
          500,
        );
      }

      return okResponse({ ok: true, deleted: true, ref_count: 0 });
    },
  ),
);

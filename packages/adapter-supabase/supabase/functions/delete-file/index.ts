// implements FR7, FR17 of add-file-attachments
// POST /delete-file — dynamic reference counting; delete file+row when no references remain

import { errorResponse, okResponse } from "../_shared/auth.ts";
import { createUserClient } from "../_shared/client.ts";
import { ErrorCode, FILES_BUCKET } from "../_shared/constants.ts";
import { createAuthHandler, parseJsonBody } from "../_shared/handler.ts";

interface DeleteFilePayload {
  hash: string;
}

function isValidPayload(body: unknown): body is DeleteFilePayload {
  if (!body || typeof body !== "object") return false;
  const payload = body as Record<string, unknown>;
  return typeof payload.hash === "string";
}

Deno.serve(
  createAuthHandler(
    "POST",
    async ({ userId, accessToken, serviceClient, request }) => {
      const parsed = await parseJsonBody(request);
      if ("error" in parsed) return parsed.error;
      const { body } = parsed;

      if (!isValidPayload(body)) {
        return errorResponse(ErrorCode.INVALID_PAYLOAD, "Required field: hash");
      }

      // Fetch file metadata by (user_id, data_hash)
      const { data: fileRows, error: lookupError } = await serviceClient
        .from("files")
        .select("file_id, storage_path")
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

      if (!fileRows || fileRows.length === 0) {
        return errorResponse(ErrorCode.FILE_NOT_FOUND, "File not found", 404);
      }

      const fileRecord = fileRows[0] as {
        file_id: string;
        storage_path: string;
      };

      // Dynamic reference counting: query goals.cover_hash + attachments.data_hash
      const { count: goalRefs, error: goalCountError } = await serviceClient
        .from("goals")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("cover_hash", body.hash);

      if (goalCountError) {
        return errorResponse(
          ErrorCode.INTERNAL_ERROR,
          goalCountError.message,
          500,
        );
      }

      const { count: attachmentRefs, error: attachmentCountError } =
        await serviceClient
          .from("attachments")
          .select("*", { count: "exact", head: true })
          .eq("user_id", userId)
          .eq("data_hash", body.hash);

      if (attachmentCountError) {
        return errorResponse(
          ErrorCode.INTERNAL_ERROR,
          attachmentCountError.message,
          500,
        );
      }

      const totalRefs = (goalRefs ?? 0) + (attachmentRefs ?? 0);

      if (totalRefs > 0) {
        return okResponse({
          ok: true,
          deleted: false,
          ref_count: totalRefs,
        });
      }

      // No references remain — delete from Storage and remove row
      const userClient = createUserClient(accessToken);
      const { error: storageError } = await userClient.storage
        .from(FILES_BUCKET)
        .remove([fileRecord.storage_path]);

      if (storageError) {
        return errorResponse(
          ErrorCode.INTERNAL_ERROR,
          storageError.message,
          500,
        );
      }

      const { error: deleteError } = await serviceClient
        .from("files")
        .delete()
        .eq("file_id", fileRecord.file_id);

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

// implements FR1 of add-supabase-adapter
// POST /get-cover — download covers by file_ids, return base64-encoded data

import { errorResponse, okResponse } from "../_shared/auth.ts";
import { createUserClient } from "../_shared/client.ts";
import { COVERS_BUCKET, ErrorCode } from "../_shared/constants.ts";
import { createAuthHandler, parseJsonBody } from "../_shared/handler.ts";

interface CoverRecord {
  file_id: string;
  storage_path: string;
  mime_type: string;
}

interface CoverFoundResult {
  file_id: string;
  mime_type: string;
  data: string;
}

interface CoverErrorResult {
  file_id: string;
  error: string;
}

type CoverGetResult = CoverFoundResult | CoverErrorResult;

async function fetchCover(
  fileId: string,
  cover: CoverRecord,
  accessToken: string,
): Promise<CoverGetResult> {
  const userClient = createUserClient(accessToken);

  const { data: fileData, error: downloadError } = await userClient.storage
    .from(COVERS_BUCKET)
    .download(cover.storage_path);

  if (downloadError || !fileData) {
    return { file_id: fileId, error: "File not found" };
  }

  const arrayBuffer = await fileData.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);
  const base64 = btoa(String.fromCharCode(...bytes));

  return { file_id: fileId, mime_type: cover.mime_type, data: base64 };
}

Deno.serve(
  createAuthHandler(
    "POST",
    async ({ userId, accessToken, serviceClient, request }) => {
      const parsed = await parseJsonBody(request);
      if ("error" in parsed) return parsed.error;
      const { body } = parsed;

      if (
        !body ||
        typeof body !== "object" ||
        !Array.isArray((body as Record<string, unknown>).file_ids)
      ) {
        return errorResponse(
          ErrorCode.INVALID_PAYLOAD,
          "Required field: file_ids (array)",
        );
      }

      const fileIds = (body as { file_ids: unknown[] }).file_ids.filter(
        (id): id is string => typeof id === "string",
      );

      if (fileIds.length === 0) {
        return okResponse({ ok: true, covers: [] });
      }

      // Fetch covers metadata for this user
      const { data: coverRows, error: lookupError } = await serviceClient
        .from("covers")
        .select("file_id, storage_path, mime_type")
        .eq("user_id", userId)
        .in("file_id", fileIds);

      if (lookupError) {
        return errorResponse(
          ErrorCode.INTERNAL_ERROR,
          lookupError.message,
          500,
        );
      }

      const coverMap = new Map<string, CoverRecord>();
      for (const row of coverRows ?? []) {
        const typedRow = row as CoverRecord;
        coverMap.set(typedRow.file_id, typedRow);
      }

      const covers: CoverGetResult[] = await Promise.all(
        fileIds.map((fileId) => {
          const cover = coverMap.get(fileId);
          if (!cover) {
            return Promise.resolve<CoverGetResult>({
              file_id: fileId,
              error: "File not found",
            });
          }
          return fetchCover(fileId, cover, accessToken);
        }),
      );

      return okResponse({ ok: true, covers });
    },
  ),
);

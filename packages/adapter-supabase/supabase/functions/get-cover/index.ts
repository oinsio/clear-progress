// implements FR1 of add-supabase-adapter
// implements FR3 of content-addressable-covers
// POST /get-cover — download covers by hashes, return base64-encoded data

import { errorResponse, okResponse } from "../_shared/auth.ts";
import { createUserClient } from "../_shared/client.ts";
import { COVERS_BUCKET, ErrorCode } from "../_shared/constants.ts";
import { createAuthHandler, parseJsonBody } from "../_shared/handler.ts";

interface CoverRecord {
  data_hash: string;
  storage_path: string;
  mime_type: string;
}

interface CoverFoundResult {
  hash: string;
  mime_type: string;
  data: string;
}

interface CoverErrorResult {
  hash: string;
  error: string;
}

type CoverGetResult = CoverFoundResult | CoverErrorResult;

async function fetchCover(
  hash: string,
  cover: CoverRecord,
  accessToken: string,
): Promise<CoverGetResult> {
  const userClient = createUserClient(accessToken);

  const { data: fileData, error: downloadError } = await userClient.storage
    .from(COVERS_BUCKET)
    .download(cover.storage_path);

  if (downloadError || !fileData) {
    return { hash, error: "File not found" };
  }

  const arrayBuffer = await fileData.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);
  const base64 = btoa(String.fromCharCode(...bytes));

  return { hash, mime_type: cover.mime_type, data: base64 };
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
        !Array.isArray((body as Record<string, unknown>).hashes)
      ) {
        return errorResponse(
          ErrorCode.INVALID_PAYLOAD,
          "Required field: hashes (array)",
        );
      }

      const hashes = (body as { hashes: unknown[] }).hashes.filter(
        (hash): hash is string => typeof hash === "string",
      );

      if (hashes.length === 0) {
        return okResponse({ ok: true, covers: [] });
      }

      // Fetch covers metadata for this user by data_hash
      const { data: coverRows, error: lookupError } = await serviceClient
        .from("covers")
        .select("data_hash, storage_path, mime_type")
        .eq("user_id", userId)
        .in("data_hash", hashes);

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
        coverMap.set(typedRow.data_hash, typedRow);
      }

      const covers: CoverGetResult[] = await Promise.all(
        hashes.map((hash) => {
          const cover = coverMap.get(hash);
          if (!cover) {
            return Promise.resolve<CoverGetResult>({
              hash,
              error: "File not found",
            });
          }
          return fetchCover(hash, cover, accessToken);
        }),
      );

      return okResponse({ ok: true, covers });
    },
  ),
);

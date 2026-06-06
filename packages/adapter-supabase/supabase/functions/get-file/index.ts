// implements FR4 of add-file-attachments
// POST /get-file — download files by hashes, return base64-encoded data

import { errorResponse, okResponse } from "../_shared/auth.ts";
import { createUserClient } from "../_shared/client.ts";
import { ErrorCode, FILES_BUCKET } from "../_shared/constants.ts";
import { createAuthHandler, parseJsonBody } from "../_shared/handler.ts";

interface FileRecord {
  data_hash: string;
  storage_path: string;
  mime_type: string;
}

interface FileFoundResult {
  hash: string;
  mime_type: string;
  data: string;
}

interface FileErrorResult {
  hash: string;
  error: string;
}

type FileGetResult = FileFoundResult | FileErrorResult;

async function fetchFile(
  hash: string,
  fileRecord: FileRecord,
  accessToken: string,
): Promise<FileGetResult> {
  const userClient = createUserClient(accessToken);

  const { data: fileData, error: downloadError } = await userClient.storage
    .from(FILES_BUCKET)
    .download(fileRecord.storage_path);

  if (downloadError || !fileData) {
    return { hash, error: "File not found" };
  }

  const arrayBuffer = await fileData.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);
  const base64 = btoa(String.fromCharCode(...bytes));

  return { hash, mime_type: fileRecord.mime_type, data: base64 };
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
        return okResponse({ ok: true, files: [] });
      }

      // Fetch file metadata for this user by data_hash
      const { data: fileRows, error: lookupError } = await serviceClient
        .from("files")
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

      const fileMap = new Map<string, FileRecord>();
      for (const row of fileRows ?? []) {
        const typedRow = row as FileRecord;
        fileMap.set(typedRow.data_hash, typedRow);
      }

      const files: FileGetResult[] = await Promise.all(
        hashes.map((hash) => {
          const fileRecord = fileMap.get(hash);
          if (!fileRecord) {
            return Promise.resolve<FileGetResult>({
              hash,
              error: "File not found",
            });
          }
          return fetchFile(hash, fileRecord, accessToken);
        }),
      );

      return okResponse({ ok: true, files });
    },
  ),
);

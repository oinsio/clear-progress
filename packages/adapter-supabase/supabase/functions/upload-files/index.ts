// implements FR4 of add-file-attachments
// POST /upload-files — batch upload files (max 10), MIME + magic bytes validation

import { errorResponse, okResponse } from "../_shared/auth.ts";
import {
  createServiceRoleClient,
  createUserClient,
} from "../_shared/client.ts";
import {
  BATCH_FILE_LIMIT,
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

interface FileItem {
  local_id: string;
  goal_id: string;
  filename: string;
  mime_type: string;
  data: string;
  data_hash: string;
}

interface FileResult {
  local_id: string;
  goal_id: string;
  ok: boolean;
  data_hash?: string;
  reused?: boolean;
  error?: string;
}

function isValidFileItem(item: unknown): item is FileItem {
  if (!item || typeof item !== "object") return false;
  const fileItem = item as Record<string, unknown>;
  return (
    typeof fileItem.local_id === "string" &&
    typeof fileItem.goal_id === "string" &&
    typeof fileItem.filename === "string" &&
    typeof fileItem.mime_type === "string" &&
    typeof fileItem.data === "string" &&
    typeof fileItem.data_hash === "string"
  );
}

async function processSingleFile(
  item: FileItem,
  userId: string,
  accessToken: string,
): Promise<FileResult> {
  // Validate MIME type (FR2 of add-file-attachments)
  if (!isAllowedMimeType(item.mime_type)) {
    return {
      local_id: item.local_id,
      goal_id: item.goal_id,
      ok: false,
      error: `MIME type not allowed: ${item.mime_type}`,
    };
  }

  let fileBytes: Uint8Array;
  try {
    fileBytes = Uint8Array.from(atob(item.data), (char) => char.charCodeAt(0));
  } catch {
    return {
      local_id: item.local_id,
      goal_id: item.goal_id,
      ok: false,
      error: "Invalid base64 data",
    };
  }

  // Validate magic bytes (FR2 of add-file-attachments)
  if (!validateMagicBytes(fileBytes, item.mime_type)) {
    return {
      local_id: item.local_id,
      goal_id: item.goal_id,
      ok: false,
      error: "File content does not match declared MIME type",
    };
  }

  const serviceClient = createServiceRoleClient();

  const { data: existingFiles, error: lookupError } = await serviceClient
    .from("files")
    .select("file_id")
    .eq("user_id", userId)
    .eq("data_hash", item.data_hash)
    .limit(1);

  if (lookupError) {
    return {
      local_id: item.local_id,
      goal_id: item.goal_id,
      ok: false,
      error: lookupError.message,
    };
  }

  if (existingFiles && existingFiles.length > 0) {
    return {
      local_id: item.local_id,
      goal_id: item.goal_id,
      ok: true,
      data_hash: item.data_hash,
      reused: true,
    };
  }

  // New file — upload to Storage
  const fileId = crypto.randomUUID();
  const ext = getExtensionFromMimeType(item.mime_type);
  const storagePath = buildStoragePath(userId, item.data_hash, fileId, ext);

  const userClient = createUserClient(accessToken);
  const { error: uploadError } = await userClient.storage
    .from(FILES_BUCKET)
    .upload(storagePath, fileBytes, {
      contentType: item.mime_type,
      upsert: false,
    });

  if (uploadError) {
    return {
      local_id: item.local_id,
      goal_id: item.goal_id,
      ok: false,
      error: uploadError.message,
    };
  }

  const { error: insertError } = await serviceClient.from("files").insert({
    file_id: fileId,
    user_id: userId,
    filename: item.filename,
    mime_type: item.mime_type,
    data_hash: item.data_hash,
    storage_path: storagePath,
  });

  if (insertError) {
    await userClient.storage.from(FILES_BUCKET).remove([storagePath]);
    return {
      local_id: item.local_id,
      goal_id: item.goal_id,
      ok: false,
      error: insertError.message,
    };
  }

  return {
    local_id: item.local_id,
    goal_id: item.goal_id,
    ok: true,
    data_hash: item.data_hash,
    reused: false,
  };
}

Deno.serve(
  createAuthHandler("POST", async ({ userId, accessToken, request }) => {
    const parsed = await parseJsonBody(request);
    if ("error" in parsed) return parsed.error;
    const { body } = parsed;

    if (
      !body ||
      typeof body !== "object" ||
      !Array.isArray((body as Record<string, unknown>).files)
    ) {
      return errorResponse(
        ErrorCode.INVALID_PAYLOAD,
        "Required field: files (array)",
      );
    }

    const files = (body as { files: unknown[] }).files;

    if (files.length > BATCH_FILE_LIMIT) {
      return okResponse({ ok: false, results: [] });
    }

    const results: FileResult[] = await Promise.all(
      files.map((item) => {
        if (!isValidFileItem(item)) {
          const localId =
            item &&
            typeof item === "object" &&
            typeof (item as Record<string, unknown>).local_id === "string"
              ? (item as { local_id: string }).local_id
              : "unknown";
          const goalId =
            item &&
            typeof item === "object" &&
            typeof (item as Record<string, unknown>).goal_id === "string"
              ? (item as { goal_id: string }).goal_id
              : "unknown";
          return Promise.resolve({
            local_id: localId,
            goal_id: goalId,
            ok: false,
            error: "Invalid file item: missing required fields",
          });
        }
        return processSingleFile(item, userId, accessToken);
      }),
    );

    return okResponse({ ok: true, results });
  }),
);

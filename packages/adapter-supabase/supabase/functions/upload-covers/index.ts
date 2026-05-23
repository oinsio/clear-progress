// implements FR10 of add-supabase-adapter
// POST /upload-covers — batch upload covers (max 10), per-item error handling

import { errorResponse, okResponse } from "../_shared/auth.ts";
import {
  createServiceRoleClient,
  createUserClient,
} from "../_shared/client.ts";
import {
  BATCH_COVER_LIMIT,
  buildStoragePath,
  COVERS_BUCKET,
  ErrorCode,
} from "../_shared/constants.ts";
import { getExtensionFromMimeType } from "../_shared/covers.ts";
import { createAuthHandler, parseJsonBody } from "../_shared/handler.ts";

interface CoverItem {
  goal_id: string;
  filename: string;
  mime_type: string;
  data: string;
  data_hash: string;
}

interface CoverResult {
  goal_id: string;
  ok: boolean;
  data_hash?: string;
  reused?: boolean;
  error?: string;
}

function isValidCoverItem(item: unknown): item is CoverItem {
  if (!item || typeof item !== "object") return false;
  const coverItem = item as Record<string, unknown>;
  return (
    typeof coverItem.goal_id === "string" &&
    typeof coverItem.filename === "string" &&
    typeof coverItem.mime_type === "string" &&
    typeof coverItem.data === "string" &&
    typeof coverItem.data_hash === "string"
  );
}

async function processSingleCover(
  item: CoverItem,
  userId: string,
  accessToken: string,
): Promise<CoverResult> {
  const serviceClient = createServiceRoleClient();

  const { data: existingCovers, error: lookupError } = await serviceClient
    .from("covers")
    .select("file_id, ref_count")
    .eq("user_id", userId)
    .eq("data_hash", item.data_hash)
    .limit(1);

  if (lookupError) {
    return { goal_id: item.goal_id, ok: false, error: lookupError.message };
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
      return { goal_id: item.goal_id, ok: false, error: updateError.message };
    }

    return {
      goal_id: item.goal_id,
      ok: true,
      data_hash: item.data_hash,
      reused: true,
    };
  }

  // New cover — upload to Storage
  const fileId = crypto.randomUUID();
  const ext = getExtensionFromMimeType(item.mime_type);
  const storagePath = buildStoragePath(userId, item.data_hash, fileId, ext);

  let fileBytes: Uint8Array;
  try {
    fileBytes = Uint8Array.from(atob(item.data), (char) => char.charCodeAt(0));
  } catch {
    return {
      goal_id: item.goal_id,
      ok: false,
      error: "Invalid base64 data",
    };
  }

  const userClient = createUserClient(accessToken);
  const { error: uploadError } = await userClient.storage
    .from(COVERS_BUCKET)
    .upload(storagePath, fileBytes, {
      contentType: item.mime_type,
      upsert: false,
    });

  if (uploadError) {
    return { goal_id: item.goal_id, ok: false, error: uploadError.message };
  }

  const { error: insertError } = await serviceClient.from("covers").insert({
    file_id: fileId,
    user_id: userId,
    filename: item.filename,
    mime_type: item.mime_type,
    data_hash: item.data_hash,
    storage_path: storagePath,
    ref_count: 1,
  });

  if (insertError) {
    await userClient.storage.from(COVERS_BUCKET).remove([storagePath]);
    return { goal_id: item.goal_id, ok: false, error: insertError.message };
  }

  return {
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
      !Array.isArray((body as Record<string, unknown>).covers)
    ) {
      return errorResponse(
        ErrorCode.INVALID_PAYLOAD,
        "Required field: covers (array)",
      );
    }

    const covers = (body as { covers: unknown[] }).covers;

    if (covers.length > BATCH_COVER_LIMIT) {
      return okResponse({ ok: false, results: [] });
    }

    const results: CoverResult[] = await Promise.all(
      covers.map((item) => {
        if (!isValidCoverItem(item)) {
          const goalId =
            item &&
            typeof item === "object" &&
            typeof (item as Record<string, unknown>).goal_id === "string"
              ? (item as { goal_id: string }).goal_id
              : "unknown";
          return Promise.resolve({
            goal_id: goalId,
            ok: false,
            error: "Invalid cover item: missing required fields",
          });
        }
        return processSingleCover(item, userId, accessToken);
      }),
    );

    return okResponse({ ok: true, results });
  }),
);

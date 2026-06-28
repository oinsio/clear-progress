// implements FR1 of add-supabase-adapter
// implements FR17 of add-file-attachments
// POST /purge — hard-delete all is_deleted=true records, then clean up orphaned files

import { errorResponse, okResponse } from "../_shared/auth.ts";
import { createUserClient } from "../_shared/client.ts";
import { ErrorCode, FILES_BUCKET } from "../_shared/constants.ts";
import { createAuthHandler } from "../_shared/handler.ts";

const ENTITY_TABLES = [
  "tasks",
  "goals",
  "ideas",
  "contexts",
  "categories",
  "checklist_items",
  "attachments",
] as const;

type EntityTable = (typeof ENTITY_TABLES)[number];

Deno.serve(
  createAuthHandler("POST", async ({ userId, accessToken, serviceClient }) => {
    // Check user is initialized (sync_meta rows exist)
    const { data: metaRows, error: metaError } = await serviceClient
      .from("sync_meta")
      .select("key, value")
      .eq("user_id", userId);

    if (metaError) {
      return errorResponse(ErrorCode.INTERNAL_ERROR, metaError.message, 500);
    }

    if (!metaRows || metaRows.length === 0) {
      return errorResponse(
        ErrorCode.NOT_INITIALIZED,
        "User not initialized. Call /init first.",
      );
    }

    // Bump dependent records' revision, then hard-delete all soft-deleted records
    // via atomic RPC (implements FR4 of fix-push-poison-pill)
    const { data: purgeResult, error: purgeError } = await serviceClient.rpc(
      "purge_deleted_records",
      { p_user_id: userId },
    );

    if (purgeError) {
      return errorResponse(ErrorCode.INTERNAL_ERROR, purgeError.message, 500);
    }

    const newPurgeRevision = purgeResult.purge_revision;

    const purgedCounts = Object.fromEntries(
      ENTITY_TABLES.map((table) => [table, purgeResult.purged[table] ?? 0]),
    ) as Record<EntityTable, number>;

    // Clean up orphaned files (no references in goals.cover_hash or attachments.data_hash)
    const orphanedFilesCount = await purgeOrphanedFiles(
      userId,
      accessToken,
      serviceClient,
    );

    return okResponse({
      ok: true,
      purged: { ...purgedCounts, files: orphanedFilesCount },
      purge_revision: newPurgeRevision,
    });
  }),
);

async function purgeOrphanedFiles(
  userId: string,
  accessToken: string,
  serviceClient: import("npm:@supabase/supabase-js@2").SupabaseClient,
): Promise<number> {
  // Fetch all user files
  const { data: userFiles, error: filesError } = await serviceClient
    .from("files")
    .select("file_id, storage_path, data_hash")
    .eq("user_id", userId);

  if (filesError || !userFiles || userFiles.length === 0) {
    return 0;
  }

  // Fetch referenced hashes from goals and attachments in parallel
  const [goalsResult, attachmentsResult] = await Promise.all([
    serviceClient
      .from("goals")
      .select("cover_hash")
      .eq("user_id", userId)
      .neq("cover_hash", ""),
    serviceClient.from("attachments").select("data_hash").eq("user_id", userId),
  ]);

  const referencedHashes = new Set<string>();

  if (goalsResult.data) {
    for (const row of goalsResult.data) {
      referencedHashes.add(row.cover_hash);
    }
  }

  if (attachmentsResult.data) {
    for (const row of attachmentsResult.data) {
      referencedHashes.add(row.data_hash);
    }
  }

  const orphanedFiles = userFiles.filter(
    (file: { data_hash: string }) => !referencedHashes.has(file.data_hash),
  );

  if (orphanedFiles.length === 0) {
    return 0;
  }

  // Delete from Storage using user client (RLS-scoped)
  const userClient = createUserClient(accessToken);
  const storagePaths = orphanedFiles.map(
    (file: { storage_path: string }) => file.storage_path,
  );
  await userClient.storage.from(FILES_BUCKET).remove(storagePaths);

  // Delete rows from files table
  const orphanedIds = orphanedFiles.map(
    (file: { file_id: string }) => file.file_id,
  );
  await serviceClient
    .from("files")
    .delete()
    .eq("user_id", userId)
    .in("file_id", orphanedIds);

  return orphanedFiles.length;
}

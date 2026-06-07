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
    // Check initialized and get current purge_revision
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

    const currentPurgeRevision =
      metaRows.find(
        (r: { key: string; value: number }) => r.key === "purge_revision",
      )?.value ?? 0;

    // Delete soft-deleted records from all entity tables in parallel
    const deleteResults = await Promise.all(
      ENTITY_TABLES.map((table) =>
        serviceClient
          .from(table)
          .delete({ count: "exact" })
          .eq("user_id", userId)
          .eq("is_deleted", true),
      ),
    );

    const deleteError = deleteResults.find(
      (r: { error: unknown }) => r.error,
    )?.error;
    if (deleteError) {
      return errorResponse(ErrorCode.INTERNAL_ERROR, deleteError.message, 500);
    }

    const newPurgeRevision = currentPurgeRevision + 1;

    const { error: updateError } = await serviceClient
      .from("sync_meta")
      .update({ value: newPurgeRevision })
      .eq("user_id", userId)
      .eq("key", "purge_revision");

    if (updateError) {
      return errorResponse(ErrorCode.INTERNAL_ERROR, updateError.message, 500);
    }

    const purgedCounts = Object.fromEntries(
      ENTITY_TABLES.map((table, index) => [
        table,
        deleteResults[index].count ?? 0,
      ]),
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

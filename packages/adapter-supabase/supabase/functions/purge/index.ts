// implements FR1 of add-supabase-adapter
// POST /purge — hard-delete all is_deleted=true records for the authenticated user

import { errorResponse, okResponse } from "../_shared/auth.ts";
import { ErrorCode } from "../_shared/constants.ts";
import { createAuthHandler } from "../_shared/handler.ts";

const ENTITY_TABLES = [
  "tasks",
  "goals",
  "ideas",
  "contexts",
  "categories",
  "checklist_items",
] as const;

type EntityTable = (typeof ENTITY_TABLES)[number];

Deno.serve(
  createAuthHandler("POST", async ({ userId, serviceClient }) => {
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

    return okResponse({
      ok: true,
      purged: purgedCounts,
      purge_revision: newPurgeRevision,
    });
  }),
);

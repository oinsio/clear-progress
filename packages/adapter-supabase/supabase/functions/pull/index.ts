// implements FR4, FR14 of add-supabase-adapter
// implements FR6 of add-file-attachments
// implements FR1, FR2, FR3, FR8, FR9 of fix-pull-pagination
// POST /pull — returns all records with revision > since_revision for the authenticated user

import { errorResponse, okResponse } from "../_shared/auth.ts";
import { ErrorCode } from "../_shared/constants.ts";
import { createAuthHandler, parseJsonBody } from "../_shared/handler.ts";
import {
  serializeAttachmentRow,
  serializeCategoryRow,
  serializeChecklistItemRow,
  serializeContextRow,
  serializeGoalRow,
  serializeIdeaRow,
  serializeSettingRow,
  serializeTaskRow,
} from "../_shared/serializers.ts";

Deno.serve(
  createAuthHandler("POST", async ({ userId, serviceClient, request }) => {
    const parsed = await parseJsonBody(request);
    if ("error" in parsed) return parsed.error;
    const body = parsed.body as {
      since_revision?: unknown;
      settings_updated_at?: unknown;
      cursors?: Record<string, { revision: number; last_id: string }>;
    };

    if (typeof body.since_revision !== "number") {
      return errorResponse(
        ErrorCode.INVALID_PAYLOAD,
        "since_revision must be a number",
      );
    }

    const sinceRevision = body.since_revision;
    const settingsUpdatedAt =
      typeof body.settings_updated_at === "string"
        ? body.settings_updated_at
        : undefined;

    const requestCursors = body.cursors ?? {};

    // Read sync_meta: check initialized and get revision counters
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

    const nextRevision =
      metaRows.find(
        (r: { key: string; value: number }) => r.key === "next_revision",
      )?.value ?? 1;
    const purgeRevision =
      metaRows.find(
        (r: { key: string; value: number }) => r.key === "purge_revision",
      )?.value ?? 0;
    const latestRevision = nextRevision - 1;

    // Run entity queries in parallel with exact count for pagination
    const entityQueryBase = (table: string) => {
      const cursor = requestCursors[table];
      let query = serviceClient
        .from(table)
        .select("*", { count: "exact" })
        .eq("user_id", userId);

      if (cursor) {
        // Composite cursor: rows after (revision, id) in sort order
        query = query.or(
          `revision.gt.${cursor.revision},and(revision.eq.${cursor.revision},id.gt.${cursor.last_id})`,
        );
      } else {
        query = query.gt("revision", sinceRevision);
      }

      return query
        .order("revision", { ascending: true })
        .order("id", { ascending: true });
    };

    let settingsQuery = serviceClient
      .from("settings")
      .select("*")
      .eq("user_id", userId);
    if (settingsUpdatedAt) {
      settingsQuery = settingsQuery.gt("updated_at", settingsUpdatedAt);
    }

    const [
      tasksResult,
      goalsResult,
      ideasResult,
      contextsResult,
      categoriesResult,
      checklistResult,
      attachmentsResult,
      settingsResult,
    ] = await Promise.all([
      entityQueryBase("tasks"),
      entityQueryBase("goals"),
      entityQueryBase("ideas"),
      entityQueryBase("contexts"),
      entityQueryBase("categories"),
      entityQueryBase("checklist_items"),
      entityQueryBase("attachments"),
      settingsQuery,
    ]);

    const firstError =
      tasksResult.error ??
      goalsResult.error ??
      ideasResult.error ??
      contextsResult.error ??
      categoriesResult.error ??
      checklistResult.error ??
      attachmentsResult.error ??
      settingsResult.error;

    if (firstError) {
      return errorResponse(ErrorCode.INTERNAL_ERROR, firstError.message, 500);
    }

    // Compute has_more: true if any entity table has more rows than returned
    const entityResults = [
      tasksResult,
      goalsResult,
      ideasResult,
      contextsResult,
      categoriesResult,
      checklistResult,
      attachmentsResult,
    ];

    const hasMore = entityResults.some(
      (result) =>
        result.count !== null &&
        result.count !== undefined &&
        result.count > (result.data ?? []).length,
    );

    // Map entity results to table names for cursor building
    const entityTableNames = [
      "tasks",
      "goals",
      "ideas",
      "contexts",
      "categories",
      "checklist_items",
      "attachments",
    ] as const;

    // Compute current_revision based on pagination state
    let currentRevision: number;
    let responseCursors:
      | Record<string, { revision: number; last_id: string }>
      | undefined;

    if (hasMore) {
      // Find the minimum max-revision across entity tables that have data
      const maxRevisions = entityResults
        .filter((result) => (result.data ?? []).length > 0)
        .map((result) => {
          const rows = result.data ?? [];
          const lastRow = rows[rows.length - 1];
          return lastRow.revision as number;
        });

      currentRevision =
        maxRevisions.length > 0 ? Math.min(...maxRevisions) : latestRevision;

      // Build cursors for truncated tables
      responseCursors = {};
      entityResults.forEach((result, index) => {
        const rows = result.data ?? [];
        const totalCount = result.count ?? 0;
        if (totalCount > rows.length && rows.length > 0) {
          const lastRow = rows[rows.length - 1];
          responseCursors![entityTableNames[index]] = {
            revision: lastRow.revision as number,
            last_id: lastRow.id as string,
          };
        }
      });
    } else {
      currentRevision = latestRevision;
    }

    return okResponse({
      ok: true,
      tasks: (tasksResult.data ?? []).map(serializeTaskRow),
      goals: (goalsResult.data ?? []).map(serializeGoalRow),
      ideas: (ideasResult.data ?? []).map(serializeIdeaRow),
      contexts: (contextsResult.data ?? []).map(serializeContextRow),
      categories: (categoriesResult.data ?? []).map(serializeCategoryRow),
      checklist_items: (checklistResult.data ?? []).map(
        serializeChecklistItemRow,
      ),
      attachments: (attachmentsResult.data ?? []).map(serializeAttachmentRow),
      settings: (settingsResult.data ?? []).map(serializeSettingRow),
      current_revision: currentRevision,
      has_more: hasMore,
      ...(responseCursors ? { cursors: responseCursors } : {}),
      purge_revision: purgeRevision,
      server_time: new Date().toISOString(),
    });
  }),
);

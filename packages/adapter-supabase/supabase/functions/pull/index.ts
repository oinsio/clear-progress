// implements FR4, FR14 of add-supabase-adapter
// implements FR6 of add-file-attachments
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
    const currentRevision = nextRevision - 1;

    // Run entity queries in parallel
    const entityQueryBase = (table: string) =>
      serviceClient
        .from(table)
        .select("*")
        .eq("user_id", userId)
        .gt("revision", sinceRevision);

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
      purge_revision: purgeRevision,
      server_time: new Date().toISOString(),
    });
  }),
);

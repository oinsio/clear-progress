// implements FR3, NFR-P2, D1 of add-supabase-adapter
// implements FR6 of add-file-attachments
// implements FR9 of fix-push-poison-pill
// POST /push — validates incoming records with Zod, delegates valid records to push_records RPC

import { errorResponse, okResponse } from "../_shared/auth.ts";
import { ErrorCode } from "../_shared/constants.ts";
import { createAuthHandler, parseJsonBody } from "../_shared/handler.ts";
import {
  logRejectedRecords,
  logRpcRejectedRecords,
  type RejectedRecord,
  validateEntityRecords,
  validateSettingRecords,
} from "../_shared/validation.ts";

const LOCK_TIMEOUT_PG_CODE = "55P03";
const USER_NOT_INITIALIZED_MSG = "USER_NOT_INITIALIZED";

const ENTITY_TYPES = [
  "tasks",
  "goals",
  "contexts",
  "categories",
  "ideas",
  "checklist_items",
  "attachments",
] as const;

interface PushBody {
  tasks?: unknown[];
  goals?: unknown[];
  contexts?: unknown[];
  categories?: unknown[];
  ideas?: unknown[];
  checklist_items?: unknown[];
  attachments?: unknown[];
  settings?: unknown[];
}

// implements FR9 of fix-push-poison-pill
interface ValidationSplit {
  validBody: PushBody;
  allRejected: Record<string, RejectedRecord[]>;
}

/**
 * Validates all entity and setting records in the push body.
 * Returns valid records for RPC and rejected records for the response.
 * implements FR9 of fix-push-poison-pill
 */
function validatePushBody(body: PushBody, userId: string): ValidationSplit {
  const validBody: PushBody = {};
  const allRejected: Record<string, RejectedRecord[]> = {};

  for (const entityType of ENTITY_TYPES) {
    const records = body[entityType] ?? [];
    if (records.length === 0) continue;

    const { validRecords, rejectedResults } = validateEntityRecords(
      entityType,
      records,
    );
    validBody[entityType] = validRecords;

    if (rejectedResults.length > 0) {
      allRejected[entityType] = rejectedResults;
      logRejectedRecords(userId, entityType, rejectedResults);
    }
  }

  const settingRecords = body.settings ?? [];
  if (settingRecords.length > 0) {
    const { validRecords, rejectedResults } =
      validateSettingRecords(settingRecords);
    validBody.settings = validRecords;

    if (rejectedResults.length > 0) {
      allRejected.settings = rejectedResults;
      logRejectedRecords(userId, "settings", rejectedResults);
    }
  }

  return { validBody, allRejected };
}

Deno.serve(
  createAuthHandler("POST", async ({ userId, serviceClient, request }) => {
    const parsed = await parseJsonBody(request);
    if ("error" in parsed) return parsed.error;
    const body = parsed.body as PushBody;

    // implements FR9 of fix-push-poison-pill — validate before RPC
    const { validBody, allRejected } = validatePushBody(body, userId);

    const { data, error } = await serviceClient.rpc("push_records", {
      p_user_id: userId,
      p_tasks: validBody.tasks ?? [],
      p_goals: validBody.goals ?? [],
      p_contexts: validBody.contexts ?? [],
      p_categories: validBody.categories ?? [],
      p_ideas: validBody.ideas ?? [],
      p_checklist_items: validBody.checklist_items ?? [],
      p_attachments: validBody.attachments ?? [],
      p_settings: validBody.settings ?? [],
    });

    if (error) {
      if (error.message?.includes(USER_NOT_INITIALIZED_MSG)) {
        return errorResponse(
          ErrorCode.NOT_INITIALIZED,
          "User not initialized. Call /init first.",
        );
      }
      if (error.code === LOCK_TIMEOUT_PG_CODE) {
        return errorResponse(
          ErrorCode.SYNC_LOCK_TIMEOUT,
          "Could not acquire sync lock. Please retry.",
          503,
        );
      }
      return errorResponse(ErrorCode.INTERNAL_ERROR, error.message, 500);
    }

    const rpcResult = data as {
      revision: number;
      results: Record<string, unknown[]>;
    };

    // implements FR9 of fix-push-poison-pill — log RPC-rejected records
    for (const entityType of [...ENTITY_TYPES, "settings"] as const) {
      const entityResults = rpcResult.results[entityType];
      if (Array.isArray(entityResults)) {
        logRpcRejectedRecords(
          userId,
          entityType,
          entityResults as Array<{
            id?: string;
            key?: string;
            status: string;
            reason?: string;
          }>,
        );
      }
    }

    // Merge Zod-rejected records into RPC results
    const mergedResults = { ...rpcResult.results };
    for (const [entityType, rejectedRecords] of Object.entries(allRejected)) {
      const existingResults = Array.isArray(mergedResults[entityType])
        ? (mergedResults[entityType] as unknown[])
        : [];
      mergedResults[entityType] = [...existingResults, ...rejectedRecords];
    }

    return okResponse({
      ok: true,
      revision: rpcResult.revision,
      results: mergedResults,
      server_time: new Date().toISOString(),
    });
  }),
);

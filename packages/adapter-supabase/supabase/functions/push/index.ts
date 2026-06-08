// implements FR3, NFR-P2, D1 of add-supabase-adapter
// implements FR6 of add-file-attachments
// POST /push — delegates transactional logic to push_records PostgreSQL RPC function

import { errorResponse, okResponse } from "../_shared/auth.ts";
import { ErrorCode } from "../_shared/constants.ts";
import { createAuthHandler, parseJsonBody } from "../_shared/handler.ts";

const LOCK_TIMEOUT_PG_CODE = "55P03";
const USER_NOT_INITIALIZED_MSG = "USER_NOT_INITIALIZED";

Deno.serve(
  createAuthHandler("POST", async ({ userId, serviceClient, request }) => {
    const parsed = await parseJsonBody(request);
    if ("error" in parsed) return parsed.error;
    const body = parsed.body as {
      tasks?: unknown[];
      goals?: unknown[];
      contexts?: unknown[];
      categories?: unknown[];
      ideas?: unknown[];
      checklist_items?: unknown[];
      attachments?: unknown[];
      settings?: unknown[];
    };

    const { data, error } = await serviceClient.rpc("push_records", {
      p_user_id: userId,
      p_tasks: body.tasks ?? [],
      p_goals: body.goals ?? [],
      p_contexts: body.contexts ?? [],
      p_categories: body.categories ?? [],
      p_ideas: body.ideas ?? [],
      p_checklist_items: body.checklist_items ?? [],
      p_attachments: body.attachments ?? [],
      p_settings: body.settings ?? [],
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
      results: {
        tasks: unknown[];
        goals: unknown[];
        contexts: unknown[];
        categories: unknown[];
        ideas: unknown[];
        checklist_items: unknown[];
        attachments: unknown[];
        settings: unknown[];
      };
    };

    return okResponse({
      ok: true,
      revision: rpcResult.revision,
      results: rpcResult.results,
      server_time: new Date().toISOString(),
    });
  }),
);

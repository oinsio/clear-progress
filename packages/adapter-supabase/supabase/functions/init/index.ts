// implements FR5 of add-supabase-adapter
// POST /init — creates sync_meta rows for the authenticated user (idempotent)

import { errorResponse, okResponse } from "../_shared/auth.ts";
import { ErrorCode } from "../_shared/constants.ts";
import { createAuthHandler } from "../_shared/handler.ts";

const NEXT_REVISION_INITIAL_VALUE = 1;
const PURGE_REVISION_INITIAL_VALUE = 0;

Deno.serve(
  createAuthHandler("POST", async ({ userId, serviceClient }) => {
    const { error } = await serviceClient.from("sync_meta").upsert(
      [
        {
          user_id: userId,
          key: "next_revision",
          value: NEXT_REVISION_INITIAL_VALUE,
        },
        {
          user_id: userId,
          key: "purge_revision",
          value: PURGE_REVISION_INITIAL_VALUE,
        },
      ],
      { onConflict: "user_id,key", ignoreDuplicates: true },
    );

    if (error) {
      return errorResponse(ErrorCode.INTERNAL_ERROR, error.message, 500);
    }

    return okResponse({ ok: true });
  }),
);

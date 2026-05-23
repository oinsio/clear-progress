// implements FR6 of add-supabase-adapter
// GET /ping — no auth required; checks initialized status when token is present

import {
  getAuthenticatedUserId,
  handleCors,
  okResponse,
} from "../_shared/auth.ts";
import { createServiceRoleClient } from "../_shared/client.ts";
import { APP_VERSION } from "../_shared/constants.ts";

Deno.serve(async (request: Request) => {
  const corsResponse = handleCors(request);
  if (corsResponse) return corsResponse;

  const supabase = createServiceRoleClient();
  const userId = await getAuthenticatedUserId(request, supabase);

  let isInitialized = false;

  if (userId) {
    const { count } = await supabase
      .from("sync_meta")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId);

    isInitialized = (count ?? 0) > 0;
  }

  return okResponse({
    ok: true,
    app: "supabase",
    version: APP_VERSION,
    initialized: isInitialized,
  });
});

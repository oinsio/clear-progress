// implements FR9 of add-supabase-adapter
// Shared request handler: CORS, method validation, auth, JSON body parsing

import type { SupabaseClient } from "npm:@supabase/supabase-js@2";
import { errorResponse, getAuthenticatedUserId, handleCors } from "./auth.ts";
import { createServiceRoleClient } from "./client.ts";
import { ErrorCode } from "./constants.ts";

export interface AuthContext {
  userId: string;
  accessToken: string;
  serviceClient: SupabaseClient;
  request: Request;
}

type AuthHandler = (context: AuthContext) => Promise<Response>;

/**
 * Creates a Deno.serve handler with CORS, HTTP method check,
 * Bearer token extraction, and user authentication.
 *
 * Callers parse the request body themselves.
 */
export function createAuthHandler(
  method: "POST" | "GET",
  handler: AuthHandler,
): (request: Request) => Promise<Response> {
  return async (request: Request) => {
    const corsResponse = handleCors(request);
    if (corsResponse) return corsResponse;

    if (request.method !== method) {
      return errorResponse(
        ErrorCode.INVALID_PAYLOAD,
        "Method not allowed",
        405,
      );
    }

    const authHeader = request.headers.get("Authorization");
    const accessToken = authHeader?.startsWith("Bearer ")
      ? authHeader.slice("Bearer ".length)
      : null;

    if (!accessToken) {
      return errorResponse(
        ErrorCode.UNAUTHORIZED,
        "Missing or invalid authorization token",
        401,
      );
    }

    const serviceClient = createServiceRoleClient();
    const userId = await getAuthenticatedUserId(request, serviceClient);

    if (!userId) {
      return errorResponse(
        ErrorCode.UNAUTHORIZED,
        "Missing or invalid authorization token",
        401,
      );
    }

    return handler({ userId, accessToken, serviceClient, request });
  };
}

/**
 * Parses JSON body from request. Returns the parsed body or an error Response.
 */
export async function parseJsonBody(
  request: Request,
): Promise<{ body: unknown } | { error: Response }> {
  try {
    const body = await request.json();
    return { body };
  } catch {
    return {
      error: errorResponse(ErrorCode.INVALID_PAYLOAD, "Invalid JSON body"),
    };
  }
}

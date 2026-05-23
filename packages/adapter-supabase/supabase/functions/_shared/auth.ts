// implements FR9 of add-supabase-adapter
// Auth extraction, CORS headers, error response formatting

import type { SupabaseClient } from "npm:@supabase/supabase-js@2";
import type { ErrorCode } from "./constants.ts";

export const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

/**
 * Returns a 204 CORS preflight response if request method is OPTIONS,
 * otherwise returns null (caller should continue handling).
 */
export function handleCors(request: Request): Response | null {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }
  return null;
}

/**
 * Formats a structured error response.
 * Shape: { ok: false, error: "<CODE>", message: "<description>" }
 */
export function errorResponse(
  code: ErrorCode,
  message: string,
  status = 400,
): Response {
  return new Response(JSON.stringify({ ok: false, error: code, message }), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}

/**
 * Formats a successful JSON response.
 */
export function okResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}

/**
 * Extracts the authenticated user ID from the Bearer token via Supabase Auth.
 * Returns the user ID string, or null if unauthenticated or token is invalid.
 */
export async function getAuthenticatedUserId(
  request: Request,
  supabaseClient: SupabaseClient,
): Promise<string | null> {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.slice("Bearer ".length);
  const { data, error } = await supabaseClient.auth.getUser(token);

  if (error || !data.user) {
    return null;
  }

  return data.user.id;
}

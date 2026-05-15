// implements D1 of add-supabase-adapter
// Supabase client initialization: service role for DB, user token for Storage

import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2";

/**
 * Creates a Supabase client with the service role key.
 * Used for DB operations (RPC calls, queries) where RLS must be bypassed,
 * with user_id enforced explicitly by the Edge Function logic.
 */
export function createServiceRoleClient(): SupabaseClient {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "Missing required env vars: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY",
    );
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });
}

/**
 * Creates a Supabase client authenticated with the user's access token.
 * Used for Storage operations so that user-scoped RLS policies apply.
 */
export function createUserClient(accessToken: string): SupabaseClient {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");

  if (!supabaseUrl || !anonKey) {
    throw new Error(
      "Missing required env vars: SUPABASE_URL, SUPABASE_ANON_KEY",
    );
  }

  return createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
    auth: { persistSession: false },
  });
}

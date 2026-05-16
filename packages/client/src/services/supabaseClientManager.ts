import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getConnectionConfig } from "./connectionService";

let supabaseClient: SupabaseClient | null = null;

// Auto-initialize from localStorage on module load so that module-level code in
// defaultServices.ts (evaluated after this module) can call getSupabaseClient() safely.
// This covers the OAuth redirect case where the page reloads with a saved Supabase config.
const bootConfig = getConnectionConfig();
if (bootConfig?.type === "supabase") {
  supabaseClient = createClient(bootConfig.url, bootConfig.anonKey);
}

// implements FR11, D2 of add-supabase-ui
export function getSupabaseClient(): SupabaseClient {
  if (!supabaseClient) {
    throw new Error(
      "Supabase client not initialized. Call createSupabaseClient() first.",
    );
  }
  return supabaseClient;
}

export function createSupabaseClient(
  url: string,
  anonKey: string,
): SupabaseClient {
  supabaseClient = createClient(url, anonKey);
  return supabaseClient;
}

export function destroySupabaseClient(): void {
  supabaseClient = null;
}

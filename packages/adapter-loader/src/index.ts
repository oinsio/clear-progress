import { GasSyncAdapter } from "@clear-progress/adapter-gas";
import { SupabaseSyncAdapter } from "@clear-progress/adapter-supabase";
import { registerAdapter } from "@clear-progress/contract";

// Self-register on import — adapters must be available before any module-level
// IIFE in defaultServices.ts evaluates, so registration cannot be deferred.
registerAdapter(
  "gas",
  (url, getAccessToken) => new GasSyncAdapter(url, getAccessToken),
);

// implements FR16, D8 of add-supabase-adapter
registerAdapter(
  "supabase",
  (url, getAccessToken) => new SupabaseSyncAdapter(url, getAccessToken),
);

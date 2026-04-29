import { GasSyncAdapter } from "@clear-progress/adapter-gas";
import { registerAdapter } from "@clear-progress/contract";

// Self-register on import — adapters must be available before any module-level
// IIFE in defaultServices.ts evaluates, so registration cannot be deferred.
registerAdapter(
  "gas",
  (url, getAccessToken) => new GasSyncAdapter(url, getAccessToken),
);

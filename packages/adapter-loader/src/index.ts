import { GasSyncAdapter } from "@clear-progress/adapter-gas";
import { registerAdapter } from "@clear-progress/contract";

/**
 * Registers all available adapters in the registry.
 * Must be called before using createAdapter().
 */
export function loadAdapters(): void {
  registerAdapter(
    "gas",
    (url, getAccessToken) => new GasSyncAdapter(url, getAccessToken),
  );
}

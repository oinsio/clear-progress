import { STORAGE_KEYS } from "@/constants";
import type { GasConnectionConfig } from "@/types/connection";

/**
 * Migrates legacy connection keys to the new ConnectionConfig format.
 * This function should be called once at app startup.
 * It's idempotent and safe to call multiple times.
 */
export function migrateLegacyConnection(): void {
  try {
    // Check if new format already exists
    const existingConfig = localStorage.getItem(STORAGE_KEYS.CONNECTION_CONFIG);
    if (existingConfig) {
      // Ensure isActive field exists (migration for configs created before isActive was added)
      const parsed = JSON.parse(existingConfig) as GasConnectionConfig;
      if (parsed.isActive === undefined) {
        parsed.isActive = true;
        localStorage.setItem(
          STORAGE_KEYS.CONNECTION_CONFIG,
          JSON.stringify(parsed),
        );
        console.log("Added isActive field to existing connection config");
      }

      // Clean up old keys if they still exist
      localStorage.removeItem(STORAGE_KEYS.GAS_URL);
      localStorage.removeItem(STORAGE_KEYS.GOOGLE_CLIENT_ID);
      localStorage.removeItem(STORAGE_KEYS.BACKEND_CONNECTED);
      return;
    }

    // Check for legacy keys
    const gasUrl = localStorage.getItem(STORAGE_KEYS.GAS_URL);
    const backendConnected = localStorage.getItem(
      STORAGE_KEYS.BACKEND_CONNECTED,
    );

    if (gasUrl && backendConnected) {
      const clientId = localStorage.getItem(STORAGE_KEYS.GOOGLE_CLIENT_ID);
      const config: GasConnectionConfig = {
        type: "gas",
        url: gasUrl,
        clientId: clientId || undefined,
        isActive: true,
      };

      localStorage.setItem(
        STORAGE_KEYS.CONNECTION_CONFIG,
        JSON.stringify(config),
      );

      // Remove old keys
      localStorage.removeItem(STORAGE_KEYS.GAS_URL);
      localStorage.removeItem(STORAGE_KEYS.GOOGLE_CLIENT_ID);
      localStorage.removeItem(STORAGE_KEYS.BACKEND_CONNECTED);

      console.log("Successfully migrated legacy connection config");
    }
  } catch (error) {
    console.error("Failed to migrate legacy connection config:", error);
  }
}

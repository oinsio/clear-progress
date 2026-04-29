import { ConnectionConfigSchema } from "@clear-progress/contract";
import {
  BACKEND_CONNECTION_EVENT,
  GOOGLE_CLIENT_ID_CHANGED_EVENT,
  STORAGE_KEYS,
} from "@/constants";
import type { BackendType, ConnectionConfig } from "@/types/connection";

export function connect(config: ConnectionConfig): void {
  try {
    const activeConfig: ConnectionConfig = { ...config, isActive: true };
    localStorage.setItem(
      STORAGE_KEYS.CONNECTION_CONFIG,
      JSON.stringify(activeConfig),
    );
    window.dispatchEvent(new Event(BACKEND_CONNECTION_EVENT));

    if (config.type === "gas" && config.clientId) {
      window.dispatchEvent(new Event(GOOGLE_CLIENT_ID_CHANGED_EVENT));
    }
  } catch (error) {
    console.error("Failed to save connection config:", error);
    throw error;
  }
}

export function disconnect(): void {
  try {
    // Update connection config to inactive instead of removing
    const raw = localStorage.getItem(STORAGE_KEYS.CONNECTION_CONFIG);
    if (raw) {
      const parseResult = ConnectionConfigSchema.safeParse(JSON.parse(raw));
      if (parseResult.success) {
        const deactivatedConfig: ConnectionConfig = {
          ...parseResult.data,
          isActive: false,
        };
        localStorage.setItem(
          STORAGE_KEYS.CONNECTION_CONFIG,
          JSON.stringify(deactivatedConfig),
        );
      }
    }

    // Remove auth keys
    localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN_EXPIRES_AT);
    localStorage.removeItem(STORAGE_KEYS.USER_PICTURE);

    // Remove sync keys
    localStorage.removeItem(STORAGE_KEYS.LAST_SYNC);
    localStorage.removeItem(STORAGE_KEYS.SETTINGS_UPDATED_AT);

    // Dispatch events
    window.dispatchEvent(new Event(BACKEND_CONNECTION_EVENT));
    window.dispatchEvent(new Event(GOOGLE_CLIENT_ID_CHANGED_EVENT));
  } catch (error) {
    console.error("Failed to disconnect:", error);
    throw error;
  }
}

export function getConnectionConfig(): ConnectionConfig | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CONNECTION_CONFIG);
    if (!raw) return null;
    const parseResult = ConnectionConfigSchema.safeParse(JSON.parse(raw));
    if (!parseResult.success) {
      console.error("Invalid connection config:", parseResult.error);
      return null;
    }
    if (!parseResult.data.isActive) return null;
    return parseResult.data;
  } catch (error) {
    console.error("Failed to parse connection config:", error);
    return null;
  }
}

export function getSavedConnectionConfig(): ConnectionConfig | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CONNECTION_CONFIG);
    if (!raw) return null;
    const parseResult = ConnectionConfigSchema.safeParse(JSON.parse(raw));
    if (!parseResult.success) {
      console.error("Invalid saved connection config:", parseResult.error);
      return null;
    }
    return parseResult.data;
  } catch (error) {
    console.error("Failed to parse saved connection config:", error);
    return null;
  }
}

export function getBackendType(): BackendType | null {
  const config = getConnectionConfig();
  return config?.type ?? null;
}

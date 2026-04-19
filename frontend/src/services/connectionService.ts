import { STORAGE_KEYS, BACKEND_CONNECTION_EVENT, GOOGLE_CLIENT_ID_CHANGED_EVENT } from "@/constants";
import type { ConnectionConfig, BackendType } from "@/types/connection";

export function connect(config: ConnectionConfig): void {
  try {
    localStorage.setItem(STORAGE_KEYS.CONNECTION_CONFIG, JSON.stringify(config));
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
    // Remove connection config
    localStorage.removeItem(STORAGE_KEYS.CONNECTION_CONFIG);

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
    return JSON.parse(raw) as ConnectionConfig;
  } catch (error) {
    console.error("Failed to parse connection config:", error);
    return null;
  }
}

export function getBackendType(): BackendType | null {
  const config = getConnectionConfig();
  return config?.type ?? null;
}

import { STORAGE_KEYS, BACKEND_CONNECTION_EVENT, GOOGLE_CLIENT_ID_CHANGED_EVENT } from "@/constants";
import type { ConnectionConfig, BackendType } from "@/types/connection";

export function connect(config: ConnectionConfig): void {
  try {
    const activeConfig: ConnectionConfig = { ...config, isActive: true };
    localStorage.setItem(STORAGE_KEYS.CONNECTION_CONFIG, JSON.stringify(activeConfig));
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
      const config = JSON.parse(raw) as ConnectionConfig;
      const deactivatedConfig: ConnectionConfig = { ...config, isActive: false };
      localStorage.setItem(STORAGE_KEYS.CONNECTION_CONFIG, JSON.stringify(deactivatedConfig));
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
    const config = JSON.parse(raw) as ConnectionConfig;
    if (!config.isActive) return null;
    return config;
  } catch (error) {
    console.error("Failed to parse connection config:", error);
    return null;
  }
}

export function getSavedConnectionConfig(): ConnectionConfig | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CONNECTION_CONFIG);
    if (!raw) return null;
    return JSON.parse(raw) as ConnectionConfig;
  } catch (error) {
    console.error("Failed to parse saved connection config:", error);
    return null;
  }
}

export function getBackendType(): BackendType | null {
  const config = getConnectionConfig();
  return config?.type ?? null;
}

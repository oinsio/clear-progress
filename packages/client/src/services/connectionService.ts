// implements FR8-FR12 of localstorage-refactor

import {
  type ConnectionConfig,
  type ConnectionStore,
  ConnectionStoreSchema,
} from "@clear-progress/contract";
import {
  BACKEND_CONNECTION_EVENT,
  GOOGLE_CLIENT_ID_CHANGED_EVENT,
  STORAGE_KEYS,
} from "@/constants";
import type { BackendType } from "@/types/connection";
import {
  getPreference,
  removePreference,
  setPreference,
} from "./localPreferencesService";

const EMPTY_CONNECTION_STORE: ConnectionStore = {
  activeType: null,
  configs: {},
};

const CONNECTION_STORE_CONFIG = {
  type: "json" as const,
  key: STORAGE_KEYS.CONNECTION_CONFIG,
  schema: ConnectionStoreSchema,
  defaultValue: EMPTY_CONNECTION_STORE,
};

function readStore(): ConnectionStore {
  return getPreference(CONNECTION_STORE_CONFIG);
}

function writeStore(store: ConnectionStore): void {
  setPreference(STORAGE_KEYS.CONNECTION_CONFIG, store, JSON.stringify);
}

/** FR9: connect() sets activeType and upserts config. */
export function connect(config: ConnectionConfig): void {
  try {
    const store = readStore();
    const updatedStore: ConnectionStore = {
      activeType: config.type,
      configs: {
        ...store.configs,
        [config.type]:
          config.type === "gas"
            ? { url: config.url, clientId: config.clientId }
            : { url: config.url, anonKey: config.anonKey },
      },
    };
    writeStore(updatedStore);

    window.dispatchEvent(new Event(BACKEND_CONNECTION_EVENT));

    if (config.type === "gas" && config.clientId) {
      window.dispatchEvent(new Event(GOOGLE_CLIENT_ID_CHANGED_EVENT));
    }
  } catch (error) {
    console.error("Failed to save connection config:", error);
    throw error;
  }
}

/** FR10: disconnect() sets activeType to null, preserves configs. */
export function disconnect(): void {
  try {
    const store = readStore();

    if (store.activeType !== null) {
      const updatedStore: ConnectionStore = {
        ...store,
        activeType: null,
      };
      writeStore(updatedStore);
    }

    // Remove auth keys
    removePreference(STORAGE_KEYS.ACCESS_TOKEN);
    removePreference(STORAGE_KEYS.ACCESS_TOKEN_EXPIRES_AT);
    removePreference(STORAGE_KEYS.USER_PICTURE);

    // Remove sync keys
    removePreference(STORAGE_KEYS.LAST_SYNC);
    removePreference(STORAGE_KEYS.SETTINGS_UPDATED_AT);

    // Dispatch events
    window.dispatchEvent(new Event(BACKEND_CONNECTION_EVENT));
    window.dispatchEvent(new Event(GOOGLE_CLIENT_ID_CHANGED_EVENT));
  } catch (error) {
    console.error("Failed to disconnect:", error);
    throw error;
  }
}

/** FR12: getConnectionConfig() returns configs[activeType] with type field when active. */
export function getConnectionConfig(): ConnectionConfig | null {
  const store = readStore();
  if (store.activeType === null) return null;

  const activeConfig = store.configs[store.activeType];
  if (!activeConfig) return null;

  return { ...activeConfig, type: store.activeType } as ConnectionConfig;
}

/** Returns saved connection config regardless of active state. */
export function getSavedConnectionConfig(): ConnectionConfig | null {
  const store = readStore();
  if (store.activeType === null) {
    // Return any config that exists, preferring last active
    for (const backendType of ["gas", "supabase"] as const) {
      const savedConfig = store.configs[backendType];
      if (savedConfig) {
        return { ...savedConfig, type: backendType } as ConnectionConfig;
      }
    }
    return null;
  }

  const activeConfig = store.configs[store.activeType];
  if (!activeConfig) return null;

  return { ...activeConfig, type: store.activeType } as ConnectionConfig;
}

/** FR11: getSavedConfigForType(type) reads from configs[type]. */
export function getSavedConfigForType(
  type: BackendType,
): ConnectionConfig | null {
  const store = readStore();
  const savedConfig = store.configs[type];
  if (!savedConfig) return null;

  return { ...savedConfig, type } as ConnectionConfig;
}

export function getBackendType(): BackendType | null {
  const store = readStore();
  return store.activeType;
}

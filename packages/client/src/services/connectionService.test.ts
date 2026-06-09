// implements FR8-FR12 of localstorage-refactor

import type { ConnectionStore } from "@clear-progress/contract";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { STORAGE_KEYS } from "@/constants";
import type { ConnectionConfig, GasConnectionConfig } from "@/types/connection";
import {
  connect,
  disconnect,
  getBackendType,
  getConnectionConfig,
  getSavedConfigForType,
  getSavedConnectionConfig,
} from "./connectionService";

function readStore(): ConnectionStore {
  const raw = localStorage.getItem(STORAGE_KEYS.CONNECTION_CONFIG);
  return JSON.parse(raw ?? "null") as ConnectionStore;
}

function writeStore(store: ConnectionStore): void {
  localStorage.setItem(STORAGE_KEYS.CONNECTION_CONFIG, JSON.stringify(store));
}

describe("connectionService", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe("connect", () => {
    it("should store activeType and config in nested configs object", () => {
      const config: GasConnectionConfig = {
        type: "gas",
        url: "https://example.com",
        clientId: "test-client-id",
      };

      connect(config);

      const store = readStore();
      expect(store.activeType).toBe("gas");
      expect(store.configs.gas).toEqual({
        url: "https://example.com",
        clientId: "test-client-id",
      });
    });

    it("should preserve existing configs when connecting with a different type", () => {
      const gasConfig: GasConnectionConfig = {
        type: "gas",
        url: "https://gas.example.com",
        clientId: "gas-id",
      };
      connect(gasConfig);

      const supabaseConfig: ConnectionConfig = {
        type: "supabase",
        url: "https://supabase.example.com",
        anonKey: "anon-key-123",
      };
      connect(supabaseConfig);

      const store = readStore();
      expect(store.activeType).toBe("supabase");
      expect(store.configs.gas).toEqual({
        url: "https://gas.example.com",
        clientId: "gas-id",
      });
      expect(store.configs.supabase).toEqual({
        url: "https://supabase.example.com",
        anonKey: "anon-key-123",
      });
    });
  });

  describe("disconnect", () => {
    it("should set activeType to null but preserve configs", () => {
      const config: GasConnectionConfig = {
        type: "gas",
        url: "https://example.com",
        clientId: "test-client-id",
      };
      connect(config);

      disconnect();

      const store = readStore();
      expect(store.activeType).toBeNull();
      expect(store.configs.gas).toEqual({
        url: "https://example.com",
        clientId: "test-client-id",
      });
    });

    it("should remove auth and sync keys", () => {
      const config: GasConnectionConfig = {
        type: "gas",
        url: "https://example.com",
      };
      connect(config);
      localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, "token");
      localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN_EXPIRES_AT, "123456");
      localStorage.setItem(STORAGE_KEYS.USER_PICTURE, "pic.jpg");
      localStorage.setItem(STORAGE_KEYS.LAST_SYNC, "2026-01-01T00:00:00.000Z");
      localStorage.setItem(
        STORAGE_KEYS.SETTINGS_UPDATED_AT,
        "2026-01-01T00:00:00.000Z",
      );

      disconnect();

      expect(localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN)).toBeNull();
      expect(
        localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN_EXPIRES_AT),
      ).toBeNull();
      expect(localStorage.getItem(STORAGE_KEYS.USER_PICTURE)).toBeNull();
      expect(localStorage.getItem(STORAGE_KEYS.LAST_SYNC)).toBeNull();
      expect(localStorage.getItem(STORAGE_KEYS.SETTINGS_UPDATED_AT)).toBeNull();
    });

    it("should handle disconnect when no config exists", () => {
      expect(() => disconnect()).not.toThrow();
      expect(localStorage.getItem(STORAGE_KEYS.CONNECTION_CONFIG)).toBeNull();
    });
  });

  describe("getConnectionConfig", () => {
    it("should return null when activeType is null", () => {
      writeStore({
        activeType: null,
        configs: { gas: { url: "https://example.com" } },
      });

      const result = getConnectionConfig();

      expect(result).toBeNull();
    });

    it("should return config with type field when activeType is set", () => {
      writeStore({
        activeType: "gas",
        configs: { gas: { url: "https://example.com", clientId: "test-id" } },
      });

      const result = getConnectionConfig();

      expect(result).toEqual({
        type: "gas",
        url: "https://example.com",
        clientId: "test-id",
      });
    });

    it("should return null when no config exists", () => {
      const result = getConnectionConfig();
      expect(result).toBeNull();
    });
  });

  describe("getSavedConnectionConfig", () => {
    it("should return config even when activeType is null", () => {
      writeStore({
        activeType: null,
        configs: { gas: { url: "https://example.com", clientId: "test-id" } },
      });

      const result = getSavedConnectionConfig();

      expect(result).toEqual({
        type: "gas",
        url: "https://example.com",
        clientId: "test-id",
      });
    });

    it("should return active config when activeType is set", () => {
      writeStore({
        activeType: "gas",
        configs: { gas: { url: "https://example.com" } },
      });

      const result = getSavedConnectionConfig();

      expect(result).toEqual({
        type: "gas",
        url: "https://example.com",
      });
    });

    it("should return null when no config exists", () => {
      const result = getSavedConnectionConfig();
      expect(result).toBeNull();
    });
  });

  describe("getSavedConfigForType", () => {
    it("should return config for specific type from nested configs", () => {
      writeStore({
        activeType: "gas",
        configs: {
          gas: { url: "https://gas.example.com", clientId: "gas-id" },
          supabase: { url: "https://supabase.example.com", anonKey: "key-123" },
        },
      });

      const gasResult = getSavedConfigForType("gas");
      expect(gasResult).toEqual({
        type: "gas",
        url: "https://gas.example.com",
        clientId: "gas-id",
      });

      const supabaseResult = getSavedConfigForType("supabase");
      expect(supabaseResult).toEqual({
        type: "supabase",
        url: "https://supabase.example.com",
        anonKey: "key-123",
      });
    });

    it("should return null when type config does not exist", () => {
      writeStore({
        activeType: "gas",
        configs: { gas: { url: "https://example.com" } },
      });

      const result = getSavedConfigForType("supabase");
      expect(result).toBeNull();
    });
  });

  describe("getBackendType", () => {
    it("should return activeType from store", () => {
      writeStore({ activeType: "supabase", configs: {} });

      expect(getBackendType()).toBe("supabase");
    });

    it("should return null when activeType is null", () => {
      writeStore({ activeType: null, configs: {} });

      expect(getBackendType()).toBeNull();
    });

    it("should return null when no store exists", () => {
      expect(getBackendType()).toBeNull();
    });
  });
});

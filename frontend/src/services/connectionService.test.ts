import { describe, it, expect, beforeEach, vi } from "vitest";
import { connect, disconnect, getConnectionConfig, getSavedConnectionConfig } from "./connectionService";
import { STORAGE_KEYS } from "@/constants";
import type { GasConnectionConfig } from "@/types/connection";

describe("connectionService", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe("connect", () => {
    it("should save config with isActive: true", () => {
      const config: GasConnectionConfig = {
        type: "gas",
        url: "https://example.com",
        clientId: "test-client-id",
        isActive: false, // Передаём false, но connect должен сохранить с true
      };

      connect(config);

      const saved = localStorage.getItem(STORAGE_KEYS.CONNECTION_CONFIG);
      expect(saved).toBeTruthy();
      const parsed = JSON.parse(saved!) as GasConnectionConfig;
      expect(parsed.isActive).toBe(true);
      expect(parsed.url).toBe("https://example.com");
      expect(parsed.clientId).toBe("test-client-id");
    });
  });

  describe("disconnect", () => {
    it("should set isActive: false instead of removing config", () => {
      const config: GasConnectionConfig = {
        type: "gas",
        url: "https://example.com",
        clientId: "test-client-id",
        isActive: true,
      };
      localStorage.setItem(STORAGE_KEYS.CONNECTION_CONFIG, JSON.stringify(config));

      disconnect();

      const saved = localStorage.getItem(STORAGE_KEYS.CONNECTION_CONFIG);
      expect(saved).toBeTruthy();
      const parsed = JSON.parse(saved!) as GasConnectionConfig;
      expect(parsed.isActive).toBe(false);
      expect(parsed.url).toBe("https://example.com");
      expect(parsed.clientId).toBe("test-client-id");
    });

    it("should remove auth and sync keys", () => {
      const config: GasConnectionConfig = {
        type: "gas",
        url: "https://example.com",
        isActive: true,
      };
      localStorage.setItem(STORAGE_KEYS.CONNECTION_CONFIG, JSON.stringify(config));
      localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, "token");
      localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN_EXPIRES_AT, "123456");
      localStorage.setItem(STORAGE_KEYS.USER_PICTURE, "pic.jpg");
      localStorage.setItem(STORAGE_KEYS.LAST_SYNC, "2026-01-01T00:00:00.000Z");
      localStorage.setItem(STORAGE_KEYS.SETTINGS_UPDATED_AT, "2026-01-01T00:00:00.000Z");

      disconnect();

      expect(localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN)).toBeNull();
      expect(localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN_EXPIRES_AT)).toBeNull();
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
    it("should return null for config with isActive: false", () => {
      const config: GasConnectionConfig = {
        type: "gas",
        url: "https://example.com",
        clientId: "test-client-id",
        isActive: false,
      };
      localStorage.setItem(STORAGE_KEYS.CONNECTION_CONFIG, JSON.stringify(config));

      const result = getConnectionConfig();

      expect(result).toBeNull();
    });

    it("should return config with isActive: true", () => {
      const config: GasConnectionConfig = {
        type: "gas",
        url: "https://example.com",
        clientId: "test-client-id",
        isActive: true,
      };
      localStorage.setItem(STORAGE_KEYS.CONNECTION_CONFIG, JSON.stringify(config));

      const result = getConnectionConfig();

      expect(result).toEqual(config);
    });

    it("should return null when no config exists", () => {
      const result = getConnectionConfig();
      expect(result).toBeNull();
    });
  });

  describe("getSavedConnectionConfig", () => {
    it("should return config even with isActive: false", () => {
      const config: GasConnectionConfig = {
        type: "gas",
        url: "https://example.com",
        clientId: "test-client-id",
        isActive: false,
      };
      localStorage.setItem(STORAGE_KEYS.CONNECTION_CONFIG, JSON.stringify(config));

      const result = getSavedConnectionConfig();

      expect(result).toEqual(config);
    });

    it("should return config with isActive: true", () => {
      const config: GasConnectionConfig = {
        type: "gas",
        url: "https://example.com",
        isActive: true,
      };
      localStorage.setItem(STORAGE_KEYS.CONNECTION_CONFIG, JSON.stringify(config));

      const result = getSavedConnectionConfig();

      expect(result).toEqual(config);
    });

    it("should return null when no config exists", () => {
      const result = getSavedConnectionConfig();
      expect(result).toBeNull();
    });
  });
});

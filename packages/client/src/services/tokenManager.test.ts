import { beforeEach, describe, expect, it, vi } from "vitest";
import { STORAGE_KEYS, TOKEN_EXPIRY_BUFFER_S } from "@/constants";
import { Temporal } from "@/lib/temporal";
import {
  _resetPersistence,
  ApiAuthError,
  configureTokenPersistence,
  getAccessToken,
  setAccessToken,
  shouldRefreshToken,
} from "./tokenManager";
import {
  localStoragePersistence,
  type TokenPersistence,
} from "./tokenPersistence";

describe("tokenManager", () => {
  beforeEach(() => {
    localStorage.clear();
    _resetPersistence();
    setAccessToken(null);
    vi.clearAllMocks();
  });

  // M1: existing tests adapted to new API
  describe("with localStoragePersistence", () => {
    beforeEach(() => {
      configureTokenPersistence(localStoragePersistence);
    });

    describe("setAccessToken", () => {
      it("should set token and calculate both expiration times", () => {
        const now = Temporal.Now.instant().epochMilliseconds;
        const expiresIn = 3600;

        setAccessToken("test-token", expiresIn);

        expect(getAccessToken()).toBe("test-token");
        expect(localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN)).toBe(
          "test-token",
        );

        const storedExpiresAt = Number(
          localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN_EXPIRES_AT),
        );
        expect(storedExpiresAt).toBeGreaterThanOrEqual(now + expiresIn * 1000);
        expect(storedExpiresAt).toBeLessThanOrEqual(
          now + expiresIn * 1000 + 100,
        );
      });

      it("should clear token when called with null", () => {
        setAccessToken("test-token", 3600);
        setAccessToken(null);

        expect(getAccessToken()).toBeNull();
        expect(localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN)).toBeNull();
        expect(
          localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN_EXPIRES_AT),
        ).toBeNull();
      });

      it("should store real expiration time in localStorage", () => {
        const now = Temporal.Now.instant().epochMilliseconds;
        const expiresIn = 3600;

        setAccessToken("test-token", expiresIn);

        const storedExpiresAt = Number(
          localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN_EXPIRES_AT),
        );
        const expectedExpiresAt = now + expiresIn * 1000;

        expect(storedExpiresAt).toBeGreaterThanOrEqual(expectedExpiresAt);
        expect(storedExpiresAt).toBeLessThanOrEqual(expectedExpiresAt + 100);
      });
    });
  });

  describe("setAccessToken without expiresIn", () => {
    it("should not set expiration when token provided without expiresIn", () => {
      setAccessToken("no-expiry-token");

      expect(getAccessToken()).toBe("no-expiry-token");
      expect(shouldRefreshToken()).toBe(false);
    });

    it("should not set expiration when null token provided with expiresIn", () => {
      setAccessToken(null, 3600);

      expect(getAccessToken()).toBeNull();
      expect(shouldRefreshToken()).toBe(false);
    });

    it("should call persistence clear (not save) when token has no expiresIn", () => {
      const spyPersistence: TokenPersistence = {
        save: vi.fn(),
        load: vi.fn().mockReturnValue(null),
        clear: vi.fn(),
      };
      configureTokenPersistence(spyPersistence);

      setAccessToken("token-no-expiry");

      expect(spyPersistence.save).not.toHaveBeenCalled();
      expect(spyPersistence.clear).toHaveBeenCalled();
    });

    it("should return token even after time advances when no expiry set", () => {
      setAccessToken("eternal-token");

      vi.spyOn(Temporal.Now, "instant").mockReturnValue({
        epochMilliseconds:
          Temporal.Now.instant().epochMilliseconds + 999_999_999,
      } as Temporal.Instant);

      expect(getAccessToken()).toBe("eternal-token");
    });
  });

  describe("getAccessToken", () => {
    it("should return token if not expired", () => {
      const expiresIn = 3600;
      setAccessToken("test-token", expiresIn);

      expect(getAccessToken()).toBe("test-token");
    });

    it("should return token even if in buffer zone (before real expiration)", () => {
      const now = Temporal.Now.instant().epochMilliseconds;
      const expiresIn = 100;

      setAccessToken("test-token", expiresIn);

      vi.spyOn(Temporal.Now, "instant").mockReturnValue({
        epochMilliseconds:
          now + (expiresIn - TOKEN_EXPIRY_BUFFER_S + 10) * 1000,
      } as Temporal.Instant);

      expect(getAccessToken()).toBe("test-token");
    });

    it("should return null if token expired", () => {
      const now = Temporal.Now.instant().epochMilliseconds;
      const expiresIn = 100;

      setAccessToken("test-token", expiresIn);

      vi.spyOn(Temporal.Now, "instant").mockReturnValue({
        epochMilliseconds: now + (expiresIn + 10) * 1000,
      } as Temporal.Instant);

      expect(getAccessToken()).toBeNull();
    });

    it("should return token when time is exactly at expiresAt (boundary)", () => {
      const now = Temporal.Now.instant().epochMilliseconds;
      const expiresIn = 100;

      setAccessToken("boundary-token", expiresIn);

      vi.spyOn(Temporal.Now, "instant").mockReturnValue({
        epochMilliseconds: now + expiresIn * 1000,
      } as Temporal.Instant);

      expect(getAccessToken()).toBe("boundary-token");
    });

    it("should return null if no token set", () => {
      expect(getAccessToken()).toBeNull();
    });
  });

  describe("shouldRefreshToken", () => {
    it("should return false if token not set", () => {
      expect(shouldRefreshToken()).toBe(false);
    });

    it("should return false if before refresh time", () => {
      const expiresIn = 3600;
      setAccessToken("test-token", expiresIn);

      expect(shouldRefreshToken()).toBe(false);
    });

    it("should return false when time is exactly at refreshAt (boundary)", () => {
      const now = Temporal.Now.instant().epochMilliseconds;
      const expiresIn = 100;

      setAccessToken("boundary-token", expiresIn);

      vi.spyOn(Temporal.Now, "instant").mockReturnValue({
        epochMilliseconds: now + (expiresIn - TOKEN_EXPIRY_BUFFER_S) * 1000,
      } as Temporal.Instant);

      expect(shouldRefreshToken()).toBe(false);
    });

    it("should return true if after refresh time but before expiration", () => {
      const now = Temporal.Now.instant().epochMilliseconds;
      const expiresIn = 100;

      setAccessToken("test-token", expiresIn);

      vi.spyOn(Temporal.Now, "instant").mockReturnValue({
        epochMilliseconds:
          now + (expiresIn - TOKEN_EXPIRY_BUFFER_S + 10) * 1000,
      } as Temporal.Instant);

      expect(shouldRefreshToken()).toBe(true);
      expect(getAccessToken()).toBe("test-token");
    });

    it("should return true if token expired", () => {
      const now = Temporal.Now.instant().epochMilliseconds;
      const expiresIn = 100;

      setAccessToken("test-token", expiresIn);

      vi.spyOn(Temporal.Now, "instant").mockReturnValue({
        epochMilliseconds: now + (expiresIn + 10) * 1000,
      } as Temporal.Instant);

      expect(shouldRefreshToken()).toBe(true);
    });
  });

  // M3: default (noop) — setAccessToken does NOT write to localStorage
  describe("default persistence (noop)", () => {
    it("should NOT write to localStorage when setAccessToken is called", () => {
      setAccessToken("memory-only-token", 3600);

      expect(localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN)).toBeNull();
      expect(
        localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN_EXPIRES_AT),
      ).toBeNull();
    });

    it("should still store token in memory", () => {
      setAccessToken("memory-only-token", 3600);

      expect(getAccessToken()).toBe("memory-only-token");
    });

    it("should NOT touch localStorage when clearing token", () => {
      localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, "pre-existing");
      setAccessToken(null);

      // noop persistence should not remove pre-existing keys
      expect(localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN)).toBe(
        "pre-existing",
      );
    });
  });

  // FR-4: configureTokenPersistence restores token
  describe("configureTokenPersistence", () => {
    it("should restore token from persistence strategy on configure", () => {
      const expiresAt = Temporal.Now.instant().epochMilliseconds + 3600 * 1000;
      localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, "persisted-token");
      localStorage.setItem(
        STORAGE_KEYS.ACCESS_TOKEN_EXPIRES_AT,
        String(expiresAt),
      );

      configureTokenPersistence(localStoragePersistence);

      expect(getAccessToken()).toBe("persisted-token");
    });

    it("should not restore expired token from persistence", () => {
      const expiredAt = Temporal.Now.instant().epochMilliseconds - 1000;
      localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, "expired-token");
      localStorage.setItem(
        STORAGE_KEYS.ACCESS_TOKEN_EXPIRES_AT,
        String(expiredAt),
      );

      configureTokenPersistence(localStoragePersistence);

      expect(getAccessToken()).toBeNull();
    });

    it("should leave token null when persistence has nothing stored", () => {
      configureTokenPersistence(localStoragePersistence);

      expect(getAccessToken()).toBeNull();
    });

    it("should set correct refreshAt from restored token (buffer zone check)", () => {
      const now = Temporal.Now.instant().epochMilliseconds;
      const expiresAt = now + 3600 * 1000;
      localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, "restored-token");
      localStorage.setItem(
        STORAGE_KEYS.ACCESS_TOKEN_EXPIRES_AT,
        String(expiresAt),
      );

      configureTokenPersistence(localStoragePersistence);

      // Before buffer zone — should not need refresh
      expect(shouldRefreshToken()).toBe(false);

      // Inside buffer zone — should need refresh
      vi.spyOn(Temporal.Now, "instant").mockReturnValue({
        epochMilliseconds: expiresAt - TOKEN_EXPIRY_BUFFER_S * 1000 + 1001,
      } as Temporal.Instant);

      expect(shouldRefreshToken()).toBe(true);
    });
  });

  describe("ApiAuthError", () => {
    it("should have correct name and message", () => {
      const error = new ApiAuthError();

      expect(error.name).toBe("ApiAuthError");
      expect(error.message).toBe(
        "Authentication required: token is missing, expired, or invalid",
      );
      expect(error).toBeInstanceOf(Error);
    });
  });
});

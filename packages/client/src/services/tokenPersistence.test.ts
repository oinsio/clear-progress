import { beforeEach, describe, expect, it, vi } from "vitest";
import { STORAGE_KEYS } from "@/constants";
import { Temporal } from "@/lib/temporal";
import { localStoragePersistence, noopPersistence } from "./tokenPersistence";

// FR-2: localStoragePersistence
describe("localStoragePersistence", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe("save", () => {
    it("should store token and expiresAt in localStorage", () => {
      const expiresAt = Date.now() + 3600 * 1000;

      localStoragePersistence.save("test-token", expiresAt);

      expect(localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN)).toBe(
        "test-token",
      );
      expect(localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN_EXPIRES_AT)).toBe(
        String(expiresAt),
      );
    });
  });

  describe("load", () => {
    it("should return stored token when not expired", () => {
      const expiresAt = Temporal.Now.instant().epochMilliseconds + 3600 * 1000;
      localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, "stored-token");
      localStorage.setItem(
        STORAGE_KEYS.ACCESS_TOKEN_EXPIRES_AT,
        String(expiresAt),
      );

      const result = localStoragePersistence.load();

      expect(result).toEqual({ token: "stored-token", expiresAt });
    });

    it("should return null when no token is stored", () => {
      expect(localStoragePersistence.load()).toBeNull();
    });

    it("should return null when only token key exists without expiry", () => {
      localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, "orphan-token");

      expect(localStoragePersistence.load()).toBeNull();
    });

    it("should return null when only expiry key exists without token", () => {
      localStorage.setItem(
        STORAGE_KEYS.ACCESS_TOKEN_EXPIRES_AT,
        String(Temporal.Now.instant().epochMilliseconds + 3600 * 1000),
      );

      expect(localStoragePersistence.load()).toBeNull();
    });

    it("should return null when token expires exactly now (boundary)", () => {
      const exactlyNow = Temporal.Now.instant().epochMilliseconds;
      localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, "boundary-token");
      localStorage.setItem(
        STORAGE_KEYS.ACCESS_TOKEN_EXPIRES_AT,
        String(exactlyNow),
      );

      const result = localStoragePersistence.load();

      expect(result).toBeNull();
      expect(localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN)).toBeNull();
    });

    it("should return null and clean up when token is expired", () => {
      const expiredAt = Temporal.Now.instant().epochMilliseconds - 1000;
      localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, "expired-token");
      localStorage.setItem(
        STORAGE_KEYS.ACCESS_TOKEN_EXPIRES_AT,
        String(expiredAt),
      );

      const result = localStoragePersistence.load();

      expect(result).toBeNull();
      expect(localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN)).toBeNull();
      expect(
        localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN_EXPIRES_AT),
      ).toBeNull();
    });

    // FR17: self-healing for corrupted token data
    describe("self-healing (FR17)", () => {
      it("should return null and clear both keys when access token is empty string", () => {
        localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, "");
        localStorage.setItem(
          STORAGE_KEYS.ACCESS_TOKEN_EXPIRES_AT,
          String(Temporal.Now.instant().epochMilliseconds + 3600 * 1000),
        );

        const result = localStoragePersistence.load();

        expect(result).toBeNull();
        expect(localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN)).toBeNull();
        expect(
          localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN_EXPIRES_AT),
        ).toBeNull();
      });

      it("should warn when access token is empty string", () => {
        const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
        localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, "");
        localStorage.setItem(
          STORAGE_KEYS.ACCESS_TOKEN_EXPIRES_AT,
          String(Temporal.Now.instant().epochMilliseconds + 3600 * 1000),
        );

        localStoragePersistence.load();

        expect(warnSpy).toHaveBeenCalledWith(
          "[TokenPersistence] Corrupted token data: empty access token, cleared",
        );
        warnSpy.mockRestore();
      });

      it("should return null and clear both keys when expires_at is NaN", () => {
        localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, "valid-token");
        localStorage.setItem(
          STORAGE_KEYS.ACCESS_TOKEN_EXPIRES_AT,
          "not-a-number",
        );

        const result = localStoragePersistence.load();

        expect(result).toBeNull();
        expect(localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN)).toBeNull();
        expect(
          localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN_EXPIRES_AT),
        ).toBeNull();
      });

      it("should warn when expires_at is NaN", () => {
        const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
        localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, "valid-token");
        localStorage.setItem(
          STORAGE_KEYS.ACCESS_TOKEN_EXPIRES_AT,
          "not-a-number",
        );

        localStoragePersistence.load();

        expect(warnSpy).toHaveBeenCalledWith(
          "[TokenPersistence] Corrupted token data: non-numeric expires_at, cleared",
        );
        warnSpy.mockRestore();
      });

      it("should return null and clear orphaned token when expires_at is missing", () => {
        localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, "orphan-token");

        const result = localStoragePersistence.load();

        expect(result).toBeNull();
        expect(localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN)).toBeNull();
      });

      it("should warn when token exists but expires_at is missing", () => {
        const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
        localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, "orphan-token");

        localStoragePersistence.load();

        expect(warnSpy).toHaveBeenCalledWith(
          "[TokenPersistence] Corrupted token data: missing expires_at, cleared",
        );
        warnSpy.mockRestore();
      });

      it("should return null and clear orphaned expires_at when token is missing", () => {
        localStorage.setItem(
          STORAGE_KEYS.ACCESS_TOKEN_EXPIRES_AT,
          String(Temporal.Now.instant().epochMilliseconds + 3600 * 1000),
        );

        const result = localStoragePersistence.load();

        expect(result).toBeNull();
        expect(
          localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN_EXPIRES_AT),
        ).toBeNull();
      });

      it("should warn when expires_at exists but token is missing", () => {
        const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
        localStorage.setItem(
          STORAGE_KEYS.ACCESS_TOKEN_EXPIRES_AT,
          String(Temporal.Now.instant().epochMilliseconds + 3600 * 1000),
        );

        localStoragePersistence.load();

        expect(warnSpy).toHaveBeenCalledWith(
          "[TokenPersistence] Corrupted token data: missing access token, cleared",
        );
        warnSpy.mockRestore();
      });
    });
  });

  describe("clear", () => {
    it("should remove token keys from localStorage", () => {
      localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, "token");
      localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN_EXPIRES_AT, "123");

      localStoragePersistence.clear();

      expect(localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN)).toBeNull();
      expect(
        localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN_EXPIRES_AT),
      ).toBeNull();
    });

    it("should not throw when keys do not exist", () => {
      expect(() => localStoragePersistence.clear()).not.toThrow();
    });
  });
});

// FR-3: noopPersistence
describe("noopPersistence", () => {
  it("should return null from load", () => {
    expect(noopPersistence.load()).toBeNull();
  });

  it("should not throw on save", () => {
    expect(() => noopPersistence.save("token", 123)).not.toThrow();
  });

  it("should not write to localStorage on save", () => {
    localStorage.clear();

    noopPersistence.save("token", 123);

    expect(localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN)).toBeNull();
  });

  it("should not throw on clear", () => {
    expect(() => noopPersistence.clear()).not.toThrow();
  });
});

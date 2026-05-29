import { STORAGE_KEYS } from "@/constants";
import { Temporal } from "@/lib/temporal";

/**
 * Implements FR-1 of refactor-token-persistence.
 * Strategy interface for persisting access tokens.
 */
export interface TokenPersistence {
  save(token: string, expiresAt: number): void;
  load(): { token: string; expiresAt: number } | null;
  clear(): void;
}

/**
 * Implements FR-3 of refactor-token-persistence.
 * No-op persistence — tokens live only in memory.
 * Used for Supabase backend (SDK manages its own session).
 */
export const noopPersistence: TokenPersistence = {
  save() {},
  load() {
    return null;
  },
  clear() {},
};

/**
 * Implements FR-2 of refactor-token-persistence.
 * Persists access token to localStorage — used for GAS backend.
 */
export const localStoragePersistence: TokenPersistence = {
  save(token: string, expiresAt: number) {
    localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, token);
    localStorage.setItem(
      STORAGE_KEYS.ACCESS_TOKEN_EXPIRES_AT,
      String(expiresAt),
    );
  },

  load() {
    const storedToken = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    const storedExpiresAt = localStorage.getItem(
      STORAGE_KEYS.ACCESS_TOKEN_EXPIRES_AT,
    );
    if (!storedToken || !storedExpiresAt) {
      return null;
    }
    const expiresAt = Number(storedExpiresAt);
    if (Temporal.Now.instant().epochMilliseconds >= expiresAt) {
      localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
      localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN_EXPIRES_AT);
      return null;
    }
    return { token: storedToken, expiresAt };
  },

  clear() {
    localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN_EXPIRES_AT);
  },
};

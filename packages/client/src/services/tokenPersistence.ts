// implements FR17 of localstorage-refactor
import { STORAGE_KEYS } from "@/constants";
import { Temporal } from "@/lib/temporal";

const LOG_PREFIX = "[TokenPersistence]";

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

/** Implements FR17 of localstorage-refactor — self-healing for corrupted token data. */
function selfHealTokenData(reason: string): void {
  localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
  localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN_EXPIRES_AT);
  console.warn(`${LOG_PREFIX} Corrupted token data: ${reason}, cleared`);
}

/**
 * Implements FR-2 of refactor-token-persistence.
 * Persists access token to localStorage.
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
    const hasToken = storedToken !== null;
    const hasExpiresAt = storedExpiresAt !== null;

    // Self-healing: empty access token (key exists but value is empty)
    if (hasToken && storedToken.length === 0) {
      selfHealTokenData("empty access token");
      return null;
    }

    // Self-healing: missing one of the two keys (orphaned data)
    if (hasToken && !hasExpiresAt) {
      selfHealTokenData("missing expires_at");
      return null;
    }
    if (!hasToken && hasExpiresAt) {
      selfHealTokenData("missing access token");
      return null;
    }

    // Both keys missing — nothing to load
    if (!hasToken || !hasExpiresAt) {
      return null;
    }

    // Self-healing: non-numeric expires_at
    const expiresAt = Number(storedExpiresAt);
    if (Number.isNaN(expiresAt)) {
      selfHealTokenData("non-numeric expires_at");
      return null;
    }

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

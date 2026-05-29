import { API_AUTH_ERROR_NAME, TOKEN_EXPIRY_BUFFER_S } from "@/constants";
import { Temporal } from "@/lib/temporal";
import type { TokenPersistence } from "./tokenPersistence";
import { noopPersistence } from "./tokenPersistence";

// Module-level shared state — all adapter instances use the same token
let sharedAccessToken: string | null = null;
let sharedTokenExpiresAt: number | null = null; // Real expiration time
let sharedTokenRefreshAt: number | null = null; // Time to proactively refresh

// Implements FR-4, FR-6 of refactor-token-persistence.
// Active persistence strategy — defaults to noopPersistence (no storage until configured).
let activePersistence: TokenPersistence = noopPersistence;

/**
 * Implements FR-4 of refactor-token-persistence.
 * Sets the active persistence strategy and restores any persisted token.
 */
export function configureTokenPersistence(strategy: TokenPersistence): void {
  activePersistence = strategy;
  const restored = strategy.load();
  if (restored) {
    sharedAccessToken = restored.token;
    sharedTokenExpiresAt = restored.expiresAt;
    sharedTokenRefreshAt = restored.expiresAt - TOKEN_EXPIRY_BUFFER_S * 1000;
  }
}

/**
 * Implements FR-5 of refactor-token-persistence.
 */
export function setAccessToken(token: string | null, expiresIn?: number): void {
  sharedAccessToken = token;

  if (token && expiresIn !== undefined) {
    const now = Temporal.Now.instant().epochMilliseconds;
    sharedTokenExpiresAt = now + expiresIn * 1000;
    sharedTokenRefreshAt = now + (expiresIn - TOKEN_EXPIRY_BUFFER_S) * 1000;
  } else {
    sharedTokenExpiresAt = null;
    sharedTokenRefreshAt = null;
  }

  if (token && sharedTokenExpiresAt !== null) {
    activePersistence.save(token, sharedTokenExpiresAt);
  } else {
    activePersistence.clear();
  }
}

export function getAccessToken(): string | null {
  if (
    sharedTokenExpiresAt !== null &&
    Temporal.Now.instant().epochMilliseconds > sharedTokenExpiresAt
  ) {
    return null;
  }
  return sharedAccessToken;
}

export function shouldRefreshToken(): boolean {
  if (sharedTokenRefreshAt === null) return false;
  return Temporal.Now.instant().epochMilliseconds > sharedTokenRefreshAt;
}

export class ApiAuthError extends Error {
  constructor() {
    super("Authentication required: token is missing, expired, or invalid");
    this.name = API_AUTH_ERROR_NAME;
  }
}

/** @internal — for testing only. Resets persistence to noopPersistence. */
export function _resetPersistence(): void {
  activePersistence = noopPersistence;
}

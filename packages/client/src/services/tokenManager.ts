import {
  API_AUTH_ERROR_NAME,
  STORAGE_KEYS,
  TOKEN_EXPIRY_BUFFER_S,
} from "@/constants";
import { Temporal } from "@/lib/temporal";

// Module-level shared state — all adapter instances use the same token
let sharedAccessToken: string | null = null;
let sharedTokenExpiresAt: number | null = null; // Real expiration time
let sharedTokenRefreshAt: number | null = null; // Time to proactively refresh

// Restore persisted token from localStorage on module load (survives app restart)
const _storedToken = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
const _storedExpiresAt = localStorage.getItem(
  STORAGE_KEYS.ACCESS_TOKEN_EXPIRES_AT,
);
if (_storedToken && _storedExpiresAt) {
  const expiresAt = Number(_storedExpiresAt);
  if (Temporal.Now.instant().epochMilliseconds < expiresAt) {
    sharedAccessToken = _storedToken;
    sharedTokenExpiresAt = expiresAt;
    // Calculate refresh time based on stored expiration
    sharedTokenRefreshAt = expiresAt - TOKEN_EXPIRY_BUFFER_S * 1000;
  } else {
    localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN_EXPIRES_AT);
  }
}

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
    localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, token);
    localStorage.setItem(
      STORAGE_KEYS.ACCESS_TOKEN_EXPIRES_AT,
      String(sharedTokenExpiresAt),
    );
  } else {
    localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN_EXPIRES_AT);
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

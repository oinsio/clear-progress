import {
  API_AUTH_ERROR_NAME,
  STORAGE_KEYS,
  TOKEN_EXPIRY_BUFFER_S,
} from "@/constants";
import { Temporal } from "@/lib/temporal";

// Module-level shared state — all adapter instances use the same token
let sharedAccessToken: string | null = null;
let sharedTokenExpiresAt: number | null = null;

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
  } else {
    localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN_EXPIRES_AT);
  }
}

export function setAccessToken(token: string | null, expiresIn?: number): void {
  sharedAccessToken = token;
  sharedTokenExpiresAt =
    token && expiresIn !== undefined
      ? Temporal.Now.instant().epochMilliseconds +
        (expiresIn - TOKEN_EXPIRY_BUFFER_S) * 1000
      : null;

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

export class ApiAuthError extends Error {
  constructor() {
    super("Authentication required: token is missing, expired, or invalid");
    this.name = API_AUTH_ERROR_NAME;
  }
}

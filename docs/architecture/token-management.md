# Token Management

Managing Google OAuth tokens in the client application.

## Overview

The client uses Google OAuth 2.0 to authorize requests to the GAS backend. Tokens have a limited lifetime (typically 1 hour), so a mechanism for proactive token refresh before expiration is required.

## Architecture

### `tokenManager.ts` Module

Central module for token management. Stores the token in memory (module-level state) and synchronizes with `localStorage` for recovery after page reload.

**Key functions:**
- `setAccessToken(token, expiresIn)` — saves token and calculates expiration times
- `getAccessToken()` — returns token if valid
- `shouldRefreshToken()` — checks if token needs refresh

### Two Expiration Times

The module stores **two** expiration times for each token:

1. **`sharedTokenExpiresAt`** — actual token expiration time
   - Calculated as `now + expiresIn * 1000`
   - Used in `getAccessToken()` to check validity
   - Token is considered expired only after this time

2. **`sharedTokenRefreshAt`** — time for proactive refresh
   - Calculated as `now + (expiresIn - TOKEN_EXPIRY_BUFFER_S) * 1000`
   - Used in `shouldRefreshToken()` to determine refresh moment
   - Default `TOKEN_EXPIRY_BUFFER_S = 60` seconds

### Buffer Zone

**Buffer zone** — the last 60 seconds before token expiration.

```
Token created         Buffer zone starts          Token expires
     |                          |                        |
     |--------------------------|------------------------|
     0                       3540 sec                 3600 sec

     <- getAccessToken() = token ->|<- getAccessToken() = token ->|<- getAccessToken() = null
     <- shouldRefreshToken() = false ->|<- shouldRefreshToken() = true ->
```

**Important:** Token **remains valid** in the buffer zone. `getAccessToken()` returns the token even if `shouldRefreshToken()` returned `true`.

## Token Lifecycle

### 1. Obtaining Token

User authenticates via Google OAuth:

```typescript
// GoogleAuthSync.tsx
const handleSuccess = (tokenResponse) => {
  setAccessToken(tokenResponse.access_token, tokenResponse.expires_in);
  // expiresIn typically = 3600 (1 hour)
};
```

`setAccessToken()` calculates:
- `sharedTokenExpiresAt = now + 3600 * 1000` (in 1 hour)
- `sharedTokenRefreshAt = now + 3540 * 1000` (in 59 minutes)

Token is saved to `localStorage`:
- `access_token` — the token itself
- `access_token_expires_at` — actual expiration time (for recovery after reload)

### 2. Using Token

Adapter requests token before each request to GAS:

```typescript
// gas-sync-adapter.ts
const token = this.getAccessToken();
if (!token) {
  throw new ApiAuthError();
}
```

`getAccessToken()` checks `sharedTokenExpiresAt`:
- If `now < sharedTokenExpiresAt` -> returns token
- If `now > sharedTokenExpiresAt` -> returns `null`

### 3. Proactive Refresh

`GoogleAuthSync` checks every 30 seconds if token needs refresh:

```typescript
// GoogleAuthSync.tsx
useEffect(() => {
  const intervalId = setInterval(() => {
    if (shouldRefreshToken()) {
      doSilentRefresh();
    }
  }, 30000);
  return () => clearInterval(intervalId);
}, [doSilentRefresh]);
```

`shouldRefreshToken()` checks `sharedTokenRefreshAt`:
- If `now < sharedTokenRefreshAt` -> `false` (token is fresh)
- If `now > sharedTokenRefreshAt` -> `true` (time to refresh)

When `true`, `doSilentRefresh()` is called:
- Requests new token via `googleLogin({ prompt: "none" })`
- New token replaces old one via `setAccessToken()`
- User doesn't see auth UI (silent refresh)

### 4. Token Expiration

If token wasn't refreshed in time (e.g., user was offline):
- `getAccessToken()` returns `null`
- Adapter throws `ApiAuthError`
- App shows authorization error
- User must re-authenticate

## Recovery After Reload

When loading the `tokenManager.ts` module (module-level code):

```typescript
const _storedToken = localStorage.getItem("access_token");
const _storedExpiresAt = localStorage.getItem("access_token_expires_at");

if (_storedToken && _storedExpiresAt) {
  const expiresAt = Number(_storedExpiresAt);
  if (now < expiresAt) {
    sharedAccessToken = _storedToken;
    sharedTokenExpiresAt = expiresAt;
    sharedTokenRefreshAt = expiresAt - TOKEN_EXPIRY_BUFFER_S * 1000;
  } else {
    // Token expired — clear localStorage
    localStorage.removeItem("access_token");
    localStorage.removeItem("access_token_expires_at");
  }
}
```

If token is valid — it's restored in memory. If expired — removed from `localStorage`.

## Why Two Expiration Times?

### Problem with Single Time

Before the fix (commit `7d28701`), only one time was used:

```typescript
// Old implementation
sharedTokenExpiresAt = now + (expiresIn - TOKEN_EXPIRY_BUFFER_S) * 1000;

export function getAccessToken() {
  if (now > sharedTokenExpiresAt) {
    return null; // Token blocked 60 seconds before actual expiration
  }
  return sharedAccessToken;
}
```

**Consequences:**
- Token was considered expired 60 seconds before actual expiration
- `getAccessToken()` returned `null` even though token was still valid on Google server
- Sync was blocked prematurely
- GAS received "almost expired" tokens and called tokeninfo API for verification
- Frequent tokeninfo API requests exhausted quota

### Solution with Two Times

Separation of logic:
- **Validity check** (`getAccessToken`) — uses actual expiration time
- **Proactive refresh** (`shouldRefreshToken`) — uses buffer time

**Result:**
- Token is used until actual expiration (not blocked prematurely)
- Refresh happens in advance (in buffer zone), but doesn't block usage
- Fewer tokeninfo API requests (tokens refreshed before expiration)

## Constants

```typescript
// constants/index.ts
export const TOKEN_EXPIRY_BUFFER_S = 60; // 60 seconds

// GoogleAuthSync.tsx
const TOKEN_REFRESH_CHECK_INTERVAL_MS = 30000; // 30 seconds
```

**Why 60 second buffer?**
- Enough time to refresh token (network request + processing)
- Not too early (token used almost until the end)
- Standard practice for OAuth tokens

**Why check every 30 seconds?**
- Frequent enough not to miss refresh moment
- Not too frequent to avoid browser overhead
- Guarantees refresh within buffer zone (60 seconds)

## Edge Cases

### 1. Token Expires Between Check and Use

**Scenario:** `getAccessToken()` checks token — valid (1 second remaining) -> client sends request -> token expires during transmission -> GAS receives invalid token -> `UNAUTHORIZED` error

**Handling:** Rare edge-case (probability ~1/3600). User will see authorization error. Next request will succeed (token refreshes automatically).

### 2. Proactive Refresh Fails

**Scenario:** `shouldRefreshToken()` returns `true` -> refresh via `googleLogin({ prompt: "none" })` fails -> token expires in 60 seconds

**Handling:** `getAccessToken()` will return `null` after expiration. User will see authorization error. Need to re-authenticate.

### 3. User Offline in Buffer Zone

**Scenario:** Token enters buffer zone -> user loses internet -> proactive refresh fails -> token expires

**Handling:** Token used until expiration (59 seconds of offline work). After expiration, `getAccessToken()` returns `null`. When internet returns, user re-authenticates.

## Testing

Tests in `tokenManager.test.ts` cover:
- Calculation of both expiration times
- Token return in buffer zone
- Return `null` after actual expiration
- Correct `shouldRefreshToken()` behavior

## Related Files

- `packages/client/src/services/tokenManager.ts` — token management
- `packages/client/src/app/providers/GoogleAuthSync.tsx` — OAuth integration and proactive refresh
- `packages/client/src/app/providers/AuthProvider.tsx` — authorization context
- `packages/adapter-gas/src/client/gas-sync-adapter.ts` — token usage in requests
- `packages/client/src/constants/index.ts` — constants (`TOKEN_EXPIRY_BUFFER_S`)

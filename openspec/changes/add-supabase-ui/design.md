## Context

The Supabase backend adapter (`adapter-supabase`) exists but uses raw `fetch` with only `Authorization: Bearer` header. Supabase Edge Functions require both `Authorization` and `apikey` headers. The current UI (SetupPage) only supports GAS backend. The adapter factory uses a generic registry pattern that cannot accommodate different constructor signatures per backend type.

Current auth architecture: `AuthProvider` → `GoogleOAuthProvider` → `GoogleAuthSync` (renderless component, implicit flow, popup-based). Supabase uses redirect-based OAuth with PKCE flow — fundamentally different from Google's popup approach.

## Goals / Non-Goals

**Goals:**
- Enable Supabase connection from SetupPage with minimal UI changes (driven by FR1-FR14)
- Use `@supabase/supabase-js` SDK for both auth and edge function calls (FR8, FR11)
- Keep GAS flow untouched — zero regression risk (M2)

**Non-Goals:**
- Refactoring AuthProvider into a generic multi-backend auth system (keep it pragmatic)
- Adding Supabase-specific features beyond connection + sync (realtime, storage API, etc.)

## Decisions

### D1: Supabase JS SDK for everything (FR8, FR11)

Use `@supabase/supabase-js` for auth AND edge function invocation.

**Rationale:** SDK automatically manages `apikey` header, `Authorization` header, PKCE flow, token refresh, and session persistence. Building this manually with raw `fetch` would duplicate SDK functionality and introduce bugs.

**Alternatives considered:**
- SDK for auth only, raw fetch for edge functions → two auth mechanisms, manual `apikey` header management
- No SDK, manual PKCE + fetch → significant implementation effort, error-prone token refresh

### D2: SDK instance lives in React client layer — B2 pattern (FR11)

React creates `SupabaseClient` instance, passes it to the adapter.

```
packages/client/
  └─ createClient(url, anonKey) → SupabaseClient
  └─ SupabaseAuthSync (renderless, like GoogleAuthSync)
  └─ new SupabaseSyncAdapter(supabaseClient)
```

**Rationale:** Auth is inherently a UI concern (OAuth redirects, session state in React context). Adapter stays "dumb" — receives a configured client, calls `functions.invoke()`.

**Alternatives considered:**
- B1: SDK in adapter-supabase → adapter becomes auth manager, needs event bridge to React
- B3: Separate supabase-client package → extra package for no real benefit with 2 consumers

### D3: Per-type factory functions — F3 pattern (FR9)

Replace generic `adapterRegistry` with explicit per-type factories.

```typescript
// packages/adapter-gas
export function createGasAdapter(url: string, getAccessToken: GetAccessToken): SyncAdapter

// packages/adapter-supabase
export function createSupabaseAdapter(supabaseClient: SupabaseClient): SyncAdapter

// packages/client/src/services/defaultServices.ts
switch (config.type) {
  case "gas": return createGasAdapter(config.url, getAccessToken);
  case "supabase": return createSupabaseAdapter(getSupabaseClient());
}
```

**Rationale:** GAS needs `(url, getAccessToken)`, Supabase needs `(SupabaseClient)`. Generic registry cannot type-safely accommodate different signatures. With only 2 backends, a simple switch is clearer than an abstraction.

**Impact:** Remove `adapterRegistry.ts` from contract, remove `adapter-loader` package (or repurpose). `contract` package exports only types/interfaces.

**Alternatives considered:**
- F1: Generic context object → weak typing, `!` assertions
- F2: Switch in client without per-type exports → works but less modular

### D4: Auth callback via redirect to /setup (FR6, FR7)

OAuth redirects back to `/setup`. SDK auto-detects `?code=xxx` on initialization and exchanges for session.

**Rationale:** SetupPage already handles "returning after auth" for GAS (the `awaiting_signin` → token → navigate pattern). Same pattern works for Supabase. No need for a separate `/auth/callback` route.

**Flow:**
1. User clicks OAuth button → `signInWithOAuth({ redirectTo: '/setup' })`
2. User authenticates at provider, returns to `/setup?code=xxx`
3. React mounts → `createClient()` → SDK detects code → `exchangeCodeForSession`
4. `onAuthStateChange(SIGNED_IN)` fires → AuthProvider updates state → SetupPage navigates to inbox

### D5: Ping via /auth/v1/settings (FR4, FR5)

Use `GET /auth/v1/settings` as the Supabase "ping" instead of the edge function `/ping`.

**Rationale:** This endpoint requires no authentication (only `apikey` header), validates that URL + anonKey are correct, and returns the list of enabled OAuth providers — all in one request. The edge function `/ping` requires auth which the user doesn't have yet.

### D6: AuthProvider detects backend type (FR10)

`AuthProvider` reads `connectionConfig.type` and conditionally renders:
- `type === "gas"` → `GoogleOAuthProvider` + `GoogleAuthSync` (existing)
- `type === "supabase"` → `SupabaseAuthSync` (new renderless component)

`SupabaseAuthSync` mirrors `GoogleAuthSync` pattern:
- Listens to `onAuthStateChange`
- Populates `signInRef`, `signOutRef`, `silentRefreshRef`
- Manages token in `tokenManager` for backward compatibility with SyncProvider

### D7: parseSupabaseInput URL resolution (FR3)

```typescript
function parseSupabaseInput(input: string): string {
  const trimmed = input.trim();
  if (trimmed.startsWith("https://")) return trimmed;
  return `https://${trimmed}.supabase.co`;
}
```

Mirrors existing `parseGasInput()` pattern. Project ID `xxxxx` → `https://xxxxx.supabase.co`. Full URL passed through.

## Risks / Trade-offs

- **[Risk] Supabase SDK bundle size** → SDK adds ~40-60KB gzipped. Acceptable for a PWA that already bundles Dexie, React, etc. Can lazy-load if needed later.
- **[Risk] OAuth redirect loses React state** → Mitigated: connectionConfig saved to localStorage before redirect (FR12). SDK handles session persistence internally.
- **[Risk] Token refresh divergence** → Supabase SDK manages its own token refresh. `tokenManager.ts` still used for SyncProvider compatibility. Two sources of truth for token state. Mitigation: `SupabaseAuthSync` syncs SDK session → tokenManager on every `onAuthStateChange`.
- **[Risk] adapter-loader removal is breaking** → Only internal consumers. `adapter-loader` is imported in `main.tsx`. Replace with direct imports of per-type factories in `defaultServices.ts`.
- **[Trade-off] SetupPage complexity** → Page now handles two backend types with different auth flows. Mitigate by extracting `GasSetupSection` and `SupabaseSetupSection` as separate components.

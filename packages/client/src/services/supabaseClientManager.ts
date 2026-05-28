import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getConnectionConfig } from "./connectionService";

const SDK_STORAGE_KEY_PREFIX = "sb";
const SDK_STORAGE_KEY_SUFFIX = "auth-token";
const DEFAULT_TOKEN_EXPIRY_S = 3600;
const MS_PER_SECOND = 1000;

let supabaseClient: SupabaseClient | null = null;

const OAUTH_RETURN_KEY = "oauth_return_pending";

/** Returns true if the page loaded with an OAuth hash fragment (implicit flow). */
export function isOauthReturn(): boolean {
  return sessionStorage.getItem(OAUTH_RETURN_KEY) === "1";
}

/** Clears the OAuth return flag after successful redirect. */
export function clearOauthReturnFlag(): void {
  sessionStorage.removeItem(OAUTH_RETURN_KEY);
}

// Auto-initialize from localStorage on module load so that module-level code in
// defaultServices.ts (evaluated after this module) can call getSupabaseClient() safely.
// This covers the OAuth redirect case where the page reloads with a saved Supabase config.
const bootConfig = getConnectionConfig();
if (bootConfig?.type === "supabase") {
  // On OAuth redirect, the URL hash contains access_token + refresh_token.
  // The SDK's _initialize() runs behind an async Web Lock; by the time it
  // acquires the lock, the app's router has already navigated away, clearing
  // the hash. Additionally, the SDK's _getUser() call inside setSession fails
  // with net::ERR_FAILED during initial page construction.
  //
  // Solution: parse the hash synchronously and store a session in the SDK's
  // localStorage format BEFORE createClient. When _initialize runs
  // _recoverAndRefresh, it finds the pre-stored session and emits
  // TOKEN_REFRESHED without any HTTP calls.
  const hashParams = new URLSearchParams(window.location.hash.substring(1));
  const hashAccessToken = hashParams.get("access_token");
  const hashRefreshToken = hashParams.get("refresh_token");

  if (hashAccessToken) {
    sessionStorage.setItem(OAUTH_RETURN_KEY, "1");
    const expiresIn = Number(
      hashParams.get("expires_in") ?? DEFAULT_TOKEN_EXPIRY_S,
    );
    const expiresAt = Math.round(Date.now() / MS_PER_SECOND) + expiresIn;
    const hostname = new URL(bootConfig.url).hostname.split(".")[0];
    const storageKey = `${SDK_STORAGE_KEY_PREFIX}-${hostname}-${SDK_STORAGE_KEY_SUFFIX}`;

    localStorage.setItem(
      storageKey,
      JSON.stringify({
        access_token: hashAccessToken,
        refresh_token: hashRefreshToken ?? "",
        expires_at: expiresAt,
        expires_in: expiresIn,
        token_type: hashParams.get("token_type") ?? "bearer",
      }),
    );

    // Clear hash so it doesn't confuse React Router or other code.
    window.history.replaceState(
      null,
      "",
      window.location.pathname + window.location.search,
    );
  }

  // detectSessionInUrl: false — we handle the hash ourselves above.
  supabaseClient = createClient(bootConfig.url, bootConfig.anonKey, {
    auth: { flowType: "implicit", detectSessionInUrl: false },
  });
}

// implements FR11, D2 of add-supabase-ui
export function getSupabaseClient(): SupabaseClient {
  if (!supabaseClient) {
    throw new Error(
      "Supabase client not initialized. Call createSupabaseClient() first.",
    );
  }
  return supabaseClient;
}

export function createSupabaseClient(
  url: string,
  anonKey: string,
): SupabaseClient {
  supabaseClient = createClient(url, anonKey, {
    auth: { flowType: "implicit" },
  });
  return supabaseClient;
}

export function destroySupabaseClient(): void {
  supabaseClient = null;
}

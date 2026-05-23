import type { SupabaseClient } from "@supabase/supabase-js";
import type React from "react";
import { useCallback, useEffect } from "react";
import { ROUTES } from "@/constants";
import { setAccessToken } from "@/services/tokenManager";

/**
 * Implements FR10 of add-supabase-ui.
 * Render-less component that syncs Supabase auth state with AuthProvider.
 * Mirrors GoogleAuthSync pattern: listens to onAuthStateChange,
 * populates signInRef/signOutRef/silentRefreshRef.
 */
export interface SupabaseAuthSyncProps {
  supabaseClient: SupabaseClient;
  onTokenUpdate: (token: string, expiresIn: number) => void;
  onClear: () => void;
  signInRef: React.MutableRefObject<() => void>;
  signOutRef: React.MutableRefObject<() => void>;
  silentRefreshRef: React.MutableRefObject<() => void>;
}

export function SupabaseAuthSync({
  supabaseClient,
  onTokenUpdate,
  onClear,
  signInRef,
  signOutRef,
  silentRefreshRef,
}: SupabaseAuthSyncProps): null {
  useEffect(() => {
    const { data } = supabaseClient.auth.onAuthStateChange((event, session) => {
      if (
        (event === "SIGNED_IN" ||
          event === "TOKEN_REFRESHED" ||
          event === "INITIAL_SESSION") &&
        session
      ) {
        onTokenUpdate(session.access_token, session.expires_in);
        setAccessToken(session.access_token, session.expires_in);
      } else if (event === "SIGNED_OUT") {
        setAccessToken(null);
        onClear();
      }
    });

    return () => {
      data.subscription.unsubscribe();
    };
  }, [supabaseClient, onTokenUpdate, onClear]);

  const doSignIn = useCallback(() => {
    void supabaseClient.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}${ROUTES.SETUP}` },
    });
  }, [supabaseClient]);

  const doSignOut = useCallback(() => {
    void supabaseClient.auth.signOut();
  }, [supabaseClient]);

  const doSilentRefresh = useCallback(() => {
    void supabaseClient.auth.refreshSession();
  }, [supabaseClient]);

  signInRef.current = doSignIn;
  signOutRef.current = doSignOut;
  silentRefreshRef.current = doSilentRefresh;

  // On unmount: clear auth state so SyncProvider stops syncing
  useEffect(() => {
    return () => {
      setAccessToken(null);
      onClear();
    };
  }, [onClear]);

  return null;
}

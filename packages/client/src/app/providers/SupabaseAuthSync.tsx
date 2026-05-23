import type { SupabaseClient } from "@supabase/supabase-js";
import type React from "react";
import { useCallback, useEffect } from "react";
import { STORAGE_KEYS } from "@/constants";
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
  onUserEmailUpdate: (email: string) => void;
  onUserPictureUpdate: (picture: string | null) => void;
  onClear: () => void;
  signInRef: React.MutableRefObject<() => void>;
  signOutRef: React.MutableRefObject<() => void>;
  silentRefreshRef: React.MutableRefObject<() => void>;
}

export function SupabaseAuthSync({
  supabaseClient,
  onTokenUpdate,
  onUserEmailUpdate,
  onUserPictureUpdate,
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

        // Extract profile data — skip on TOKEN_REFRESHED (like GoogleAuthSync skips on silent refresh)
        if (event !== "TOKEN_REFRESHED") {
          const userEmail = session.user.email;
          if (userEmail) {
            onUserEmailUpdate(userEmail);
          }

          const hasCachedPicture = !!localStorage.getItem(
            STORAGE_KEYS.USER_PICTURE,
          );
          // INITIAL_SESSION: only extract if not cached; SIGNED_IN: always extract
          if (!hasCachedPicture || event === "SIGNED_IN") {
            const metadata = session.user.user_metadata as Record<
              string,
              unknown
            >;
            const avatarUrl =
              typeof metadata.avatar_url === "string"
                ? metadata.avatar_url
                : typeof metadata.picture === "string"
                  ? metadata.picture
                  : null;
            if (avatarUrl) {
              onUserPictureUpdate(avatarUrl);
              localStorage.setItem(STORAGE_KEYS.USER_PICTURE, avatarUrl);
            }
          }
        }
      } else if (event === "SIGNED_OUT") {
        setAccessToken(null);
        onClear();
      }
    });

    return () => {
      data.subscription.unsubscribe();
    };
  }, [
    supabaseClient,
    onTokenUpdate,
    onUserEmailUpdate,
    onUserPictureUpdate,
    onClear,
  ]);

  const doSignIn = useCallback(() => {
    void supabaseClient.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}${import.meta.env.BASE_URL}setup`,
      },
    });
  }, [supabaseClient]);

  const doSignOut = useCallback(() => {
    localStorage.removeItem(STORAGE_KEYS.USER_PICTURE);
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

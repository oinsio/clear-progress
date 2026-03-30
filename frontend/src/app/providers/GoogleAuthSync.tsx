import { useCallback, useEffect, useRef } from "react";
import type React from "react";
import { useGoogleLogin } from "@react-oauth/google";
import { setAccessToken } from "@/services/ApiClient";
import { GOOGLE_USERINFO_URL, STORAGE_KEYS } from "@/constants";

const GOOGLE_OAUTH_SCOPES =
  "https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/userinfo.profile";

interface GoogleTokenResponse {
  access_token: string;
  expires_in: number;
}

function isGoogleTokenResponse(data: unknown): data is GoogleTokenResponse {
  if (typeof data !== "object" || data === null) return false;
  const record = data as Record<string, unknown>;
  return typeof record.access_token === "string" && typeof record.expires_in === "number";
}

export interface GoogleAuthSyncProps {
  onTokenUpdate: (token: string, expiresIn: number) => void;
  onUserEmailUpdate: (email: string) => void;
  onUserPictureUpdate: (picture: string | null) => void;
  onClear: () => void;
  signInRef: React.MutableRefObject<() => void>;
  signOutRef: React.MutableRefObject<() => void>;
  silentRefreshRef: React.MutableRefObject<() => void>;
}

export function GoogleAuthSync({
  onTokenUpdate,
  onUserEmailUpdate,
  onUserPictureUpdate,
  onClear,
  signInRef,
  signOutRef,
  silentRefreshRef,
}: GoogleAuthSyncProps): null {
  // Tracks whether the current OAuth flow was initiated silently (prompt: "none")
  const isSilentRef = useRef(false);

  const handleSuccess = useCallback(
    async (tokenResponse: unknown) => {
      if (!isGoogleTokenResponse(tokenResponse)) return;
      onTokenUpdate(tokenResponse.access_token, tokenResponse.expires_in);
      setAccessToken(tokenResponse.access_token, tokenResponse.expires_in);

      // Silent refresh — skip user info fetch (no interaction, no new data expected)
      if (isSilentRef.current) return;

      // Explicit login: try to get email from token response, then fetch picture
      const record = tokenResponse as unknown as Record<string, unknown>;
      if (typeof record.email === "string") {
        onUserEmailUpdate(record.email);
      }

      const hasCachedPicture = !!localStorage.getItem(STORAGE_KEYS.USER_PICTURE);
      if (hasCachedPicture) return;

      try {
        const userInfoResponse = await fetch(GOOGLE_USERINFO_URL, {
          headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
        });
        const userInfo = (await userInfoResponse.json()) as { picture?: string };
        const pictureUrl = userInfo.picture ?? null;
        if (pictureUrl) {
          onUserPictureUpdate(pictureUrl);
          localStorage.setItem(STORAGE_KEYS.USER_PICTURE, pictureUrl);
        }
      } catch (avatarError) {
        console.error("[GoogleAuthSync] Failed to load avatar:", avatarError);
      }
    },
    [onTokenUpdate, onUserEmailUpdate, onUserPictureUpdate],
  );

  const handleError = useCallback(() => {
    setAccessToken(null);
    onClear();
  }, [onClear]);

  const googleLogin = useGoogleLogin({
    flow: "implicit",
    scope: GOOGLE_OAUTH_SCOPES,
    onSuccess: (tokenResponse) => void handleSuccess(tokenResponse),
    onError: handleError,
  });

  // Always point to the latest googleLogin function (it's recreated on each render)
  const googleLoginRef = useRef(googleLogin);
  googleLoginRef.current = googleLogin;

  // On mount: attempt silent session restoration
  useEffect(() => {
    isSilentRef.current = true;
    googleLoginRef.current({ prompt: "none" });
  }, []);

  // On unmount: clear auth state so SyncProvider stops syncing
  useEffect(() => {
    return () => {
      setAccessToken(null);
      onClear();
    };
  }, [onClear]);

  // Populate action refs so AuthProvider can expose stable signIn/signOut/silentRefresh functions
  const doSignIn = useCallback(() => {
    isSilentRef.current = false;
    googleLoginRef.current();
  }, []);

  const doSignOut = useCallback(() => {
    setAccessToken(null);
    onClear();
  }, [onClear]);

  const doSilentRefresh = useCallback(() => {
    isSilentRef.current = true;
    googleLoginRef.current({ prompt: "none" });
  }, []);

  signInRef.current = doSignIn;
  signOutRef.current = doSignOut;
  silentRefreshRef.current = doSilentRefresh;

  return null;
}

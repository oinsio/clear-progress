import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import * as React from "react";
import { useGoogleLogin } from "@react-oauth/google";
import { setAccessToken } from "@/services/ApiClient";
import { GOOGLE_USERINFO_URL, STORAGE_KEYS } from "@/constants";

const GOOGLE_OAUTH_SCOPES =
  "https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/userinfo.profile";

interface AuthContextValue {
  accessToken: string | null;
  userEmail: string | null;
  userPicture: string | null;
  signIn: () => void;
  signOut: () => void;
  silentRefresh: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

interface GoogleTokenResponse {
  access_token: string;
  expires_in: number;
  token_type?: string;
  scope?: string;
}

function isGoogleTokenResponse(data: unknown): data is GoogleTokenResponse {
  if (typeof data !== "object" || data === null) return false;
  const record = data as Record<string, unknown>;
  return typeof record.access_token === "string" && typeof record.expires_in === "number";
}

interface GoogleUserInfo {
  picture?: string;
  email?: string;
}

function GoogleAuthInner({ children }: { children: React.ReactNode }) {
  const [accessToken, setAccessTokenState] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userPicture, setUserPicture] = useState<string | null>(
    () => localStorage.getItem(STORAGE_KEYS.USER_PICTURE),
  );

  const handleLoginSuccess = useCallback(async (tokenResponse: unknown) => {
    if (!isGoogleTokenResponse(tokenResponse)) return;
    setAccessTokenState(tokenResponse.access_token);
    setAccessToken(tokenResponse.access_token, tokenResponse.expires_in);
    const record = tokenResponse as unknown as Record<string, unknown>;
    if (typeof record.email === "string") {
      setUserEmail(record.email);
    }

    const hasCachedPicture = !!localStorage.getItem(STORAGE_KEYS.USER_PICTURE);
    if (hasCachedPicture) return;
    try {
      const userInfoResponse = await fetch(GOOGLE_USERINFO_URL, {
        headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
      });
      const userInfo = (await userInfoResponse.json()) as GoogleUserInfo;
      const pictureUrl = userInfo.picture ?? null;
      if (pictureUrl) {
        setUserPicture(pictureUrl);
        localStorage.setItem(STORAGE_KEYS.USER_PICTURE, pictureUrl);
      }
    } catch {
      // non-critical — avatar is a nice-to-have
    }
  }, []);

  const handleSilentLoginSuccess = useCallback((tokenResponse: unknown) => {
    if (!isGoogleTokenResponse(tokenResponse)) return;
    setAccessTokenState(tokenResponse.access_token);
    setAccessToken(tokenResponse.access_token, tokenResponse.expires_in);
  }, []);

  const handleLoginError = useCallback(() => {
    setAccessTokenState(null);
    setUserEmail(null);
    setUserPicture(null);
    localStorage.removeItem(STORAGE_KEYS.USER_PICTURE);
    setAccessToken(null);
  }, []);

  const handleSilentLoginError = useCallback(() => {
    setAccessTokenState(null);
    setUserEmail(null);
    setAccessToken(null);
  }, []);

  const isSilentRef = useRef(false);

  const handleLoginSuccessWrapper = useCallback(
    (tokenResponse: unknown) => {
      if (isSilentRef.current) {
        handleSilentLoginSuccess(tokenResponse);
      } else {
        void handleLoginSuccess(tokenResponse);
      }
    },
    [handleLoginSuccess, handleSilentLoginSuccess],
  );

  const handleLoginErrorWrapper = useCallback(() => {
    if (isSilentRef.current) {
      handleSilentLoginError();
    } else {
      handleLoginError();
    }
  }, [handleLoginError, handleSilentLoginError]);

  const googleLogin = useGoogleLogin({
    flow: "implicit",
    scope: GOOGLE_OAUTH_SCOPES,
    onSuccess: handleLoginSuccessWrapper,
    onError: handleLoginErrorWrapper,
  });

  const googleLoginRef = useRef(googleLogin);
  googleLoginRef.current = googleLogin;

  useEffect(() => {
    isSilentRef.current = true;
    googleLoginRef.current({ prompt: "none" });
  }, []);

  const signIn = useCallback(() => {
    isSilentRef.current = false;
    googleLoginRef.current();
  }, []);

  const signOut = useCallback(() => {
    setAccessTokenState(null);
    setUserEmail(null);
    setUserPicture(null);
    localStorage.removeItem(STORAGE_KEYS.USER_PICTURE);
    setAccessToken(null);
  }, []);

  const silentRefresh = useCallback(() => {
    isSilentRef.current = true;
    googleLoginRef.current({ prompt: "none" });
  }, []);

  return (
    <AuthContext.Provider value={{ accessToken, userEmail, userPicture, signIn, signOut, silentRefresh }}>
      {children}
    </AuthContext.Provider>
  );
}

function NoAuthInner({ children }: { children: React.ReactNode }) {
  const signIn = useCallback(() => {}, []);
  const signOut = useCallback(() => {}, []);
  const silentRefresh = useCallback(() => {}, []);

  return (
    <AuthContext.Provider value={{ accessToken: null, userEmail: null, userPicture: null, signIn, signOut, silentRefresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const isGoogleConfigured = !!localStorage.getItem(STORAGE_KEYS.GOOGLE_CLIENT_ID);

  if (isGoogleConfigured) {
    return <GoogleAuthInner>{children}</GoogleAuthInner>;
  }
  return <NoAuthInner>{children}</NoAuthInner>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}

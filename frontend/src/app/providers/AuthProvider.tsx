import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import * as React from "react";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { setAccessToken } from "@/services/ApiClient";
import { GOOGLE_CLIENT_ID_CHANGED_EVENT, STORAGE_KEYS } from "@/constants";
import { GoogleAuthSync } from "./GoogleAuthSync";

interface AuthContextValue {
  accessToken: string | null;
  userEmail: string | null;
  userPicture: string | null;
  signIn: () => void;
  signOut: () => void;
  silentRefresh: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const noop = () => {};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [googleClientId, setGoogleClientId] = useState<string | null>(() =>
    localStorage.getItem(STORAGE_KEYS.GOOGLE_CLIENT_ID),
  );
  const [accessToken, setAccessTokenState] = useState<string | null>(() => {
    const storedToken = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    const storedExpiresAt = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN_EXPIRES_AT);
    if (storedToken && storedExpiresAt && Date.now() < Number(storedExpiresAt)) {
      return storedToken;
    }
    return null;
  });
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userPicture, setUserPicture] = useState<string | null>(
    () => localStorage.getItem(STORAGE_KEYS.USER_PICTURE),
  );

  // Stable action refs — populated by GoogleAuthSync, called by stable context functions
  const signInRef = useRef<() => void>(noop);
  const signOutRef = useRef<() => void>(noop);
  const silentRefreshRef = useRef<() => void>(noop);

  useEffect(() => {
    const handleChange = () => {
      setGoogleClientId(localStorage.getItem(STORAGE_KEYS.GOOGLE_CLIENT_ID));
    };
    window.addEventListener(GOOGLE_CLIENT_ID_CHANGED_EVENT, handleChange);
    return () => window.removeEventListener(GOOGLE_CLIENT_ID_CHANGED_EVENT, handleChange);
  }, []);

  // When Google Client ID is removed, reset auth refs to no-ops
  useEffect(() => {
    if (!googleClientId) {
      signInRef.current = noop;
      signOutRef.current = noop;
      silentRefreshRef.current = noop;
    }
  }, [googleClientId]);

  const handleTokenUpdate = useCallback((token: string, expiresIn: number) => {
    setAccessTokenState(token);
    setAccessToken(token, expiresIn);
  }, []);

  const handleUserEmailUpdate = useCallback((email: string) => {
    setUserEmail(email);
  }, []);

  const handleUserPictureUpdate = useCallback((picture: string | null) => {
    setUserPicture(picture);
    if (picture) {
      localStorage.setItem(STORAGE_KEYS.USER_PICTURE, picture);
    }
  }, []);

  const handleClear = useCallback(() => {
    setAccessTokenState(null);
    setUserEmail(null);
    setUserPicture(null);
    localStorage.removeItem(STORAGE_KEYS.USER_PICTURE);
    setAccessToken(null);
  }, []);

  // Stable context functions — always call through the ref so they never change identity
  const signIn = useCallback(() => signInRef.current(), []);
  const signOut = useCallback(() => signOutRef.current(), []);
  const silentRefresh = useCallback(() => silentRefreshRef.current(), []);

  const contextValue = useMemo<AuthContextValue>(
    () => ({ accessToken, userEmail, userPicture, signIn, signOut, silentRefresh }),
    [accessToken, userEmail, userPicture, signIn, signOut, silentRefresh],
  );

  return (
    <AuthContext.Provider value={contextValue}>
      {googleClientId && (
        <GoogleOAuthProvider clientId={googleClientId}>
          {/*
           * GoogleAuthSync is a render-less component (returns null).
           * It lives inside GoogleOAuthProvider (needs the context for useGoogleLogin),
           * but is NOT wrapping children — so children never remount when clientId changes.
           */}
          <GoogleAuthSync
            onTokenUpdate={handleTokenUpdate}
            onUserEmailUpdate={handleUserEmailUpdate}
            onUserPictureUpdate={handleUserPictureUpdate}
            onClear={handleClear}
            signInRef={signInRef}
            signOutRef={signOutRef}
            silentRefreshRef={silentRefreshRef}
          />
        </GoogleOAuthProvider>
      )}
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}

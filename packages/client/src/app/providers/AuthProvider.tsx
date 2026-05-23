import { GoogleOAuthProvider } from "@react-oauth/google";
import type * as React from "react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  BACKEND_CONNECTION_EVENT,
  GOOGLE_CLIENT_ID_CHANGED_EVENT,
  STORAGE_KEYS,
} from "@/constants";
import { Temporal } from "@/lib/temporal";
import { getConnectionConfig } from "@/services/connectionService";
import { getSupabaseClient } from "@/services/supabaseClientManager";
import { setAccessToken } from "@/services/tokenManager";
import { GoogleAuthSync } from "./GoogleAuthSync";
import { SupabaseAuthSync } from "./SupabaseAuthSync";

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
  const [googleClientId, setGoogleClientId] = useState<string | null>(() => {
    const config = getConnectionConfig();
    return config?.type === "gas" ? (config.clientId ?? null) : null;
  });
  const [isSupabaseBackend, setIsSupabaseBackend] = useState<boolean>(() => {
    const config = getConnectionConfig();
    return config?.type === "supabase";
  });
  const [accessToken, setAccessTokenState] = useState<string | null>(() => {
    const config = getConnectionConfig();
    // For Supabase, the Supabase client initializes its session asynchronously.
    // Pre-populating from our localStorage creates a race: sync starts before
    // client.auth.getSession() is ready, causing 401s. We wait for onAuthStateChange
    // (INITIAL_SESSION or SIGNED_IN) to set the token instead.
    if (config?.type === "supabase") {
      return null;
    }
    const storedToken = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    const storedExpiresAt = localStorage.getItem(
      STORAGE_KEYS.ACCESS_TOKEN_EXPIRES_AT,
    );
    if (
      storedToken &&
      storedExpiresAt &&
      Temporal.Now.instant().epochMilliseconds < Number(storedExpiresAt)
    ) {
      return storedToken;
    }
    return null;
  });
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userPicture, setUserPicture] = useState<string | null>(() =>
    localStorage.getItem(STORAGE_KEYS.USER_PICTURE),
  );

  // Stable action refs — populated by GoogleAuthSync, called by stable context functions
  const signInRef = useRef<() => void>(noop);
  const signOutRef = useRef<() => void>(noop);
  const silentRefreshRef = useRef<() => void>(noop);

  // Track previous googleClientId to detect real disconnection vs initial mount
  const prevGoogleClientIdRef = useRef<string | null>(googleClientId);

  useEffect(() => {
    const handleChange = () => {
      const config = getConnectionConfig();
      const newClientId =
        config?.type === "gas" ? (config.clientId ?? null) : null;
      setGoogleClientId(newClientId);
    };
    window.addEventListener(GOOGLE_CLIENT_ID_CHANGED_EVENT, handleChange);
    return () =>
      window.removeEventListener(GOOGLE_CLIENT_ID_CHANGED_EVENT, handleChange);
  }, []);

  useEffect(() => {
    const handleBackendChange = () => {
      const config = getConnectionConfig();
      setIsSupabaseBackend(config?.type === "supabase");
    };
    window.addEventListener(BACKEND_CONNECTION_EVENT, handleBackendChange);
    return () =>
      window.removeEventListener(BACKEND_CONNECTION_EVENT, handleBackendChange);
  }, []);

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
    setAccessToken(null);
  }, []);

  // When Google Client ID is removed, reset auth refs to no-ops and clear auth state
  useEffect(() => {
    const prevClientId = prevGoogleClientIdRef.current;
    prevGoogleClientIdRef.current = googleClientId;

    // Clear auth state only when transitioning from clientId to null (real disconnect)
    if (prevClientId && !googleClientId) {
      signInRef.current = noop;
      signOutRef.current = noop;
      silentRefreshRef.current = noop;
      handleClear();
    } else if (!googleClientId) {
      // Initial mount without Client ID — only reset refs, don't clear cached data
      signInRef.current = noop;
      signOutRef.current = noop;
      silentRefreshRef.current = noop;
    }
  }, [googleClientId, handleClear]);

  // Stable context functions — always call through the ref so they never change identity
  const signIn = useCallback(() => signInRef.current(), []);
  const signOut = useCallback(() => signOutRef.current(), []);
  const silentRefresh = useCallback(() => silentRefreshRef.current(), []);

  const contextValue = useMemo<AuthContextValue>(
    () => ({
      accessToken,
      userEmail,
      userPicture,
      signIn,
      signOut,
      silentRefresh,
    }),
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
      {isSupabaseBackend && (
        <SupabaseAuthSync
          supabaseClient={getSupabaseClient()}
          onTokenUpdate={handleTokenUpdate}
          onUserEmailUpdate={handleUserEmailUpdate}
          onUserPictureUpdate={handleUserPictureUpdate}
          onClear={handleClear}
          signInRef={signInRef}
          signOutRef={signOutRef}
          silentRefreshRef={silentRefreshRef}
        />
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

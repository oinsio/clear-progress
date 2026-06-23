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
import { BACKEND_CONNECTION_EVENT, STORAGE_KEYS } from "@/constants";
import { getConnectionConfig } from "@/services/connectionService";
import { getSupabaseClient } from "@/services/supabaseClientManager";
import { getAccessToken, setAccessToken } from "@/services/tokenManager";
import { SupabaseAuthSync } from "./SupabaseAuthSync";

interface AuthContextValue {
  accessToken: string | null;
  authProvider: string | null;
  userEmail: string | null;
  userPicture: string | null;
  signIn: () => void;
  signOut: () => void;
  silentRefresh: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const noop = () => {};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isSupabaseBackend, setIsSupabaseBackend] = useState<boolean>(() => {
    const config = getConnectionConfig();
    return config?.type === "supabase";
  });
  const [accessToken, setAccessTokenState] = useState<string | null>(() => {
    return getAccessToken();
  });
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [authProvider, setAuthProvider] = useState<string | null>(null);
  const [userPicture, setUserPicture] = useState<string | null>(() =>
    localStorage.getItem(STORAGE_KEYS.USER_PICTURE),
  );

  // Stable action refs — populated by SupabaseAuthSync, called by stable context functions
  const signInRef = useRef<() => void>(noop);
  const signOutRef = useRef<() => void>(noop);
  const silentRefreshRef = useRef<() => void>(noop);

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

  const handleAuthProviderUpdate = useCallback((provider: string) => {
    setAuthProvider(provider);
  }, []);

  const handleClear = useCallback(() => {
    setAccessTokenState(null);
    setAuthProvider(null);
    setUserEmail(null);
    setUserPicture(null);
    setAccessToken(null);
  }, []);

  // Stable context functions — always call through the ref so they never change identity
  const signIn = useCallback(() => signInRef.current(), []);
  const signOut = useCallback(() => signOutRef.current(), []);
  const silentRefresh = useCallback(() => silentRefreshRef.current(), []);

  const contextValue = useMemo<AuthContextValue>(
    () => ({
      accessToken,
      authProvider,
      userEmail,
      userPicture,
      signIn,
      signOut,
      silentRefresh,
    }),
    [
      accessToken,
      authProvider,
      userEmail,
      userPicture,
      signIn,
      signOut,
      silentRefresh,
    ],
  );

  return (
    <AuthContext.Provider value={contextValue}>
      {isSupabaseBackend && (
        <SupabaseAuthSync
          supabaseClient={getSupabaseClient()}
          onTokenUpdate={handleTokenUpdate}
          onUserEmailUpdate={handleUserEmailUpdate}
          onUserPictureUpdate={handleUserPictureUpdate}
          onAuthProviderUpdate={handleAuthProviderUpdate}
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

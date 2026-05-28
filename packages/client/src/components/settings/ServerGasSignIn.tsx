import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/app/providers/AuthProvider";
import { getDefaultSyncAdapter } from "@/services/defaultServices";

interface ServerGasSignInProps {
  needsInit: boolean;
  onInitComplete: () => void;
  onInitError: (message: string) => void;
}

/**
 * Implements FR3, NFR-A2 of simplify-backend-connection.
 * "Sign in with Google" button. When token arrives and needsInit is true,
 * calls getDefaultSyncAdapter().init() to initialize the backend.
 */
export function ServerGasSignIn({
  needsInit,
  onInitComplete,
  onInitError,
}: ServerGasSignInProps) {
  const { t } = useTranslation();
  const { signIn, accessToken } = useAuth();
  const isInitializingRef = useRef(false);

  useEffect(() => {
    if (!accessToken || !needsInit || isInitializingRef.current) return;

    isInitializingRef.current = true;

    const runInit = async (): Promise<void> => {
      try {
        const response = await getDefaultSyncAdapter().init();
        if (!response.ok) {
          onInitError(t("settings.server.initError"));
          return;
        }
        onInitComplete();
      } catch {
        onInitError(t("settings.server.initError"));
      } finally {
        isInitializingRef.current = false;
      }
    };

    void runInit();
  }, [accessToken, needsInit, onInitComplete, onInitError, t]);

  const isInitializing = accessToken !== null && needsInit;

  return (
    <div data-testid="server-gas-signin" className="space-y-3">
      {isInitializing ? (
        <div
          data-testid="server-gas-initializing"
          role="status"
          aria-live="polite"
          className="flex items-center gap-2 text-sm text-gray-500"
        >
          <span className="inline-block animate-spin">&#x27F3;</span>
          {t("settings.server.initializing")}
        </div>
      ) : (
        <>
          <p className="text-sm font-medium text-blue-900">
            {t("settings.server.signInRequired")}
          </p>
          <button
            data-testid="server-gas-signin-button"
            onClick={signIn}
            className="w-full rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition-colors"
          >
            {t("settings.server.signInWithGoogle")}
          </button>
        </>
      )}
    </div>
  );
}

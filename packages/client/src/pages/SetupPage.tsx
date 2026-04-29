import { createAdapter } from "@clear-progress/contract";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/app/providers/AuthProvider";
import { ROUTES } from "@/constants";
import {
  connect,
  disconnect,
  getConnectionConfig,
  getSavedConnectionConfig,
} from "@/services/connectionService";
import { getDefaultSyncAdapter } from "@/services/defaultServices";
import { getAccessToken } from "@/services/tokenManager";
import { cn } from "@/shared/lib/cn";
import { parseClientId } from "@/utils/clientId";
import { parseGasInput } from "@/utils/gasUrl";

type SetupPhase =
  | "input"
  | "connecting"
  | "awaiting_signin"
  | "not_initialized"
  | "initializing"
  | "connected"
  | "error";

export default function SetupPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const { accessToken, signIn } = useAuth();
  const config = getConnectionConfig(); // активный конфиг (или null)
  const savedConfig = getSavedConnectionConfig(); // любой конфиг (для предзаполнения)
  const savedUrl = savedConfig?.type === "gas" ? savedConfig.url : "";
  const savedClientId =
    savedConfig?.type === "gas" ? (savedConfig.clientId ?? "") : "";

  // Для отображения в секции "connected" используем активный конфиг
  const existingUrl = config?.type === "gas" ? config.url : "";
  const existingClientId =
    config?.type === "gas" ? (config.clientId ?? "") : "";

  const [urlInput, setUrlInput] = useState(savedUrl);
  const [clientIdInput, setClientIdInput] = useState(savedClientId);
  const [phase, setPhase] = useState<SetupPhase>(() =>
    config ? "connected" : "input",
  );
  const [needsInit, setNeedsInit] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isGasSectionOpen, setIsGasSectionOpen] = useState(true);
  const prevAccessTokenRef = useRef<string | null>(accessToken);

  const handleInit = useCallback(async (): Promise<void> => {
    setPhase("initializing");
    setErrorMessage("");

    try {
      const response = await getDefaultSyncAdapter().init();
      if (!response.ok) {
        setPhase("error");
        setErrorMessage(t("setup.errorInit"));
        return;
      }
      navigate(ROUTES.INBOX);
    } catch {
      setPhase("error");
      setErrorMessage(t("setup.errorInit"));
    }
  }, [t, navigate]);

  // After sign-in succeeds: initialize backend if needed, or navigate to app.
  // Using prevAccessTokenRef to detect the null → token transition on this mount
  // (avoids spurious navigation if accessToken was already set when page loaded).
  useEffect(() => {
    const previousToken = prevAccessTokenRef.current;
    prevAccessTokenRef.current = accessToken;
    if (previousToken === null && accessToken !== null) {
      if (phase === "awaiting_signin") {
        if (needsInit) {
          void handleInit();
        } else {
          navigate(ROUTES.INBOX);
        }
      } else if (phase === "connected") {
        navigate(ROUTES.INBOX);
      }
    }
  }, [accessToken, phase, needsInit, navigate, handleInit]);

  const handleConnect = async (): Promise<void> => {
    const trimmedInput = urlInput.trim();
    if (!trimmedInput) return;

    const resolvedUrl = parseGasInput(trimmedInput);
    setPhase("connecting");
    setErrorMessage("");

    try {
      const tempAdapter = createAdapter("gas", resolvedUrl, getAccessToken);
      const response = await tempAdapter.ping();
      if (!response.ok) {
        setPhase("error");
        setErrorMessage(t("setup.errorConnection"));
        return;
      }

      const trimmedClientId = clientIdInput.trim();
      const normalizedClientId = trimmedClientId
        ? parseClientId(trimmedClientId)
        : undefined;

      connect({
        type: "gas",
        url: resolvedUrl,
        clientId: normalizedClientId,
        isActive: true,
      });

      if (normalizedClientId) {
        setNeedsInit(!response.initialized);
        setPhase("awaiting_signin");
      } else if (response.initialized) {
        navigate(ROUTES.INBOX);
      } else {
        setPhase("not_initialized");
      }
    } catch {
      setPhase("error");
      setErrorMessage(t("setup.errorConnection"));
    }
  };

  const handleDisconnect = (): void => {
    disconnect();
    setNeedsInit(false);
    setPhase("input");
    // urlInput и clientIdInput НЕ сбрасываются — сохраняют текущие значения
  };

  const handleBackToInput = (): void => {
    setPhase("input");
    setErrorMessage("");
  };

  const isConnected = phase === "connected";
  const isLoading = phase === "connecting" || phase === "initializing";

  return (
    <div
      data-testid="setup-page"
      className="relative flex flex-1 overflow-hidden bg-white"
    >
      <div className="flex flex-1 flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-lg space-y-8 px-4 py-6">
            <h1 className="text-xl font-semibold text-gray-900">
              {t("setup.name")}
            </h1>

            {isConnected ? (
              <>
                {/* Current URL section */}
                <section className="space-y-3">
                  <h2 className="text-sm font-medium uppercase tracking-wide text-gray-500">
                    {t("setup.connectedUrl")}
                  </h2>
                  <div
                    data-testid="setup-current-url"
                    className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3"
                  >
                    <p className="break-all font-mono text-sm text-gray-800">
                      {existingUrl}
                    </p>
                  </div>
                </section>

                {/* Google Client ID section */}
                {existingClientId && (
                  <section className="space-y-3">
                    <h2 className="text-sm font-medium uppercase tracking-wide text-gray-500">
                      {t("setup.clientIdLabel")}
                    </h2>
                    <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
                      <p className="break-all font-mono text-sm text-gray-800">
                        {existingClientId}
                      </p>
                    </div>
                  </section>
                )}

                {/* Sign-in prompt when connected but not authenticated */}
                {existingClientId && !accessToken && (
                  <section className="space-y-3">
                    <div
                      data-testid="setup-sign-in-required"
                      className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 space-y-2"
                    >
                      <p className="text-sm text-blue-800">
                        {t("auth.signInRequired")}
                      </p>
                      <button
                        data-testid="setup-sign-in-btn"
                        onClick={signIn}
                        className="w-full rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition-colors"
                      >
                        {t("auth.signInButton")}
                      </button>
                    </div>
                  </section>
                )}

                {/* Actions section */}
                <section className="flex gap-2">
                  <button
                    data-testid="setup-disconnect-button"
                    onClick={handleDisconnect}
                    className="flex-1 rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-700 transition-colors hover:border-gray-300"
                  >
                    {t("setup.disconnect")}
                  </button>
                  <button
                    onClick={() => navigate(ROUTES.INBOX)}
                    className="flex-1 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition-colors"
                  >
                    {t("setup.goToApp")}
                  </button>
                </section>
              </>
            ) : (
              <>
                {/* Google Apps Script collapsible section */}
                <section className="space-y-3">
                  <button
                    data-testid="setup-gas-section-toggle"
                    onClick={() => setIsGasSectionOpen((prev) => !prev)}
                    className="flex w-full items-center justify-between rounded-lg border border-gray-200 px-4 py-3 text-sm font-medium text-gray-700 transition-colors hover:border-gray-300"
                  >
                    <span>{t("setup.gasSection")}</span>
                    <span className="text-gray-400">
                      {isGasSectionOpen ? "▲" : "▼"}
                    </span>
                  </button>

                  {isGasSectionOpen && (
                    <div className="space-y-4 rounded-lg border border-gray-100 bg-gray-50 px-4 py-4">
                      {/* Awaiting sign-in step (shown after connect, before OAuth) */}
                      {phase === "awaiting_signin" && (
                        <div
                          data-testid="setup-awaiting-signin"
                          className="space-y-3"
                        >
                          <p className="text-sm font-medium text-blue-900">
                            {t("setup.awaitingSignin")}
                          </p>
                          <button
                            data-testid="setup-sign-in-btn"
                            onClick={signIn}
                            className="w-full rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition-colors"
                          >
                            {t("auth.signInButton")}
                          </button>
                        </div>
                      )}

                      {/* URL input */}
                      {phase !== "awaiting_signin" && (
                        <div className="space-y-2">
                          <h2 className="text-sm font-medium uppercase tracking-wide text-gray-500">
                            {t("setup.urlLabel")}
                          </h2>
                          <input
                            data-testid="setup-url-input"
                            type="text"
                            value={urlInput}
                            onChange={(e) => setUrlInput(e.target.value)}
                            placeholder={t("setup.urlPlaceholder")}
                            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none transition-colors focus:border-accent"
                          />
                          <p className="text-xs text-gray-400">
                            {t("setup.description")}
                          </p>
                        </div>
                      )}

                      {/* Google OAuth 2.0 Client ID input */}
                      {phase !== "awaiting_signin" && (
                        <div className="space-y-2">
                          <h2 className="text-sm font-medium uppercase tracking-wide text-gray-500">
                            {t("setup.clientIdLabel")}
                          </h2>
                          <input
                            data-testid="setup-client-id-input"
                            type="text"
                            value={clientIdInput}
                            onChange={(e) => setClientIdInput(e.target.value)}
                            placeholder={t("setup.clientIdPlaceholder")}
                            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none transition-colors focus:border-accent"
                          />
                          <p className="text-xs text-gray-400">
                            {t("setup.clientIdDescription")}
                          </p>
                        </div>
                      )}

                      {/* Status feedback */}
                      {isLoading && (
                        <div
                          data-testid="setup-loading"
                          className="flex items-center gap-2 text-sm text-gray-500"
                        >
                          <span className="inline-block animate-spin">⟳</span>
                          {phase === "connecting"
                            ? t("setup.connecting")
                            : t("setup.initializing")}
                        </div>
                      )}

                      {phase === "error" && (
                        <div
                          data-testid="setup-error"
                          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                        >
                          {errorMessage}
                        </div>
                      )}

                      {/* Not initialized flow (no clientId case) */}
                      {phase === "not_initialized" && (
                        <div className="space-y-3">
                          <div className="rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
                            {t("setup.notInitializedNeedClientId")}
                          </div>
                          <button
                            data-testid="setup-back-button"
                            onClick={handleBackToInput}
                            className="w-full rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:border-gray-300"
                          >
                            {t("setup.backToInput")}
                          </button>
                        </div>
                      )}

                      {/* Connect button */}
                      {phase !== "not_initialized" &&
                        phase !== "awaiting_signin" && (
                          <button
                            data-testid="setup-connect-button"
                            onClick={handleConnect}
                            disabled={!urlInput.trim() || isLoading}
                            className={cn(
                              "w-full rounded-lg px-4 py-2 text-sm font-medium transition-colors",
                              urlInput.trim() && !isLoading
                                ? "bg-accent text-white"
                                : "cursor-not-allowed bg-gray-100 text-gray-400",
                            )}
                          >
                            {t("setup.connect")}
                          </button>
                        )}
                    </div>
                  )}
                </section>

                {/* Skip button — always visible */}
                <button
                  data-testid="setup-skip-button"
                  onClick={() => navigate(ROUTES.INBOX)}
                  className="w-full text-center text-sm text-gray-500 transition-colors hover:text-gray-700"
                >
                  {t("setup.skip")}
                </button>
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

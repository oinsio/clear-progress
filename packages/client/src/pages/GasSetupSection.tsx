import { createGasAdapter } from "@clear-progress/adapter-gas";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/app/providers/AuthProvider";
import { ROUTES } from "@/constants";
import {
  connect,
  getConnectionConfig,
  getSavedConnectionConfig,
} from "@/services/connectionService";
import { getDefaultSyncAdapter } from "@/services/defaultServices";
import { getAccessToken } from "@/services/tokenManager";
import { cn } from "@/shared/lib/cn";
import { parseClientId } from "@/utils/clientId";
import { parseGasInput } from "@/utils/gasUrl";

type GasPhase =
  | "input"
  | "connecting"
  | "awaiting_signin"
  | "not_initialized"
  | "initializing"
  | "error";

interface GasSetupSectionProps {
  isOpen: boolean;
  onToggle: () => void;
}

/**
 * Implements D7 of add-supabase-ui.
 * GAS backend connection section extracted from SetupPage.
 */
export function GasSetupSection({ isOpen, onToggle }: GasSetupSectionProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { signIn } = useAuth();

  const savedConfig = getSavedConnectionConfig();
  const savedUrl = savedConfig?.type === "gas" ? savedConfig.url : "";
  const savedClientId =
    savedConfig?.type === "gas" ? (savedConfig.clientId ?? "") : "";

  const [urlInput, setUrlInput] = useState(savedUrl);
  const [clientIdInput, setClientIdInput] = useState(savedClientId);
  const [phase, setPhase] = useState<GasPhase>("input");
  const [needsInit, setNeedsInit] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const isLoading = phase === "connecting" || phase === "initializing";

  const handleConnect = async (): Promise<void> => {
    const trimmedInput = urlInput.trim();
    if (!trimmedInput) return;

    const resolvedUrl = parseGasInput(trimmedInput);
    setPhase("connecting");
    setErrorMessage("");

    try {
      const tempAdapter = createGasAdapter(resolvedUrl, getAccessToken);
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

  const handleInit = async (): Promise<void> => {
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
  };

  const handleBackToInput = (): void => {
    setPhase("input");
    setErrorMessage("");
  };

  // Handle token arrival for init flow
  const config = getConnectionConfig();
  const { accessToken } = useAuth();
  if (
    phase === "awaiting_signin" &&
    accessToken !== null &&
    needsInit &&
    config?.type === "gas"
  ) {
    void handleInit();
  }

  return (
    <section className="space-y-3">
      <button
        data-testid="setup-gas-section-toggle"
        onClick={onToggle}
        className="flex w-full items-center justify-between rounded-lg border border-gray-200 px-4 py-3 text-sm font-medium text-gray-700 transition-colors hover:border-gray-300"
      >
        <span>{t("setup.gasSection")}</span>
        <span className="text-gray-400">{isOpen ? "▲" : "▼"}</span>
      </button>

      {isOpen && (
        <div className="space-y-4 rounded-lg border border-gray-100 bg-gray-50 px-4 py-4">
          {/* Awaiting sign-in step */}
          {phase === "awaiting_signin" && (
            <div data-testid="setup-awaiting-signin" className="space-y-3">
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
              <p className="text-xs text-gray-400">{t("setup.description")}</p>
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

          {/* Not initialized flow */}
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
          {phase !== "not_initialized" && phase !== "awaiting_signin" && (
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
  );
}

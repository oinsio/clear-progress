import { createGasAdapter } from "@clear-progress/adapter-gas";
import { type ReactNode, useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSync } from "@/app/providers/SyncProvider";
import { ConfirmDisconnectDialog } from "@/components/settings/ConfirmDisconnectDialog";
import { ConfirmFullSyncDialog } from "@/components/settings/ConfirmFullSyncDialog";
import { ServerBackendSelection } from "@/components/settings/ServerBackendSelection";
import { ServerConnectedStatus } from "@/components/settings/ServerConnectedStatus";
import { ServerEmailVerify } from "@/components/settings/ServerEmailVerify";
import { ServerGasForm } from "@/components/settings/ServerGasForm";
import { ServerGasSignIn } from "@/components/settings/ServerGasSignIn";
import { ServerOAuthProviders } from "@/components/settings/ServerOAuthProviders";
import { ServerSupabaseForm } from "@/components/settings/ServerSupabaseForm";
import { useEmailOtp } from "@/components/settings/useEmailOtp";
import { ROUTES } from "@/constants";
import { useConnectionConfig } from "@/hooks/useConnectionConfig";
import { connect, disconnect } from "@/services/connectionService";
import {
  createSupabaseClient,
  getSupabaseClient,
} from "@/services/supabaseClientManager";
import { fetchSupabaseProviders } from "@/services/supabaseConnection";
import { getAccessToken } from "@/services/tokenManager";
import { parseClientId } from "@/utils/clientId";
import { parseGasInput } from "@/utils/gasUrl";
import { parseSupabaseInput } from "@/utils/supabaseUrl";

type ServerPhase =
  | "selection"
  | "supabase_form"
  | "gas_form"
  | "supabase_connecting"
  | "gas_connecting"
  | "supabase_providers"
  | "supabase_email_otp"
  | "gas_awaiting_signin"
  | "connected";

interface ServerSectionProps {
  /** OAuth error message from callback query params (FR14 of simplify-backend-connection) */
  oauthError?: string;
}

/** Implements FR1, FR2, FR3 of simplify-backend-connection. */
export function ServerSection({ oauthError = "" }: ServerSectionProps) {
  const { t } = useTranslation();
  const config = useConnectionConfig();
  const { triggerFullSync } = useSync();

  const [phase, setPhase] = useState<ServerPhase>(
    config ? "connected" : "selection",
  );
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(oauthError);
  const [providers, setProviders] = useState<string[]>([]);
  const [isEmailEnabled, setIsEmailEnabled] = useState(false);
  const emailOtp = useEmailOtp();
  const [needsGasInit, setNeedsGasInit] = useState(false);
  const [isDisconnectDialogOpen, setIsDisconnectDialogOpen] = useState(false);
  const [isFullSyncDialogOpen, setIsFullSyncDialogOpen] = useState(false);

  const handleSelectBackend = useCallback(
    (backend: "supabase_form" | "gas_form"): void => {
      setPhase(backend);
      setErrorMessage("");
    },
    [],
  );

  const handleCancel = useCallback((): void => {
    setPhase("selection");
    setErrorMessage("");
    setIsLoading(false);
  }, []);

  const handleSupabaseConnect = useCallback(
    async (urlRaw: string, anonKey: string): Promise<void> => {
      const resolvedUrl = parseSupabaseInput(urlRaw);
      setIsLoading(true);
      setErrorMessage("");
      setPhase("supabase_connecting");

      try {
        const authMethods = await fetchSupabaseProviders(resolvedUrl, anonKey);

        connect({
          type: "supabase",
          url: resolvedUrl,
          anonKey,
        });

        createSupabaseClient(resolvedUrl, anonKey);
        setProviders(authMethods.oauthProviders);
        setIsEmailEnabled(authMethods.isEmailEnabled);
        setPhase("supabase_providers");
      } catch {
        setErrorMessage(t("settings.server.connectionError"));
        setPhase("supabase_form");
      } finally {
        setIsLoading(false);
      }
    },
    [t],
  );

  const handleGasConnect = useCallback(
    async (urlRaw: string, clientIdRaw: string): Promise<void> => {
      const resolvedUrl = parseGasInput(urlRaw);
      const normalizedClientId = parseClientId(clientIdRaw);
      setIsLoading(true);
      setErrorMessage("");
      setPhase("gas_connecting");

      try {
        const tempAdapter = createGasAdapter(resolvedUrl, getAccessToken);
        const response = await tempAdapter.ping();

        if (!response.ok) {
          setErrorMessage(t("settings.server.connectionError"));
          setPhase("gas_form");
          return;
        }

        connect({
          type: "gas",
          url: resolvedUrl,
          clientId: normalizedClientId,
        });

        setNeedsGasInit(!response.initialized);
        setPhase("gas_awaiting_signin");
      } catch {
        setErrorMessage(t("settings.server.connectionError"));
        setPhase("gas_form");
      } finally {
        setIsLoading(false);
      }
    },
    [t],
  );

  const handleCancelAuth = useCallback(
    (returnPhase: "supabase_form" | "gas_form"): void => {
      disconnect();
      setPhase(returnPhase);
      setErrorMessage("");
      setProviders([]);
      setNeedsGasInit(false);
    },
    [],
  );

  const handleOAuthSignIn = useCallback(
    async (provider: string): Promise<void> => {
      try {
        const client = getSupabaseClient();
        await client.auth.signInWithOAuth({
          provider: provider as "google" | "github" | "apple" | "azure",
          options: {
            redirectTo: `${window.location.origin}${import.meta.env.BASE_URL}${ROUTES.SETTINGS.slice(1)}`,
          },
        });
      } catch {
        setErrorMessage(t("settings.server.connectionError"));
      }
    },
    [t],
  );

  const handleSendOtpAndTransition = useCallback(
    async (email: string): Promise<void> => {
      await emailOtp.handleSendOtp(email);
      setPhase("supabase_email_otp");
    },
    [emailOtp],
  );

  const handleBackFromOtp = useCallback((): void => {
    emailOtp.resetOtpState();
    setPhase("supabase_providers");
  }, [emailOtp]);

  const handleDisconnect = useCallback((): void => {
    disconnect();
    setIsDisconnectDialogOpen(false);
    setPhase("selection");
    setErrorMessage("");
    setProviders([]);
  }, []);

  const renderPhaseContent = (): ReactNode => {
    switch (phase) {
      case "selection":
        return (
          <ServerBackendSelection
            onSelectSupabase={() => handleSelectBackend("supabase_form")}
            onSelectGas={() => handleSelectBackend("gas_form")}
          />
        );
      case "supabase_form":
      case "supabase_connecting":
        return (
          <ServerSupabaseForm
            onConnect={(url, anonKey) =>
              void handleSupabaseConnect(url, anonKey)
            }
            onCancel={handleCancel}
            isLoading={isLoading}
            error={errorMessage}
          />
        );
      case "gas_form":
      case "gas_connecting":
        return (
          <ServerGasForm
            onConnect={(url, clientId) => void handleGasConnect(url, clientId)}
            onCancel={handleCancel}
            isLoading={isLoading}
            error={errorMessage}
          />
        );
      case "supabase_providers":
        return (
          <ServerOAuthProviders
            providers={providers}
            onSignIn={(provider) => void handleOAuthSignIn(provider)}
            onCancel={() => handleCancelAuth("supabase_form")}
            isEmailEnabled={isEmailEnabled}
            onSendOtp={(email) => void handleSendOtpAndTransition(email)}
            emailLoading={emailOtp.emailLoading}
          />
        );
      case "supabase_email_otp":
        return (
          <ServerEmailVerify
            email={emailOtp.pendingEmail}
            onVerify={(code) => void emailOtp.handleVerifyOtp(code)}
            onResend={() => void emailOtp.handleResendOtp()}
            onBack={handleBackFromOtp}
            isVerifying={emailOtp.otpVerifying}
            error={emailOtp.otpError}
            resendCooldown={emailOtp.resendCooldown}
          />
        );
      case "gas_awaiting_signin":
        return (
          <ServerGasSignIn
            needsInit={needsGasInit}
            onInitComplete={() => setPhase("connected")}
            onInitError={setErrorMessage}
            onCancel={() => handleCancelAuth("gas_form")}
          />
        );
      case "connected":
        return config ? (
          <ServerConnectedStatus
            config={config}
            onFullSync={() => setIsFullSyncDialogOpen(true)}
            onDisconnect={() => setIsDisconnectDialogOpen(true)}
          />
        ) : null;
    }
  };

  return (
    <section data-testid="server-section" className="space-y-3">
      <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide">
        {t("settings.server.title")}
      </h2>

      <div className="rounded-lg border border-gray-100 bg-gray-50 px-4 py-4">
        {renderPhaseContent()}
      </div>

      {errorMessage && phase !== "supabase_form" && phase !== "gas_form" && (
        <div
          role="alert"
          aria-live="polite"
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {errorMessage}
        </div>
      )}

      <ConfirmFullSyncDialog
        isOpen={isFullSyncDialogOpen}
        onClose={() => setIsFullSyncDialogOpen(false)}
        onSync={triggerFullSync}
      />

      <ConfirmDisconnectDialog
        isOpen={isDisconnectDialogOpen}
        onClose={() => setIsDisconnectDialogOpen(false)}
        onConfirm={handleDisconnect}
      />
    </section>
  );
}

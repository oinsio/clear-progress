import { type ReactNode, useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSync } from "@/app/providers/SyncProvider";
import { ConfirmDisconnectDialog } from "@/components/settings/ConfirmDisconnectDialog";
import { ConfirmFullSyncDialog } from "@/components/settings/ConfirmFullSyncDialog";
import { ServerBackendSelection } from "@/components/settings/ServerBackendSelection";
import { ServerConnectedStatus } from "@/components/settings/ServerConnectedStatus";
import { ServerEmailVerify } from "@/components/settings/ServerEmailVerify";
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
import { parseSupabaseInput } from "@/utils/supabaseUrl";

type ServerPhase =
  | "selection"
  | "supabase_form"
  | "supabase_connecting"
  | "supabase_providers"
  | "supabase_email_otp"
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
  const [isDisconnectDialogOpen, setIsDisconnectDialogOpen] = useState(false);
  const [isFullSyncDialogOpen, setIsFullSyncDialogOpen] = useState(false);

  const handleSelectBackend = useCallback((): void => {
    setPhase("supabase_form");
    setErrorMessage("");
  }, []);

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

  const handleCancelAuth = useCallback((): void => {
    disconnect();
    setPhase("supabase_form");
    setErrorMessage("");
    setProviders([]);
  }, []);

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

  const handleVerifyOtpAndReload = useCallback(
    async (code: string): Promise<void> => {
      const isSuccess = await emailOtp.handleVerifyOtp(code);
      if (isSuccess) {
        // Full reload so module-level singletons (defaultSyncAdapter, syncService)
        // re-initialize with the now-available Supabase session — same as OAuth redirect flow.
        window.location.href = `${window.location.origin}${import.meta.env.BASE_URL}${ROUTES.TASKS.slice(1)}`;
      }
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
          <ServerBackendSelection onSelectSupabase={handleSelectBackend} />
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
      case "supabase_providers":
        return (
          <ServerOAuthProviders
            providers={providers}
            onSignIn={(provider) => void handleOAuthSignIn(provider)}
            onCancel={handleCancelAuth}
            isEmailEnabled={isEmailEnabled}
            onSendOtp={(email) => void handleSendOtpAndTransition(email)}
            emailLoading={emailOtp.emailLoading}
          />
        );
      case "supabase_email_otp":
        return (
          <ServerEmailVerify
            email={emailOtp.pendingEmail}
            onVerify={(code) => void handleVerifyOtpAndReload(code)}
            onResend={() => void emailOtp.handleResendOtp()}
            onBack={handleBackFromOtp}
            isVerifying={emailOtp.otpVerifying}
            error={emailOtp.otpError}
            resendCooldown={emailOtp.resendCooldown}
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

      {errorMessage && phase !== "supabase_form" && (
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

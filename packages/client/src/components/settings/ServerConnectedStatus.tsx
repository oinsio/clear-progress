import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/app/providers/AuthProvider";
import { ServerOAuthProviders } from "@/components/settings/ServerOAuthProviders";
import { ROUTES } from "@/constants";
import { useConnectionStatus } from "@/hooks/useConnectionStatus";
import {
  createSupabaseClient,
  getSupabaseClient,
} from "@/services/supabaseClientManager";
import { fetchSupabaseProviders } from "@/services/supabaseConnection";
import { cn } from "@/shared/lib/cn";
import type { ConnectionConfig } from "@/types/connection";
import { ProviderIcon } from "./ProviderIcon";

interface ServerConnectedStatusProps {
  config: ConnectionConfig;
  onFullSync: () => void;
  onDisconnect: () => void;
}

/**
 * Implements FR1, FR2, FR3, NFR-A2 of simplify-backend-connection.
 * Shows connection type, URL, Full Sync and Disconnect buttons.
 * For Supabase without session: shows OAuth re-auth.
 * For GAS without token: shows sign-in prompt.
 */
export function ServerConnectedStatus({
  config,
  onFullSync,
  onDisconnect,
}: ServerConnectedStatusProps) {
  const { t } = useTranslation();
  const connectionStatus = useConnectionStatus();
  const { accessToken, userEmail, authProvider, signIn } = useAuth();
  const [providers, setProviders] = useState<string[]>([]);

  const isSupabaseNeedsAuth =
    config.type === "supabase" &&
    (connectionStatus === "no_auth" || connectionStatus === "unauthorized");

  const isGasNeedsAuth =
    config.type === "gas" && config.clientId && !accessToken;

  useEffect(() => {
    if (!isSupabaseNeedsAuth || config.type !== "supabase") return;

    const loadProviders = async (): Promise<void> => {
      try {
        createSupabaseClient(config.url, config.anonKey);
        const loadedProviders = await fetchSupabaseProviders(
          config.url,
          config.anonKey,
        );
        setProviders(loadedProviders);
      } catch {
        setProviders([]);
      }
    };

    void loadProviders();
  }, [isSupabaseNeedsAuth, config]);

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
        // OAuth redirect will handle errors
      }
    },
    [],
  );

  const typeLabel =
    config.type === "supabase"
      ? t("settings.server.typeSupabase")
      : t("settings.server.typeGas");

  const displayUrl = config.url;

  return (
    <div className="space-y-3" aria-live="polite">
      <div className="rounded-lg border border-gray-200 px-4 py-3 space-y-2">
        <div className="flex items-center gap-2">
          <span
            data-testid="server-connected-type"
            className="text-sm font-medium text-gray-700"
          >
            {typeLabel}
          </span>
          <span
            className={cn(
              "size-2 rounded-full",
              connectionStatus === "synced" && "bg-green-500",
              connectionStatus === "syncing" && "bg-yellow-400 animate-pulse",
              connectionStatus === "error" && "bg-orange-500",
              (connectionStatus === "offline" ||
                connectionStatus === "unauthorized") &&
                "bg-red-500",
              (connectionStatus === "not_configured" ||
                connectionStatus === "no_auth") &&
                "bg-gray-300",
            )}
          />
        </div>
        <p
          data-testid="server-connected-url"
          className="text-xs text-gray-400 break-all"
        >
          {displayUrl}
        </p>
        {authProvider && config.type === "supabase" && (
          <p
            data-testid="server-connected-provider"
            className="text-xs text-gray-400 flex items-center gap-1"
          >
            {t("settings.server.oauthProvider")}:{" "}
            <ProviderIcon provider={authProvider} className="size-4" />
            {authProvider.charAt(0).toUpperCase() + authProvider.slice(1)}
          </p>
        )}
        {userEmail && (
          <p
            data-testid="server-connected-account"
            className="text-xs text-gray-400"
          >
            {t("settings.server.account")}: {userEmail}
          </p>
        )}
      </div>

      {isSupabaseNeedsAuth && (
        <div data-testid="server-signin-required" className="space-y-2">
          <p className="text-sm font-medium text-blue-900">
            {t("settings.server.signInRequired")}
          </p>
          <ServerOAuthProviders
            providers={providers}
            onSignIn={(provider) => void handleOAuthSignIn(provider)}
          />
        </div>
      )}

      {isGasNeedsAuth && (
        <div data-testid="server-signin-required" className="space-y-2">
          <p className="text-sm font-medium text-blue-900">
            {t("settings.server.signInRequired")}
          </p>
          <button
            data-testid="server-signin-button"
            onClick={signIn}
            className="w-full rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition-colors"
          >
            {t("settings.server.signInWithGoogle")}
          </button>
        </div>
      )}

      <button
        data-testid="server-full-sync"
        onClick={onFullSync}
        className="w-full rounded-lg bg-accent py-2 text-sm font-medium text-white transition-colors"
      >
        {t("settings.server.fullSync")}
      </button>
      <button
        data-testid="server-disconnect"
        onClick={onDisconnect}
        className="w-full rounded-lg border border-red-200 py-2 text-sm font-medium text-red-500 transition-colors hover:border-red-300 hover:bg-red-50"
      >
        {t("settings.server.disconnect")}
      </button>
    </div>
  );
}

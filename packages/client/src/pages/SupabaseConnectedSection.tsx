import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/app/providers/AuthProvider";
import { ROUTES } from "@/constants";
import { getSupabaseClient } from "@/services/supabaseClientManager";
import { fetchSupabaseProviders } from "@/services/supabaseConnection";
import type { SupabaseConnectionConfig } from "@/types/connection";

interface SupabaseConnectedSectionProps {
  config: SupabaseConnectionConfig;
  oauthError?: string;
  onDisconnect: () => void;
}

/**
 * Implements FR14 of add-supabase-ui.
 * Connected state display for Supabase backend.
 */
export function SupabaseConnectedSection({
  config,
  oauthError,
  onDisconnect,
}: SupabaseConnectedSectionProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { accessToken } = useAuth();
  const [providers, setProviders] = useState<string[]>([]);

  useEffect(() => {
    if (!accessToken) {
      void fetchSupabaseProviders(config.url, config.anonKey).then(
        setProviders,
      );
    }
  }, [accessToken, config.url, config.anonKey]);

  const handleOAuthSignIn = async (provider: string): Promise<void> => {
    const client = getSupabaseClient();
    await client.auth.signInWithOAuth({
      provider: provider as "google" | "github" | "apple" | "azure",
      options: {
        redirectTo: `${window.location.origin}${import.meta.env.BASE_URL}setup`,
      },
    });
  };

  return (
    <>
      {/* Project URL section */}
      <section className="space-y-3">
        <h2 className="text-sm font-medium uppercase tracking-wide text-gray-500">
          {t("setup.connectedUrl")}
        </h2>
        <div
          data-testid="setup-current-url"
          className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3"
        >
          <p className="break-all font-mono text-sm text-gray-800">
            {config.url}
          </p>
        </div>
      </section>

      {/* OAuth error */}
      {oauthError && (
        <div
          data-testid="setup-supabase-error"
          role="alert"
          aria-live="assertive"
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {oauthError}
        </div>
      )}

      {/* OAuth re-auth buttons when session expired or error */}
      {!accessToken && providers.length > 0 && (
        <section className="space-y-3">
          <div
            data-testid="setup-supabase-oauth-buttons"
            className="flex flex-wrap gap-2"
          >
            {providers.map((provider) => {
              const capitalizedProvider =
                provider.charAt(0).toUpperCase() + provider.slice(1);
              return (
                <button
                  key={provider}
                  data-testid={`setup-supabase-oauth-${provider}`}
                  onClick={() => void handleOAuthSignIn(provider)}
                  className="flex-1 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:border-gray-300"
                >
                  {`${t("setup.supabase.signInWith")} ${capitalizedProvider}`}
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* Actions section */}
      <section className="flex gap-2">
        <button
          data-testid="setup-disconnect-button"
          onClick={onDisconnect}
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
  );
}

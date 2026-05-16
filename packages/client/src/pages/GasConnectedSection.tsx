import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/app/providers/AuthProvider";
import { ROUTES } from "@/constants";
import type { GasConnectionConfig } from "@/types/connection";

interface GasConnectedSectionProps {
  config: GasConnectionConfig;
  onDisconnect: () => void;
}

/**
 * Implements D7 of add-supabase-ui.
 * Connected state display for GAS backend.
 */
export function GasConnectedSection({
  config,
  onDisconnect,
}: GasConnectedSectionProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { accessToken, signIn } = useAuth();

  return (
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
            {config.url}
          </p>
        </div>
      </section>

      {/* Google Client ID section */}
      {config.clientId && (
        <section className="space-y-3">
          <h2 className="text-sm font-medium uppercase tracking-wide text-gray-500">
            {t("setup.clientIdLabel")}
          </h2>
          <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
            <p className="break-all font-mono text-sm text-gray-800">
              {config.clientId}
            </p>
          </div>
        </section>
      )}

      {/* Sign-in prompt when connected but not authenticated */}
      {config.clientId && !accessToken && (
        <section className="space-y-3">
          <div
            data-testid="setup-sign-in-required"
            className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 space-y-2"
          >
            <p className="text-sm text-blue-800">{t("auth.signInRequired")}</p>
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

import { type FormEvent, useState } from "react";
import { useTranslation } from "react-i18next";
import { ProviderIcon } from "./ProviderIcon";

const EMAIL_INPUT_ID = "server-email-input-field";
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

interface ServerOAuthProvidersProps {
  providers: string[];
  onSignIn: (provider: string) => void;
  onCancel?: () => void;
  /** Implements FR1, D2 of supabase-email-auth */
  isEmailEnabled?: boolean;
  onSendOtp?: (email: string) => void;
  emailLoading?: boolean;
}

/**
 * Implements FR2, FR16, NFR-A2 of simplify-backend-connection.
 * Implements FR1, FR11, NFR-A1 of supabase-email-auth.
 * List of OAuth provider buttons with optional email OTP form.
 * Cancel button disconnects and returns to connection form.
 */
export function ServerOAuthProviders({
  providers,
  onSignIn,
  onCancel,
  isEmailEnabled = false,
  onSendOtp,
  emailLoading = false,
}: ServerOAuthProvidersProps) {
  const { t } = useTranslation();
  const [emailValue, setEmailValue] = useState("");

  const isValidEmail = EMAIL_PATTERN.test(emailValue);
  const hasProviders = providers.length > 0;
  const showNoProviders = !hasProviders && !isEmailEnabled;

  const handleEmailSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (isValidEmail && onSendOtp) {
      onSendOtp(emailValue);
    }
  };

  return (
    <div className="space-y-3">
      {showNoProviders && (
        <div
          data-testid="server-no-providers"
          role="status"
          aria-live="polite"
          className="rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-800"
        >
          {t("settings.server.noProviders")}
        </div>
      )}

      {hasProviders && (
        <>
          <p data-testid="server-oauth-hint" className="text-sm text-gray-500">
            {t("settings.server.chooseAuthMethod")}
          </p>
          <div
            data-testid="server-oauth-buttons"
            aria-live="polite"
            className="flex flex-wrap gap-2"
          >
            {providers.map((provider) => {
              const capitalizedProvider =
                provider.charAt(0).toUpperCase() + provider.slice(1);
              return (
                <button
                  key={provider}
                  data-testid={`server-oauth-${provider}`}
                  onClick={() => onSignIn(provider)}
                  className="flex-1 items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:border-gray-300 inline-flex justify-center"
                >
                  <ProviderIcon provider={provider} className="h-4 w-4" />
                  {capitalizedProvider}
                </button>
              );
            })}
          </div>
        </>
      )}

      {isEmailEnabled && hasProviders && (
        <div
          data-testid="server-email-divider"
          className="flex items-center gap-3 text-sm text-gray-400"
        >
          <div className="h-px flex-1 bg-gray-200" />
          {t("settings.server.emailOrDivider")}
          <div className="h-px flex-1 bg-gray-200" />
        </div>
      )}

      {isEmailEnabled && (
        <form onSubmit={handleEmailSubmit} className="space-y-2">
          <label
            htmlFor={EMAIL_INPUT_ID}
            className="text-sm font-medium text-gray-700"
          >
            {t("settings.server.emailLabel")}
          </label>
          <input
            id={EMAIL_INPUT_ID}
            data-testid="server-email-input"
            type="email"
            value={emailValue}
            onChange={(e) => setEmailValue(e.target.value)}
            className="w-full rounded-lg border border-gray-200 px-4 py-2 text-sm transition-colors focus:border-gray-400 focus:outline-none"
          />
          <button
            data-testid="server-email-send"
            type="submit"
            disabled={!isValidEmail || emailLoading}
            className="w-full rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {t("settings.server.sendCode")}
          </button>
        </form>
      )}

      {onCancel && (
        <button
          data-testid="server-oauth-cancel"
          onClick={onCancel}
          className="w-full rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-500 transition-colors hover:border-gray-300"
        >
          {t("common.cancel")}
        </button>
      )}
    </div>
  );
}

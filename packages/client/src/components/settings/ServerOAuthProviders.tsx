import { useTranslation } from "react-i18next";

interface ServerOAuthProvidersProps {
  providers: string[];
  onSignIn: (provider: string) => void;
  onCancel?: () => void;
}

/**
 * Implements FR2, FR16, NFR-A2 of simplify-backend-connection.
 * List of OAuth provider buttons. Shows no-providers message when empty.
 * Cancel button disconnects and returns to connection form.
 */
export function ServerOAuthProviders({
  providers,
  onSignIn,
  onCancel,
}: ServerOAuthProvidersProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-3">
      {providers.length === 0 ? (
        <div
          data-testid="server-no-providers"
          role="status"
          aria-live="polite"
          className="rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-800"
        >
          {t("settings.server.noProviders")}
        </div>
      ) : (
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
                  className="flex-1 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:border-gray-300"
                >
                  {capitalizedProvider}
                </button>
              );
            })}
          </div>
        </>
      )}

      {onCancel && (
        <button
          data-testid="server-oauth-cancel"
          onClick={onCancel}
          className="w-full rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-500 transition-colors hover:border-gray-300"
        >
          {t("settings.server.cancel")}
        </button>
      )}
    </div>
  );
}

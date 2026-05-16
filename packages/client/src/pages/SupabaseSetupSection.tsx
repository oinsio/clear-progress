import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  connect,
  getSavedConnectionConfig,
} from "@/services/connectionService";
import {
  createSupabaseClient,
  getSupabaseClient,
} from "@/services/supabaseClientManager";
import { fetchSupabaseProviders } from "@/services/supabaseConnection";
import { cn } from "@/shared/lib/cn";
import { parseSupabaseInput } from "@/utils/supabaseUrl";

type SupabasePhase =
  | "input"
  | "connecting"
  | "providers_loaded"
  | "no_providers"
  | "error";

interface SupabaseSetupSectionProps {
  isOpen: boolean;
  onToggle: () => void;
  onProvidersLoaded?: (providers: string[]) => void;
}

/**
 * Implements FR1, FR2, UX2, UX3 of add-supabase-ui.
 * Supabase backend connection section on SetupPage.
 */
export function SupabaseSetupSection({
  isOpen,
  onToggle,
}: SupabaseSetupSectionProps) {
  const { t } = useTranslation();

  const savedConfig = getSavedConnectionConfig();
  const savedUrl = savedConfig?.type === "supabase" ? savedConfig.url : "";
  const savedAnonKey =
    savedConfig?.type === "supabase" ? savedConfig.anonKey : "";

  const [urlInput, setUrlInput] = useState(savedUrl);
  const [anonKeyInput, setAnonKeyInput] = useState(savedAnonKey);
  const [phase, setPhase] = useState<SupabasePhase>("input");
  const [providers, setProviders] = useState<string[]>([]);
  const [errorMessage, setErrorMessage] = useState("");

  const isLoading = phase === "connecting";
  const isConnectDisabled =
    !urlInput.trim() || !anonKeyInput.trim() || isLoading;

  const handleConnect = async (): Promise<void> => {
    const resolvedUrl = parseSupabaseInput(urlInput);
    const anonKey = anonKeyInput.trim();

    setPhase("connecting");
    setErrorMessage("");

    try {
      const loadedProviders = await fetchSupabaseProviders(
        resolvedUrl,
        anonKey,
      );

      connect({
        type: "supabase",
        url: resolvedUrl,
        anonKey,
        isActive: true,
      });

      createSupabaseClient(resolvedUrl, anonKey);

      if (loadedProviders.length === 0) {
        setProviders([]);
        setPhase("no_providers");
      } else {
        setProviders(loadedProviders);
        setPhase("providers_loaded");
      }
    } catch {
      setPhase("error");
      setErrorMessage(t("setup.supabase.errorConnection"));
    }
  };

  const handleOAuthSignIn = async (provider: string): Promise<void> => {
    try {
      const client = getSupabaseClient();
      await client.auth.signInWithOAuth({
        provider: provider as "google" | "github" | "apple" | "azure",
        options: { redirectTo: "/setup" },
      });
    } catch {
      setPhase("error");
      setErrorMessage(t("setup.supabase.errorOAuth"));
    }
  };

  return (
    <section className="space-y-3">
      <button
        data-testid="setup-supabase-section-toggle"
        onClick={onToggle}
        className="flex w-full items-center justify-between rounded-lg border border-gray-200 px-4 py-3 text-sm font-medium text-gray-700 transition-colors hover:border-gray-300"
      >
        <span>{t("setup.supabase.section")}</span>
        <span className="text-gray-400">{isOpen ? "▲" : "▼"}</span>
      </button>

      {isOpen && (
        <div className="space-y-4 rounded-lg border border-gray-100 bg-gray-50 px-4 py-4">
          {/* URL input */}
          {(phase === "input" || phase === "error") && (
            <>
              <div className="space-y-2">
                <label
                  htmlFor="supabase-url-input"
                  className="text-sm font-medium uppercase tracking-wide text-gray-500"
                >
                  {t("setup.supabase.urlLabel")}
                </label>
                <input
                  id="supabase-url-input"
                  data-testid="setup-supabase-url-input"
                  type="text"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder={t("setup.supabase.urlPlaceholder")}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none transition-colors focus:border-accent"
                />
              </div>

              {/* Anon Key input */}
              <div className="space-y-2">
                <label
                  htmlFor="supabase-anon-key-input"
                  className="text-sm font-medium uppercase tracking-wide text-gray-500"
                >
                  {t("setup.supabase.anonKeyLabel")}
                </label>
                <input
                  id="supabase-anon-key-input"
                  data-testid="setup-supabase-anon-key-input"
                  type="password"
                  value={anonKeyInput}
                  onChange={(e) => setAnonKeyInput(e.target.value)}
                  placeholder={t("setup.supabase.anonKeyPlaceholder")}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 font-mono text-sm outline-none transition-colors focus:border-accent"
                />
              </div>
            </>
          )}

          {/* Loading state */}
          {isLoading && (
            <div
              data-testid="setup-supabase-loading"
              role="status"
              aria-live="polite"
              className="flex items-center gap-2 text-sm text-gray-500"
            >
              <span className="inline-block animate-spin">⟳</span>
              {t("setup.supabase.connecting")}
            </div>
          )}

          {/* Error state */}
          {phase === "error" && (
            <div
              data-testid="setup-supabase-error"
              role="alert"
              aria-live="assertive"
              className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            >
              {errorMessage}
            </div>
          )}

          {/* No providers message */}
          {phase === "no_providers" && (
            <div
              data-testid="setup-supabase-no-providers"
              role="status"
              aria-live="polite"
              className="rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-800"
            >
              {t("setup.supabase.noProviders")}
            </div>
          )}

          {/* OAuth provider buttons */}
          {phase === "providers_loaded" && providers.length > 0 && (
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
          )}

          {/* Connect button */}
          {(phase === "input" || phase === "error") && (
            <button
              data-testid="setup-supabase-connect-button"
              onClick={handleConnect}
              disabled={isConnectDisabled}
              className={cn(
                "w-full rounded-lg px-4 py-2 text-sm font-medium transition-colors",
                !isConnectDisabled
                  ? "bg-accent text-white"
                  : "cursor-not-allowed bg-gray-100 text-gray-400",
              )}
            >
              {t("setup.supabase.connect")}
            </button>
          )}
        </div>
      )}
    </section>
  );
}

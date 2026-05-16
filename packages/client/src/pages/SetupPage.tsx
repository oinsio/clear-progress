import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/app/providers/AuthProvider";
import { ROUTES } from "@/constants";
import { disconnect, getConnectionConfig } from "@/services/connectionService";
import { GasConnectedSection } from "./GasConnectedSection";
import { GasSetupSection } from "./GasSetupSection";
import { SupabaseConnectedSection } from "./SupabaseConnectedSection";
import { SupabaseSetupSection } from "./SupabaseSetupSection";

export default function SetupPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const { accessToken } = useAuth();
  const location = useLocation();
  const config = getConnectionConfig();

  const [isConnected, setIsConnected] = useState(config !== null);
  const [isGasSectionOpen, setIsGasSectionOpen] = useState(true);
  const [isSupabaseSectionOpen, setIsSupabaseSectionOpen] = useState(false);
  const [supabaseOAuthError, setSupabaseOAuthError] = useState("");
  const prevAccessTokenRef = useRef<string | null>(accessToken);

  // Detect OAuth callback params (?code= or ?error=)
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const code = searchParams.get("code");
    const error = searchParams.get("error");
    const errorDescription = searchParams.get("error_description");

    if (code && config?.type === "supabase") {
      // SDK handles code exchange. If token already present, navigate immediately.
      if (accessToken) {
        navigate(ROUTES.INBOX);
      }
      // Otherwise wait for accessToken via onAuthStateChange → token effect above
    } else if (error && config?.type === "supabase") {
      setSupabaseOAuthError(errorDescription ?? error);
    }
  }, [location.search, config, accessToken, navigate]);

  // After sign-in succeeds in connected phase: navigate to inbox.
  useEffect(() => {
    const previousToken = prevAccessTokenRef.current;
    prevAccessTokenRef.current = accessToken;
    if (previousToken === null && accessToken !== null && isConnected) {
      navigate(ROUTES.INBOX);
    }
  }, [accessToken, isConnected, navigate]);

  const handleDisconnect = (): void => {
    disconnect();
    setIsConnected(false);
  };

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
                {config?.type === "gas" && (
                  <GasConnectedSection
                    config={config}
                    onDisconnect={handleDisconnect}
                  />
                )}
                {config?.type === "supabase" && (
                  <SupabaseConnectedSection
                    config={config}
                    oauthError={supabaseOAuthError}
                    onDisconnect={handleDisconnect}
                  />
                )}
              </>
            ) : (
              <>
                <GasSetupSection
                  isOpen={isGasSectionOpen}
                  onToggle={() => setIsGasSectionOpen((prev) => !prev)}
                />
                <SupabaseSetupSection
                  isOpen={isSupabaseSectionOpen}
                  onToggle={() => setIsSupabaseSectionOpen((prev) => !prev)}
                />
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

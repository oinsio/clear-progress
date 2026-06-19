import { Clipboard, Cloud, Link, Monitor, Palette } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/app/providers/AuthProvider";
import { AccountSyncSection } from "@/components/settings/AccountSyncSection";
import { LookAndFeelSection } from "@/components/settings/LookAndFeelSection";
import {
  SettingsAccordion,
  type SettingsAccordionSection,
} from "@/components/settings/SettingsAccordion";
import { ShareAppSection } from "@/components/settings/ShareAppSection";
import { TasksSection } from "@/components/settings/TasksSection";
import { WorkspaceSection } from "@/components/settings/WorkspaceSection";
import { Sidebar } from "@/components/tasks/Sidebar";
import { ROUTES, SETTINGS_SECTION_IDS } from "@/constants";
import { useConnectionConfig } from "@/hooks/useConnectionConfig";
import { usePanelOpen } from "@/hooks/usePanelOpen";
import { usePanelSide } from "@/hooks/usePanelSide";
import { useSidebarNavigation } from "@/hooks/useSidebarNavigation";
import {
  clearOauthReturnFlag,
  isOauthReturn,
} from "@/services/supabaseClientManager";

/**
 * Implements FR1, FR6, FR7, FR9 of settings-page-reordering.
 * Implements FR14 of simplify-backend-connection.
 * Handles OAuth callback query params (?code=, ?error=) after redirect.
 */
export default function SettingsPage() {
  const { t } = useTranslation();
  const { isPanelOpen, togglePanelOpen } = usePanelOpen();

  const navigate = useNavigate();
  const location = useLocation();
  const { accessToken } = useAuth();
  const connectionConfig = useConnectionConfig();
  const [oauthError, setOauthError] = useState("");
  // Track whether we're in an OAuth callback flow (PKCE ?code= param)
  const isPkceCallbackRef = useRef(false);

  // Detect OAuth callback params (?code= or ?error=) — implements FR14 of simplify-backend-connection
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const code = searchParams.get("code");
    const error = searchParams.get("error");
    const errorDescription = searchParams.get("error_description");

    if (code || error) {
      // Clean query params from URL
      window.history.replaceState({}, "", location.pathname);
    }

    if (code && connectionConfig?.type === "supabase") {
      // SDK handles code exchange via onAuthStateChange.
      // If token already present, navigate immediately.
      if (accessToken) {
        navigate(ROUTES.TASKS);
      } else {
        isPkceCallbackRef.current = true;
      }
    } else if (error && connectionConfig?.type === "supabase") {
      setOauthError(errorDescription ?? error);
    }
  }, [
    location.search,
    connectionConfig,
    accessToken,
    navigate,
    location.pathname,
  ]);

  // After OAuth sign-in succeeds: navigate to inbox
  // Triggers for both implicit flow (isOauthReturn from sessionStorage) and PKCE flow (?code= ref)
  useEffect(() => {
    if (
      (isPkceCallbackRef.current || isOauthReturn()) &&
      accessToken !== null
    ) {
      isPkceCallbackRef.current = false;
      clearOauthReturnFlag();
      navigate(ROUTES.TASKS);
    }
  }, [accessToken, navigate]);

  const { panelSide } = usePanelSide();
  const handlePanelToggle = togglePanelOpen;
  const handleModeChange = useSidebarNavigation();

  const sections: SettingsAccordionSection[] = [
    {
      id: SETTINGS_SECTION_IDS.LOOK_AND_FEEL,
      titleKey: "settings.sections.lookAndFeel",
      icon: <Palette className="h-5 w-5" />,
      children: <LookAndFeelSection />,
    },
    {
      id: SETTINGS_SECTION_IDS.WORKSPACE,
      titleKey: "settings.sections.workspace",
      icon: <Monitor className="h-5 w-5" />,
      children: <WorkspaceSection />,
    },
    {
      id: SETTINGS_SECTION_IDS.TASKS,
      titleKey: "settings.sections.tasks",
      icon: <Clipboard className="h-5 w-5" />,
      children: <TasksSection />,
    },
    {
      id: SETTINGS_SECTION_IDS.ACCOUNT_SYNC,
      titleKey: "settings.sections.accountSync",
      icon: <Link className="h-5 w-5" />,
      children: <AccountSyncSection oauthError={oauthError} />,
    },
  ];

  return (
    <div
      data-testid="settings-page"
      className="relative flex flex-1 overflow-hidden bg-white"
    >
      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-lg mx-auto px-4 py-6 space-y-8">
            <h1 className="text-xl font-semibold text-gray-900">
              {t("settings.name")}
            </h1>

            <SettingsAccordion sections={sections} />

            {/* Share app section — implements FR1 of share-with-friend */}
            <ShareAppSection />

            {/* Sync legend — implements FR9 of settings-page-reordering */}
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <Cloud className="h-4 w-4" />
              <span>{t("settings.syncLegend")}</span>
            </div>
          </div>
        </main>
      </div>

      {/* Right panel — same as on main page */}
      <Sidebar
        mode={null}
        isOpen={isPanelOpen}
        side={panelSide}
        onToggle={handlePanelToggle}
        onModeChange={handleModeChange}
      />
    </div>
  );
}

import { CircleUser, RefreshCw } from "lucide-react";
import type * as React from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/app/providers/AuthProvider";
import { useSync } from "@/app/providers/SyncProvider";
import { ROUTES } from "@/constants";
import { useConnectionStatus } from "@/hooks/useConnectionStatus";
import { cn } from "@/shared/lib/cn";
import type { PanelSide } from "@/types/common";

interface SidebarSyncBlockProps {
  isExpanded: boolean;
  side: PanelSide;
}

/**
 * Sync/auth/login button area for the sidebar.
 * Renders expanded (with text labels + account avatar) or collapsed (icon-only) variant.
 *
 * Implements FR3 of rename-right-panel-to-sidebar.
 */
export function SidebarSyncBlock({ isExpanded, side }: SidebarSyncBlockProps) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { pull } = useSync();
  const { userPicture, signIn } = useAuth();
  const connectionStatus = useConnectionStatus();

  const isSyncing = connectionStatus === "syncing";
  const isOffline = connectionStatus === "offline";
  const hasServerError = connectionStatus === "error";
  const hasSyncError = isOffline || hasServerError;
  const needsSignIn =
    connectionStatus === "unauthorized" || connectionStatus === "no_auth";
  const isConfigured = connectionStatus !== "not_configured";
  const isLeft = side === "left";

  const handleSyncClick = (event: React.MouseEvent): void => {
    event.stopPropagation();
    void pull();
  };
  const navigateToSettings = (event: React.MouseEvent): void => {
    event.stopPropagation();
    navigate(ROUTES.SETTINGS);
  };
  const handleSignIn = (event: React.MouseEvent): void => {
    event.stopPropagation();
    signIn();
  };

  const syncLabel = isSyncing
    ? t("sync.syncing")
    : isOffline
      ? t("sync.noConnection")
      : hasServerError
        ? t("sync.serverError")
        : t("sync.synced");

  if (!isExpanded) {
    return renderCollapsedButton({
      needsSignIn,
      isConfigured,
      isSyncing,
      hasSyncError,
      userPicture,
      onSyncClick: handleSyncClick,
      onSignIn: handleSignIn,
      onSettings: navigateToSettings,
      t,
    });
  }

  const accountButton = renderAccountButton(userPicture, navigateToSettings, t);

  const syncLoginButton = renderSyncLoginButton({
    needsSignIn,
    isConfigured,
    isLeft,
    isSyncing,
    hasSyncError,
    syncLabel,
    onSyncClick: handleSyncClick,
    onSignIn: handleSignIn,
    onSettings: navigateToSettings,
    t,
  });

  return (
    <div className="flex items-center justify-between border-b border-white/20">
      {isLeft ? (
        <>
          {accountButton}
          {syncLoginButton}
        </>
      ) : (
        <>
          {syncLoginButton}
          {accountButton}
        </>
      )}
    </div>
  );
}

function renderAccountButton(
  userPicture: string | null,
  onSettings: (event: React.MouseEvent) => void,
  t: (key: string) => string,
): React.JSX.Element {
  return (
    <button
      type="button"
      aria-label={t("settings.settingsAriaLabel")}
      data-testid="sidebar-account"
      onClick={onSettings}
      className="flex-shrink-0 flex items-center justify-center px-4 py-4 text-white hover:bg-black/15 transition-colors"
    >
      <UserAvatar picture={userPicture} size="w-8 h-8" />
    </button>
  );
}

function UserAvatar({
  picture,
  size,
}: {
  picture: string | null;
  size: string;
}) {
  const { t } = useTranslation();
  if (picture) {
    return (
      <img
        src={picture}
        alt={t("settings.avatarAlt")}
        className={cn(size, "rounded-full object-cover")}
        referrerPolicy="no-referrer"
      />
    );
  }
  return <CircleUser className={size} aria-hidden="true" />;
}

const COLLAPSED_BUTTON_CLASS =
  "w-10 h-10 flex items-center justify-center mt-3 mb-1 rounded-xl text-white/80 hover:bg-white/10 hover:text-white transition-colors";

interface SyncActionParams {
  needsSignIn: boolean;
  isConfigured: boolean;
  isSyncing: boolean;
  hasSyncError: boolean;
  onSyncClick: (event: React.MouseEvent) => void;
  onSignIn: (event: React.MouseEvent) => void;
  onSettings: (event: React.MouseEvent) => void;
  t: (key: string) => string;
}

function renderCollapsedButton(
  params: SyncActionParams & { userPicture: string | null },
): React.JSX.Element {
  const {
    needsSignIn,
    isConfigured,
    isSyncing,
    hasSyncError,
    userPicture,
    onSyncClick,
    onSignIn,
    onSettings,
    t,
  } = params;

  if (needsSignIn) {
    return (
      <button
        type="button"
        aria-label={t("auth.signInButton")}
        data-testid="sidebar-sign-in"
        onClick={onSignIn}
        className={COLLAPSED_BUTTON_CLASS}
      >
        <CircleUser className="w-6 h-6" aria-hidden="true" />
      </button>
    );
  }
  if (isConfigured) {
    return (
      <button
        type="button"
        aria-label={t("sync.ariaLabel")}
        data-testid="sidebar-sync"
        onClick={onSyncClick}
        className={cn("relative", COLLAPSED_BUTTON_CLASS)}
      >
        <RefreshCw
          className={cn("w-6 h-6", isSyncing && "animate-spin")}
          aria-hidden="true"
        />
        {hasSyncError && (
          <span className="absolute top-3.5 right-3.5 w-3 h-3 bg-red-500 rounded-full flex items-center justify-center">
            <span className="text-white text-[14px] font-bold leading-none">
              !
            </span>
          </span>
        )}
      </button>
    );
  }
  return (
    <button
      type="button"
      aria-label={t("settings.settingsAriaLabel")}
      data-testid="sidebar-account"
      onClick={onSettings}
      className={COLLAPSED_BUTTON_CLASS}
    >
      <UserAvatar picture={userPicture} size="w-6 h-6" />
    </button>
  );
}

function renderSyncLoginButton(
  params: SyncActionParams & { isLeft: boolean; syncLabel: string },
): React.JSX.Element {
  const {
    needsSignIn,
    isConfigured,
    isLeft,
    isSyncing,
    hasSyncError,
    syncLabel,
    onSyncClick,
    onSignIn,
    onSettings,
    t,
  } = params;

  if (needsSignIn) {
    return (
      <button
        type="button"
        aria-label={t("auth.signInButton")}
        data-testid="sidebar-sign-in"
        onClick={onSignIn}
        className="flex-1 flex items-center px-4 py-4 text-white hover:bg-black/15 transition-colors"
      >
        <span className="text-base font-medium">{t("auth.signInButton")}</span>
      </button>
    );
  }
  if (isConfigured) {
    return (
      <button
        type="button"
        aria-label={t("sync.ariaLabel")}
        data-testid="sidebar-sync"
        onClick={onSyncClick}
        className={cn(
          "flex-1 min-w-0 flex items-center gap-2 px-4 py-4 text-white hover:bg-black/15 transition-colors",
          isLeft && "flex-row-reverse",
        )}
      >
        <div className="relative flex-shrink-0">
          <RefreshCw
            className={cn("w-5 h-5", isSyncing && "animate-spin")}
            aria-hidden="true"
          />
          {hasSyncError && (
            <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-red-500 rounded-full flex items-center justify-center">
              <span className="text-white text-[14px] font-bold leading-none">
                !
              </span>
            </span>
          )}
        </div>
        <span className="text-sm font-medium break-words">{syncLabel}</span>
      </button>
    );
  }
  return (
    <button
      type="button"
      aria-label={t("settings.loginAriaLabel")}
      data-testid="sidebar-login"
      onClick={onSettings}
      className="flex-1 flex items-center px-4 py-4 text-white hover:bg-black/15 transition-colors"
    >
      <span className="text-base font-medium">{t("settings.login")}</span>
    </button>
  );
}

import { Cloud } from "lucide-react";
import { useTranslation } from "react-i18next";
import { SYNCED_SETTING_KEYS } from "@/constants";

interface SyncIndicatorProps {
  settingKey: string;
}

/** Implements FR8, NFR-A2 of settings-page-reordering */
export function SyncIndicator({ settingKey }: SyncIndicatorProps) {
  const { t } = useTranslation();

  if (!SYNCED_SETTING_KEYS.has(settingKey)) {
    return null;
  }

  return (
    <Cloud
      className="h-4 w-4 text-gray-400"
      aria-label={t("settings.syncIndicator")}
      data-testid="sync-indicator"
    />
  );
}

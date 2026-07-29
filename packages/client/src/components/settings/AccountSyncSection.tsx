import { ServerSection } from "@/components/settings/ServerSection";
import { SyncTimingSection } from "@/components/settings/SyncTimingSection";
import { useSettings } from "@/hooks/useSettings";

interface AccountSyncSectionProps {
  oauthError: string;
}

/** Implements FR5 of settings-page-reordering, FR8 of configurable-sync-timing */
export function AccountSyncSection({ oauthError }: AccountSyncSectionProps) {
  const { syncInterval, autoSyncDelay, setSyncInterval, setAutoSyncDelay } =
    useSettings();

  return (
    <div className="space-y-6">
      <SyncTimingSection
        syncInterval={syncInterval}
        autoSyncDelay={autoSyncDelay}
        onSyncIntervalChange={setSyncInterval}
        onAutoSyncDelayChange={setAutoSyncDelay}
      />

      <hr className="border-gray-200" />

      <ServerSection oauthError={oauthError} />
    </div>
  );
}

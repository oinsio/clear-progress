// The manual "full sync" command for SyncProvider: re-uploads local files,
// force-pushes, resets-and-pulls, and re-downloads server files, reporting each
// step through onProgress. Extracted from SyncProvider.tsx (task 6.3a of
// configurable-sync-timing) to keep that file under the file-size limit.
import type { Dispatch, SetStateAction } from "react";
import { useCallback } from "react";
import { defaultFileSyncService } from "@/services/defaultServices";
import {
  mapSyncServiceAlerts,
  persistLastSync,
  syncService,
} from "@/services/syncProviderService";
import type { AppAlert } from "@/types/alerts";
import type { FullSyncStep, SyncStatus } from "@/types/common";
import { toISOTimestamp } from "@/utils/dateHelpers";

interface UseFullSyncParams {
  // Mutex shared with the regular sync flow — prevents overlapping runs.
  isSyncingRef: { current: boolean };
  stopPingInterval: () => void;
  addAlertsRef: { current: (alerts: AppAlert[]) => void };
  setSyncStatus: Dispatch<SetStateAction<SyncStatus>>;
  setSyncVersion: Dispatch<SetStateAction<number>>;
  setLastSyncedAt: Dispatch<SetStateAction<string | null>>;
}

export function useFullSync({
  isSyncingRef,
  stopPingInterval,
  addAlertsRef,
  setSyncStatus,
  setSyncVersion,
  setLastSyncedAt,
}: UseFullSyncParams): (
  onProgress: (step: FullSyncStep) => void,
) => Promise<void> {
  return useCallback(
    async (onProgress: (step: FullSyncStep) => void): Promise<void> => {
      // Mutex: don't start full sync if a regular sync is running
      if (isSyncingRef.current) return;
      if (!navigator.onLine) {
        setSyncStatus("offline");
        onProgress("error");
        return;
      }
      isSyncingRef.current = true;
      setSyncStatus("syncing");
      try {
        onProgress("reupload_files");
        await defaultFileSyncService.reuploadLocalFiles();

        onProgress("upload_files");
        await defaultFileSyncService.sync();

        onProgress("push");
        await syncService.push(true);
        // implements FR7, FR8 of fix-push-poison-pill
        const syncAlerts = mapSyncServiceAlerts();
        if (syncAlerts.length > 0) {
          addAlertsRef.current(syncAlerts);
        }

        onProgress("pull");
        await syncService.resetAndPull();

        onProgress("download_files");
        await defaultFileSyncService.ensureServerFilesAreCached();

        const syncTimestamp = toISOTimestamp();
        persistLastSync(syncTimestamp);
        setLastSyncedAt(syncTimestamp);
        setSyncVersion((version) => version + 1);
        setSyncStatus("idle");
        stopPingInterval();
        onProgress("done");
      } catch {
        setSyncStatus("error");
        onProgress("error");
      } finally {
        isSyncingRef.current = false;
      }
    },
    [
      isSyncingRef,
      stopPingInterval,
      addAlertsRef,
      setSyncStatus,
      setSyncVersion,
      setLastSyncedAt,
    ],
  );
}

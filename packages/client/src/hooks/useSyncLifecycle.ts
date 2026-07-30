// Mount/unmount wiring for SyncProvider: initializes local files once, then —
// while authenticated and configured — runs an initial file sync + entity sync
// and registers window online/offline listeners, tearing everything down on
// cleanup. Extracted from SyncProvider.tsx (task 6.3a of configurable-sync-
// timing) to keep that file under the file-size limit.
import type { Dispatch, SetStateAction } from "react";
import { useEffect } from "react";
import { defaultFileSyncService } from "@/services/defaultServices";
import type { SyncStatus } from "@/types/common";
import type { ConnectionConfig } from "@/types/connection";

interface UseSyncLifecycleParams {
  accessToken: string | null;
  config: ConnectionConfig | null;
  ensureInitializedAndSync: () => Promise<void>;
  performPing: () => Promise<void>;
  stopPingInterval: () => void;
  setSyncStatus: Dispatch<SetStateAction<SyncStatus>>;
  // Cleared on unmount so a pending debounced push can't fire after teardown.
  debounceTimerRef: { current: ReturnType<typeof setTimeout> | null };
}

export function useSyncLifecycle({
  accessToken,
  config,
  ensureInitializedAndSync,
  performPing,
  stopPingInterval,
  setSyncStatus,
  debounceTimerRef,
}: UseSyncLifecycleParams): void {
  useEffect(() => {
    defaultFileSyncService
      .initializeLocalFiles()
      .catch((coverInitError) =>
        console.error(
          "[SyncProvider] initializeLocalFiles error:",
          coverInitError,
        ),
      );
  }, []);

  useEffect(() => {
    if (!accessToken || !config) return;

    defaultFileSyncService
      .sync()
      .catch((coverSyncError) =>
        console.error(
          "[SyncProvider] file sync on mount error:",
          coverSyncError,
        ),
      );
    void ensureInitializedAndSync();

    const handleOnline = () => {
      void performPing();
    };
    const handleOffline = () => {
      setSyncStatus("offline");
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      stopPingInterval();
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [
    accessToken,
    config,
    ensureInitializedAndSync,
    performPing,
    stopPingInterval,
    setSyncStatus,
    debounceTimerRef,
  ]);
}

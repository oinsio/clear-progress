// implements sync-orchestration spec (triggers T1-T7, preconditions, error handling, cleanup)
// + localstorage-refactor FR6, FR7 (usePreference for lastSyncedAt)
import type React from "react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useAlerts } from "@/app/providers/AlertProvider";
import { useAuth } from "@/app/providers/AuthProvider";
import {
  API_AUTH_ERROR_NAME,
  AUTH_REQUIRED_EVENT,
  MAX_SILENT_REFRESH_ATTEMPTS,
  PROJECT_PAUSED_ERROR_NAME,
  STORAGE_KEYS,
} from "@/constants";
import { useConnectionConfig } from "@/hooks/useConnectionConfig";
import { useFullSync } from "@/hooks/useFullSync";
import { usePingRecovery } from "@/hooks/usePingRecovery";
import { useSyncLifecycle } from "@/hooks/useSyncLifecycle";
import { useSyncTiming } from "@/hooks/useSyncTiming";
import {
  defaultFileSyncService,
  defaultSyncAdapter,
} from "@/services/defaultServices";
import {
  mapSyncServiceAlerts,
  persistLastSync,
  syncService,
} from "@/services/syncProviderService";
import type { FullSyncStep, SyncStatus } from "@/types/common";
import { toISOTimestamp } from "@/utils/dateHelpers";
import { filterTaskNamesWithInvalidRepeatRules } from "@/utils/repeatRuleValidation";

interface SyncContextValue {
  syncStatus: SyncStatus;
  syncVersion: number;
  lastSyncedAt: string | null;
  pull: () => Promise<void>;
  push: () => Promise<void>;
  schedulePush: () => void;
  triggerFullSync: (onProgress: (step: FullSyncStep) => void) => Promise<void>;
}

const SyncContext = createContext<SyncContextValue | null>(null);

export function SyncProvider({ children }: { children: React.ReactNode }) {
  const config = useConnectionConfig();
  const configRef = useRef(config);
  const { accessToken, signOut, silentRefresh } = useAuth();
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("idle");
  const [syncVersion, setSyncVersion] = useState(0);
  const { addAlerts } = useAlerts();
  const addAlertsRef = useRef(addAlerts);
  useEffect(() => {
    addAlertsRef.current = addAlerts;
  }, [addAlerts]);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(() => {
    try {
      return localStorage.getItem(STORAGE_KEYS.LAST_SYNC);
    } catch {
      return null;
    }
  });
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSyncedAtRef = useRef<string | null>(lastSyncedAt);
  const silentRefreshAttemptsRef = useRef(0);
  // Mutex: prevents concurrent sync calls (debounce + periodic + fullSync)
  const isSyncingRef = useRef(false);
  // Counts failed ping attempts to stop infinite pinging
  const pingAttemptsRef = useRef(0);

  useEffect(() => {
    lastSyncedAtRef.current = lastSyncedAt;
  }, [lastSyncedAt]);

  useEffect(() => {
    configRef.current = config;
  }, [config]);

  const applySyncResult = useCallback(async (): Promise<void> => {
    console.log("[SyncProvider] applySyncResult: starting push");
    await syncService.push();
    const syncAlerts = mapSyncServiceAlerts();
    if (syncAlerts.length > 0) {
      addAlertsRef.current(syncAlerts);
    }
    console.log("[SyncProvider] applySyncResult: push done, starting pull");
    await syncService.pull();
    // Implements FR5, FR9 of detect-invalid-repeat-rule
    const invalidRuleTaskNames = filterTaskNamesWithInvalidRepeatRules(
      syncService.lastPulledTasks,
    );
    if (invalidRuleTaskNames.length > 0) {
      addAlertsRef.current([
        { type: "repeat_rule_invalid", taskNames: invalidRuleTaskNames },
      ]);
    }
    console.log(
      "[SyncProvider] applySyncResult: pull done, starting file sync",
    );
    // File sync runs after entities — errors are caught separately so they don't
    // roll back the already-completed entity sync.
    try {
      await defaultFileSyncService.sync();
    } catch (coverError) {
      console.error("[SyncProvider] File sync failed:", coverError);
    }
    console.log(
      "[SyncProvider] applySyncResult: all done, persisting lastSync",
    );

    // Timestamp taken AFTER all sync operations so that lastSyncedAt is always
    // >= every entity's updated_at received during pull.
    const syncTimestamp = toISOTimestamp();

    // Push/pull succeeded — we are online regardless of navigator.onLine state.
    setSyncStatus("idle");
    setSyncVersion((version) => version + 1);
    persistLastSync(syncTimestamp);
    setLastSyncedAt(syncTimestamp);
    pingAttemptsRef.current = 0;
  }, []);

  const handleSyncError = useCallback(
    (error: unknown): void => {
      if (error instanceof Error && error.name === API_AUTH_ERROR_NAME) {
        silentRefreshAttemptsRef.current += 1;
        if (silentRefreshAttemptsRef.current >= MAX_SILENT_REFRESH_ATTEMPTS) {
          silentRefreshAttemptsRef.current = 0;
          setSyncStatus("unauthorized");
          signOut();
          window.dispatchEvent(new Event(AUTH_REQUIRED_EVENT));
          return;
        }
        setSyncStatus("unauthorized");
        silentRefresh();
        return;
      }
      // implements FR3 of fix-project-paused
      if (error instanceof Error && error.name === PROJECT_PAUSED_ERROR_NAME) {
        console.warn("[SyncProvider] project paused (HTTP 540)");
        setSyncStatus("project_paused");
        return;
      }
      console.error("[SyncProvider] sync error:", error);
      setSyncStatus("error");
    },
    [signOut, silentRefresh],
  );

  const { performPing, stopPingInterval } = usePingRecovery({
    accessToken,
    configRef,
    syncStatus,
    pingAttemptsRef,
    applySyncResult,
  });

  const sync = useCallback(async (): Promise<void> => {
    // Mutex: skip if a sync is already running
    if (isSyncingRef.current) return;
    if (!accessToken) return;
    if (!navigator.onLine) {
      setSyncStatus("offline");
      return;
    }
    isSyncingRef.current = true;
    setSyncStatus("syncing");
    try {
      await applySyncResult();
      silentRefreshAttemptsRef.current = 0;
      stopPingInterval();
    } catch (error) {
      handleSyncError(error);
    } finally {
      isSyncingRef.current = false;
    }
  }, [accessToken, applySyncResult, stopPingInterval, handleSyncError]);

  // implements FR3, FR4, D3, D4, D7, NFR-P1 of configurable-sync-timing
  const { delayMsRef } = useSyncTiming({ accessToken, config, sync });

  const schedulePush = useCallback(() => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(
      () => void sync(),
      delayMsRef.current,
    );
  }, [sync, delayMsRef]);

  const ensureInitializedAndSync = useCallback(async (): Promise<void> => {
    if (!accessToken) return;
    if (!navigator.onLine) {
      setSyncStatus("offline");
      return;
    }
    isSyncingRef.current = true;
    setSyncStatus("syncing");
    try {
      const pingResult = await defaultSyncAdapter.ping();
      if (!pingResult.initialized) {
        await defaultSyncAdapter.init();
      }
    } catch (initError) {
      console.warn(
        "[SyncProvider] init ping failed, going offline:",
        initError,
      );
      setSyncStatus("offline");
      isSyncingRef.current = false;
      return;
    }
    try {
      await applySyncResult();
      silentRefreshAttemptsRef.current = 0;
      stopPingInterval();
    } catch (error) {
      handleSyncError(error);
    } finally {
      isSyncingRef.current = false;
    }
  }, [accessToken, applySyncResult, stopPingInterval, handleSyncError]);

  const triggerFullSync = useFullSync({
    isSyncingRef,
    stopPingInterval,
    addAlertsRef,
    setSyncStatus,
    setSyncVersion,
    setLastSyncedAt,
  });

  useSyncLifecycle({
    accessToken,
    config,
    ensureInitializedAndSync,
    performPing,
    stopPingInterval,
    setSyncStatus,
    debounceTimerRef,
  });

  return (
    <SyncContext.Provider
      value={{
        syncStatus,
        syncVersion,
        lastSyncedAt,
        pull: sync,
        push: sync,
        schedulePush,
        triggerFullSync,
      }}
    >
      {children}
    </SyncContext.Provider>
  );
}

const SYNC_NOOP = async (): Promise<void> => {};

const SYNC_FALLBACK: SyncContextValue = {
  syncStatus: "idle",
  syncVersion: 0,
  lastSyncedAt: null,
  pull: SYNC_NOOP,
  push: SYNC_NOOP,
  schedulePush: () => {},
  triggerFullSync: SYNC_NOOP as (
    onProgress: (step: FullSyncStep) => void,
  ) => Promise<void>,
};

export function useSync(): SyncContextValue {
  return useContext(SyncContext) ?? SYNC_FALLBACK;
}

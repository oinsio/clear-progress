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
  MAX_PING_ATTEMPTS,
  MAX_SILENT_REFRESH_ATTEMPTS,
  PING_INTERVAL_MS,
  PROJECT_PAUSED_ERROR_NAME,
  STORAGE_KEYS,
  SYNC_DEBOUNCE_MS,
  SYNC_INTERVAL_MS,
} from "@/constants";
import { AttachmentRepository } from "@/db/repositories/AttachmentRepository";
import { CategoryRepository } from "@/db/repositories/CategoryRepository";
import { ChecklistRepository } from "@/db/repositories/ChecklistRepository";
import { ContextRepository } from "@/db/repositories/ContextRepository";
import { GoalRepository } from "@/db/repositories/GoalRepository";
import { IdeaRepository } from "@/db/repositories/IdeaRepository";
import { SettingsRepository } from "@/db/repositories/SettingsRepository";
import { SyncMetaRepository } from "@/db/repositories/SyncMetaRepository";
import { TaskRepository } from "@/db/repositories/TaskRepository";
import { useConnectionConfig } from "@/hooks/useConnectionConfig";
import {
  defaultFileSyncService,
  defaultSyncAdapter,
} from "@/services/defaultServices";
import { setPreference } from "@/services/localPreferencesService";
import { RecurringTaskDeduplicator } from "@/services/RecurringTaskDeduplicator";
import { SyncService } from "@/services/SyncService";
import type { AppAlert } from "@/types/alerts";
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

const syncService = new SyncService(
  defaultSyncAdapter,
  new SyncMetaRepository(),
  new TaskRepository(),
  new GoalRepository(),
  new ContextRepository(),
  new CategoryRepository(),
  new ChecklistRepository(),
  new IdeaRepository(),
  new SettingsRepository(),
  new AttachmentRepository(),
  new RecurringTaskDeduplicator(
    new TaskRepository(),
    new ChecklistRepository(),
  ),
);

function persistLastSync(timestamp: string): void {
  setPreference(STORAGE_KEYS.LAST_SYNC, timestamp);
}

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
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
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

  const stopPingInterval = useCallback(() => {
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = null;
    }
  }, []);

  const applySyncResult = useCallback(async (): Promise<void> => {
    console.log("[SyncProvider] applySyncResult: starting push");
    await syncService.push();
    // implements FR7, FR8 of fix-push-poison-pill
    if (syncService.lastSyncAlerts.length > 0) {
      const syncAlerts: AppAlert[] = syncService.lastSyncAlerts.map(
        (syncAlert) => ({
          type: "sync" as const,
          messageKey: syncAlert.messageKey,
          params: syncAlert.params,
        }),
      );
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

  const schedulePush = useCallback(() => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => void sync(), SYNC_DEBOUNCE_MS);
  }, [sync]);

  const triggerFullSync = useCallback(
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
        if (syncService.lastSyncAlerts.length > 0) {
          const syncAlerts: AppAlert[] = syncService.lastSyncAlerts.map(
            (syncAlert) => ({
              type: "sync" as const,
              messageKey: syncAlert.messageKey,
              params: syncAlert.params,
            }),
          );
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
    [stopPingInterval],
  );

  const performPing = useCallback(async (): Promise<void> => {
    if (!accessToken || !configRef.current) return;
    pingAttemptsRef.current += 1;
    if (pingAttemptsRef.current > MAX_PING_ATTEMPTS) {
      // Give up pinging — user or network must recover manually
      stopPingInterval();
      pingAttemptsRef.current = 0;
      return;
    }
    try {
      const pingResult = await defaultSyncAdapter.ping();
      stopPingInterval();
      pingAttemptsRef.current = 0;
      if (!pingResult.initialized) {
        await defaultSyncAdapter.init();
      }
      await applySyncResult();
    } catch (pingError) {
      console.warn("[SyncProvider] ping failed:", pingError);
      // Still unreachable — keep pinging until MAX_PING_ATTEMPTS
    }
  }, [accessToken, applySyncResult, stopPingInterval]);

  const startPingInterval = useCallback(() => {
    if (pingIntervalRef.current) return;
    pingIntervalRef.current = setInterval(
      () => void performPing(),
      PING_INTERVAL_MS,
    );
  }, [performPing]);

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
    intervalRef.current = setInterval(() => void sync(), SYNC_INTERVAL_MS);

    const handleOnline = () => {
      void performPing();
    };
    const handleOffline = () => {
      setSyncStatus("offline");
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      stopPingInterval();
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [
    accessToken,
    config,
    ensureInitializedAndSync,
    sync,
    performPing,
    stopPingInterval,
  ]);

  useEffect(() => {
    if (syncStatus === "offline" || syncStatus === "error") {
      startPingInterval();
    }
  }, [syncStatus, startPingInterval]);

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

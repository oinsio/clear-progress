// implements FR3, FR4, D3, D4, D7, NFR-P1 of configurable-sync-timing
import { useCallback, useEffect, useRef, useState } from "react";
import {
  DEFAULT_SYNC_INTERVAL_MIN,
  SYNC_DEBOUNCE_MS,
  SYNC_TIMING_CHANGED_EVENT,
} from "@/constants";
import { SettingsRepository } from "@/db/repositories/SettingsRepository";
import { SettingsService } from "@/services/SettingsService";
import type { ConnectionConfig } from "@/types/connection";

const MS_PER_SECOND = 1000;
const MS_PER_MINUTE = 60 * MS_PER_SECOND;

// implements FR4, D3 of configurable-sync-timing
const settingsService = new SettingsService(new SettingsRepository());

interface UseSyncTimingParams {
  accessToken: string | null;
  config: ConnectionConfig | null;
  sync: () => Promise<void>;
}

export interface UseSyncTimingReturn {
  delayMsRef: { current: number };
}

/**
 * Owns sync-TIMING state: the debounce delay used by SyncProvider's
 * schedulePush, and the periodic-interval sync driven by the configured
 * sync interval. Re-reads settings whenever they can have changed:
 * after every pull ("sync_complete", since a pulled settings row may carry
 * a new value) and after a local write via useSettings's setters
 * (SYNC_TIMING_CHANGED_EVENT) — so both propagate without a page reload.
 * Implements FR3, FR4, D3, D4, D7 of configurable-sync-timing.
 */
export function useSyncTiming({
  accessToken,
  config,
  sync,
}: UseSyncTimingParams): UseSyncTimingReturn {
  // implements FR4, D3 of configurable-sync-timing
  const delayMsRef = useRef<number>(SYNC_DEBOUNCE_MS);
  // implements FR3, D4 of configurable-sync-timing
  const [syncIntervalMinutes, setSyncIntervalMinutes] = useState<number | null>(
    DEFAULT_SYNC_INTERVAL_MIN,
  );
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // implements FR3, FR4, D3, D4, D7 of configurable-sync-timing
  const reloadSyncTimingSettings = useCallback(async (): Promise<void> => {
    const [delaySeconds, intervalMinutes] = await Promise.all([
      settingsService.getAutoSyncDelaySeconds(),
      settingsService.getSyncIntervalMinutes(),
    ]);
    delayMsRef.current = delaySeconds * MS_PER_SECOND;
    setSyncIntervalMinutes(intervalMinutes);
  }, []);

  // implements FR3, FR4, D3, D4 of configurable-sync-timing
  useEffect(() => {
    void reloadSyncTimingSettings();
  }, [reloadSyncTimingSettings]);

  // implements FR3, FR4, G2, U4, D7 of configurable-sync-timing
  useEffect(() => {
    const handleSyncTimingChange = () => {
      void reloadSyncTimingSettings();
    };

    window.addEventListener("sync_complete", handleSyncTimingChange);
    window.addEventListener(SYNC_TIMING_CHANGED_EVENT, handleSyncTimingChange);

    return () => {
      window.removeEventListener("sync_complete", handleSyncTimingChange);
      window.removeEventListener(
        SYNC_TIMING_CHANGED_EVENT,
        handleSyncTimingChange,
      );
    };
  }, [reloadSyncTimingSettings]);

  // implements FR3, D4, NFR-P1 of configurable-sync-timing
  useEffect(() => {
    if (!accessToken || !config) return;
    if (syncIntervalMinutes === null) return;

    const intervalId = setInterval(
      () => void sync(),
      syncIntervalMinutes * MS_PER_MINUTE,
    );
    intervalRef.current = intervalId;

    return () => {
      clearInterval(intervalId);
      intervalRef.current = null;
    };
  }, [syncIntervalMinutes, accessToken, config, sync]);

  return { delayMsRef };
}

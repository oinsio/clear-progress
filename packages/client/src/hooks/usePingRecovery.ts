// Ping-based reconnection loop for SyncProvider. When the app goes offline or a
// sync errors, it polls the backend (ping) on a fixed interval until the server
// is reachable again, then re-runs the sync. Extracted from SyncProvider.tsx
// (task 6.3a of configurable-sync-timing) to keep that file under the file-size
// limit.
import { useCallback, useEffect, useRef } from "react";
import { MAX_PING_ATTEMPTS, PING_INTERVAL_MS } from "@/constants";
import { defaultSyncAdapter } from "@/services/defaultServices";
import type { SyncStatus } from "@/types/common";
import type { ConnectionConfig } from "@/types/connection";

interface UsePingRecoveryParams {
  accessToken: string | null;
  configRef: { current: ConnectionConfig | null };
  syncStatus: SyncStatus;
  // Owned by SyncProvider so applySyncResult can reset it after any successful
  // sync; incremented and checked here to stop pinging after MAX_PING_ATTEMPTS.
  pingAttemptsRef: { current: number };
  applySyncResult: () => Promise<void>;
}

export interface UsePingRecoveryReturn {
  performPing: () => Promise<void>;
  stopPingInterval: () => void;
}

export function usePingRecovery({
  accessToken,
  configRef,
  syncStatus,
  pingAttemptsRef,
  applySyncResult,
}: UsePingRecoveryParams): UsePingRecoveryReturn {
  const pingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPingInterval = useCallback(() => {
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = null;
    }
  }, []);

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
  }, [
    accessToken,
    configRef,
    pingAttemptsRef,
    applySyncResult,
    stopPingInterval,
  ]);

  const startPingInterval = useCallback(() => {
    if (pingIntervalRef.current) return;
    pingIntervalRef.current = setInterval(
      () => void performPing(),
      PING_INTERVAL_MS,
    );
  }, [performPing]);

  useEffect(() => {
    if (syncStatus === "offline" || syncStatus === "error") {
      startPingInterval();
    }
  }, [syncStatus, startPingInterval]);

  return { performPing, stopPingInterval };
}

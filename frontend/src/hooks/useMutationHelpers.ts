import { useCallback } from "react";
import { useSync } from "@/app/providers/SyncProvider";

/**
 * Creates a wrapper that executes an operation and triggers sync
 */
export function useSyncWrapper(onReload?: () => Promise<void>) {
  const { schedulePush } = useSync();

  return useCallback(
    async <T>(operation: () => Promise<T>, shouldReload = true): Promise<T> => {
      const result = await operation();
      if (shouldReload && onReload) {
        await onReload();
      }
      schedulePush();
      return result;
    },
    [onReload, schedulePush],
  );
}

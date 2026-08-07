import { useSyncExternalStore } from "react";
import { getSnapshot, subscribe } from "@/stores/logicalTodayStore";
import type { ISODate } from "@/types/entities";

// implements FR1 of fix-completed-today-stale-on-day-rollover
export function useLogicalToday(): ISODate {
  return useSyncExternalStore(subscribe, getSnapshot);
}

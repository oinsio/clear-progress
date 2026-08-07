import { DAY_BOUNDARY_CHANGED_EVENT } from "@/constants";
import { getCachedDayBoundary } from "@/hooks/useSettings";
import { type Clock, systemClock } from "@/lib/temporal";
import type { ISODate } from "@/types/entities";
import { getLogicalDate } from "@/utils/getLogicalDate";
import { scheduleNextBoundary } from "@/utils/scheduleNextBoundary";

type Listener = () => void;

let currentClock: Clock = systemClock;
let currentSnapshot: ISODate = computeSnapshot();
const listeners = new Set<Listener>();
let boundaryTimeout: ReturnType<typeof setTimeout> | null = null;

function computeSnapshot(): ISODate {
  return getLogicalDate(currentClock, getCachedDayBoundary()) as ISODate;
}

function emitChange(): void {
  for (const listener of listeners) {
    listener();
  }
}

function recompute(): void {
  const nextSnapshot = computeSnapshot();
  if (nextSnapshot !== currentSnapshot) {
    currentSnapshot = nextSnapshot;
    emitChange();
  }
}

function clearBoundaryTimeout(): void {
  if (boundaryTimeout) {
    clearTimeout(boundaryTimeout);
    boundaryTimeout = null;
  }
}

function scheduleBoundaryRecompute(): void {
  boundaryTimeout = scheduleNextBoundary(
    currentClock,
    getCachedDayBoundary(),
    () => {
      recompute();
      scheduleBoundaryRecompute();
    },
  );
}

function rescheduleBoundaryTimer(): void {
  clearBoundaryTimeout();
  scheduleBoundaryRecompute();
}

// On return from background the boundary timer may be aimed at a stale
// instant (the timezone can change while inactive), so re-arm it alongside
// recompute — mirroring useHiddenTasksReveal.
function handleVisibilityChange(): void {
  if (document.visibilityState === "visible") {
    recompute();
    rescheduleBoundaryTimer();
  }
}

function handlePageShow(event: PageTransitionEvent): void {
  if (event.persisted) {
    recompute();
    rescheduleBoundaryTimer();
  }
}

// FR2: day boundary may change while other tabs/instances are inactive
function handleDayBoundaryChanged(): void {
  recompute();
  rescheduleBoundaryTimer();
}

function start(): void {
  // The snapshot can go stale while there are no subscribers (the timer is
  // torn down), so refresh it before the first subscriber reads it — keeping
  // the invariant "snapshot equals the current logical date while subscribed".
  recompute();
  scheduleBoundaryRecompute();
  document.addEventListener("visibilitychange", handleVisibilityChange);
  window.addEventListener("pageshow", handlePageShow as EventListener);
  window.addEventListener(DAY_BOUNDARY_CHANGED_EVENT, handleDayBoundaryChanged);
}

function stop(): void {
  clearBoundaryTimeout();
  document.removeEventListener("visibilitychange", handleVisibilityChange);
  window.removeEventListener("pageshow", handlePageShow as EventListener);
  window.removeEventListener(
    DAY_BOUNDARY_CHANGED_EVENT,
    handleDayBoundaryChanged,
  );
}

export function getSnapshot(): ISODate {
  return currentSnapshot;
}

/**
 * Implements FR2, NFR-P1 of fix-completed-today-stale-on-day-rollover.
 * Ref-counted: the boundary timer and re-arm listeners start on the first
 * subscriber and tear down on the last, so there is at most one of each
 * regardless of subscriber count.
 */
export function subscribe(listener: Listener): () => void {
  if (listeners.size === 0) {
    start();
  }
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) {
      stop();
    }
  };
}

export function _resetForTesting(clock: Clock = systemClock): void {
  stop();
  listeners.clear();
  currentClock = clock;
  currentSnapshot = computeSnapshot();
}

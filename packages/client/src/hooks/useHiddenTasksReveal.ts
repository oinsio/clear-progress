import { useEffect, useRef } from "react";
import { DAY_BOUNDARY_CHANGED_EVENT } from "@/constants";
import { TaskRepository } from "@/db/repositories/TaskRepository";
import { type Clock, systemClock, Temporal } from "@/lib/temporal";
import { HiddenTaskService } from "@/services/HiddenTaskService";
import type { ISODate } from "@/types/entities";
import { getLogicalDate } from "@/utils/getLogicalDate";

import { getCachedDayBoundary } from "./useSettings";

const BOUNDARY_BUFFER_MS = 1000;

const taskRepository = new TaskRepository();

export function useHiddenTasksReveal(clock: Clock = systemClock) {
  const boundaryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dayBoundaryRef = useRef(getCachedDayBoundary());

  useEffect(() => {
    const hiddenTaskService = new HiddenTaskService(taskRepository, clock);

    const revealTasks = async () => {
      try {
        const logicalDate = getLogicalDate(
          clock,
          dayBoundaryRef.current,
        ) as ISODate;
        const revealed = await hiddenTaskService.revealHiddenTasks(logicalDate);
        if (revealed.length > 0) {
          console.log(`Revealed ${revealed.length} hidden tasks`);
        }
      } catch (error) {
        console.error("Failed to reveal hidden tasks:", error);
      }
    };

    const scheduleBoundaryReveal = (): ReturnType<typeof setTimeout> => {
      const now = clock.instant();
      const timeZone = clock.timeZoneId();
      const boundaryTime = Temporal.PlainTime.from(dayBoundaryRef.current);
      const today = clock.plainDateISO();
      const todayBoundary = today
        .toZonedDateTime({ timeZone, plainTime: boundaryTime })
        .toInstant();

      const nextBoundary =
        Temporal.Instant.compare(todayBoundary, now) > 0
          ? todayBoundary
          : today
              .add({ days: 1 })
              .toZonedDateTime({ timeZone, plainTime: boundaryTime })
              .toInstant();

      const msUntilBoundary = nextBoundary
        .since(now)
        .total({ unit: "milliseconds" });

      return setTimeout(() => {
        void revealTasks();
        boundaryTimeoutRef.current = scheduleBoundaryReveal();
      }, msUntilBoundary + BOUNDARY_BUFFER_MS);
    };

    const clearBoundaryTimeout = () => {
      if (boundaryTimeoutRef.current) {
        clearTimeout(boundaryTimeoutRef.current);
      }
    };

    const reschedule = () => {
      clearBoundaryTimeout();
      boundaryTimeoutRef.current = scheduleBoundaryReveal();
    };

    // Reveal on mount
    void revealTasks();

    // Schedule reveal at day boundary time
    boundaryTimeoutRef.current = scheduleBoundaryReveal();

    // Reveal after each pull (listen to sync event)
    const handleSyncComplete = () => {
      void revealTasks();
    };

    // Reveal when returning from background (visibilitychange)
    // and reschedule boundary timer with the current timezone
    // (user may have changed TZ while inactive)
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void revealTasks();
        reschedule();
      }
    };

    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted) {
        void revealTasks();
        reschedule();
      }
    };

    // FR6: On boundary change — recalculate timer + immediate check
    const handleDayBoundaryChanged = () => {
      dayBoundaryRef.current = getCachedDayBoundary();
      void revealTasks();
      reschedule();
    };

    window.addEventListener("sync_complete", handleSyncComplete);
    window.addEventListener("pageshow", handlePageShow);
    window.addEventListener(
      DAY_BOUNDARY_CHANGED_EVENT,
      handleDayBoundaryChanged,
    );
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("sync_complete", handleSyncComplete);
      window.removeEventListener("pageshow", handlePageShow);
      window.removeEventListener(
        DAY_BOUNDARY_CHANGED_EVENT,
        handleDayBoundaryChanged,
      );
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      clearBoundaryTimeout();
    };
  }, [clock]);
}

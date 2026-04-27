import { useEffect, useRef } from "react";
import { TaskRepository } from "@/db/repositories/TaskRepository";
import { type Clock, systemClock } from "@/lib/temporal";
import { HiddenTaskService } from "@/services/HiddenTaskService";

const MIDNIGHT_BUFFER_MS = 1000;

const taskRepository = new TaskRepository();

export function useHiddenTasksReveal(clock: Clock = systemClock) {
  const midnightTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const hiddenTaskService = new HiddenTaskService(taskRepository, clock);

    const revealTasks = async () => {
      try {
        const revealed = await hiddenTaskService.revealHiddenTasks();
        if (revealed.length > 0) {
          console.log(`Revealed ${revealed.length} hidden tasks`);
        }
      } catch (error) {
        console.error("Failed to reveal hidden tasks:", error);
      }
    };

    const scheduleNextDayReveal = (): ReturnType<typeof setTimeout> => {
      const now = clock.instant();
      const timeZone = clock.timeZoneId();
      const tomorrow = clock.plainDateISO().add({ days: 1 });
      const midnight = tomorrow
        .toZonedDateTime({ timeZone, plainTime: "00:00" })
        .toInstant();
      const msUntilMidnight = midnight
        .since(now)
        .total({ unit: "milliseconds" });

      return setTimeout(() => {
        void revealTasks();
        // Перепланировать на следующую полночь
        midnightTimeoutRef.current = scheduleNextDayReveal();
      }, msUntilMidnight + MIDNIGHT_BUFFER_MS);
    };

    // Раскрыть при монтировании
    void revealTasks();

    // Запланировать раскрытие на полночь
    midnightTimeoutRef.current = scheduleNextDayReveal();

    // Раскрыть после каждого pull (слушать событие sync)
    const handleSyncComplete = () => {
      void revealTasks();
    };

    // Раскрыть при возврате из фона (visibilitychange)
    // и перепланировать midnight timer с актуальным часовым поясом
    // (пользователь мог сменить TZ во время не активности)
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void revealTasks();
        if (midnightTimeoutRef.current) {
          clearTimeout(midnightTimeoutRef.current);
        }
        midnightTimeoutRef.current = scheduleNextDayReveal();
      }
    };

    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted) {
        void revealTasks();
        if (midnightTimeoutRef.current) {
          clearTimeout(midnightTimeoutRef.current);
        }
        midnightTimeoutRef.current = scheduleNextDayReveal();
      }
    };

    window.addEventListener("sync_complete", handleSyncComplete);
    window.addEventListener("pageshow", handlePageShow);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("sync_complete", handleSyncComplete);
      window.removeEventListener("pageshow", handlePageShow);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      if (midnightTimeoutRef.current) {
        clearTimeout(midnightTimeoutRef.current);
      }
    };
  }, [clock]);
}

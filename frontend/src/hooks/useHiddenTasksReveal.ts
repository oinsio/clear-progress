import { useEffect, useRef } from "react";
import { HiddenTaskService } from "@/services/HiddenTaskService";
import { TaskRepository } from "@/db/repositories/TaskRepository";
import { Temporal } from "@/lib/temporal";

const taskRepository = new TaskRepository();

export function useHiddenTasksReveal() {
  const midnightTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const hiddenTaskService = new HiddenTaskService(taskRepository);

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
      const now = Temporal.Now.instant();
      const timeZone = Temporal.Now.timeZoneId();
      const tomorrow = Temporal.Now.plainDateISO().add({ days: 1 });
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
      }, msUntilMidnight + 1000); // +1 секунда буфера
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

    window.addEventListener("sync_complete", handleSyncComplete);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("sync_complete", handleSyncComplete);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      if (midnightTimeoutRef.current) {
        clearTimeout(midnightTimeoutRef.current);
      }
    };
  }, []);
}

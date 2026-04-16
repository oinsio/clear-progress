import { useEffect } from "react";
import { HiddenTaskService } from "@/services/HiddenTaskService";
import { TaskRepository } from "@/db/repositories/TaskRepository";

const taskRepository = new TaskRepository();

export function useHiddenTasksReveal() {
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

    // Раскрыть при монтировании
    void revealTasks();

    // Раскрыть после каждого pull (слушать событие sync)
    const handleSyncComplete = () => {
      void revealTasks();
    };

    // Раскрыть при возврате из фона (visibilitychange)
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void revealTasks();
      }
    };

    window.addEventListener("sync_complete", handleSyncComplete);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("sync_complete", handleSyncComplete);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);
}

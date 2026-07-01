import { useCallback, useEffect, useState } from "react";
import { useAlerts } from "@/app/providers/AlertProvider";
import { useSync } from "@/app/providers/SyncProvider";
import { BOX } from "@/constants";
import { systemClock } from "@/lib/temporal";
import { defaultTaskService } from "@/services/defaultServices";
import type { TaskService } from "@/services/TaskService";
import type { Task } from "@/types/entities";
import { getLogicalDate } from "@/utils/getLogicalDate";

import { getCachedDayBoundary } from "./useSettings";

export interface UseInboxTasksReturn {
  tasks: Task[];
  isLoading: boolean;
  completeTask: (id: string) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
}

export function useInboxTasks(
  taskService: TaskService = defaultTaskService,
): UseInboxTasksReturn {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { addAlerts } = useAlerts();
  const { syncVersion, schedulePush } = useSync();

  const loadTasks = useCallback(async () => {
    const inboxTasks = await taskService.getByBox(BOX.INBOX);
    setTasks(inboxTasks);
    setIsLoading(false);
  }, [taskService]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: syncVersion triggers reload after sync
  useEffect(() => {
    void loadTasks();
  }, [loadTasks, syncVersion]);

  const completeTask = useCallback(
    async (id: string) => {
      const logicalDate = getLogicalDate(systemClock, getCachedDayBoundary());
      const { completed, recurringResult } = await taskService.complete(
        id,
        logicalDate,
      );
      if (recurringResult.status === "skipped_invalid_rule") {
        addAlerts([
          { type: "repeat_rule_invalid", taskNames: [completed.name] },
        ]);
      }
      await loadTasks();
      schedulePush();
    },
    [taskService, loadTasks, schedulePush, addAlerts],
  );

  const deleteTask = useCallback(
    async (id: string) => {
      await taskService.softDelete(id);
      await loadTasks();
      schedulePush();
    },
    [taskService, loadTasks, schedulePush],
  );

  return { tasks, isLoading, completeTask, deleteTask };
}

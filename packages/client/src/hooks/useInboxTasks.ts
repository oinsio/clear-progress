import { useCallback, useEffect, useState } from "react";
import { useSync } from "@/app/providers/SyncProvider";
import { BOX } from "@/constants";
import { systemClock } from "@/lib/temporal";
import { defaultTaskService } from "@/services/defaultServices";
import type { TaskService } from "@/services/TaskService";
import type { Task } from "@/types/entities";
import { getLogicalDate } from "@/utils/getLogicalDate";

import { getCachedDayBoundary } from "./useSettings";
import { useTaskCompletionAlerts } from "./useTaskCompletionAlerts";

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
  const { raiseCompletionAlerts } = useTaskCompletionAlerts();
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
      // implements FR3, FR5 of fix-recurring-completion-error-masking
      raiseCompletionAlerts(recurringResult, completed?.name ?? "");
      await loadTasks();
      schedulePush();
    },
    [taskService, loadTasks, schedulePush, raiseCompletionAlerts],
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

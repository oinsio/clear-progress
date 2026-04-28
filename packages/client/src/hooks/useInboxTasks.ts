import { useCallback, useEffect, useState } from "react";
import { useSync } from "@/app/providers/SyncProvider";
import { BOX } from "@/constants";
import { defaultTaskService } from "@/services/defaultServices";
import type { TaskService } from "@/services/TaskService";
import type { Task } from "@/types/entities";

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
      await taskService.complete(id);
      await loadTasks();
      schedulePush();
    },
    [taskService, loadTasks, schedulePush],
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

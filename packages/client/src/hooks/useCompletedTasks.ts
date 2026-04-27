import { liveQuery } from "dexie";
import { useCallback, useEffect, useState } from "react";
import { useSync } from "@/app/providers/SyncProvider";
import { defaultTaskService } from "@/services/defaultServices";
import type { TaskService } from "@/services/TaskService";
import type { Task } from "@/types/entities";

export interface UseCompletedTasksReturn {
  completedTasks: Task[];
  isLoading: boolean;
  reload: () => Promise<void>;
}

export function useCompletedTasks(
  taskService: TaskService = defaultTaskService,
): UseCompletedTasksReturn {
  const [completedTasks, setCompletedTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  useSync();

  useEffect(() => {
    setIsLoading(true);
    const subscription = liveQuery(() => taskService.getCompleted()).subscribe({
      next: (tasks) => {
        setCompletedTasks(tasks);
        setIsLoading(false);
      },
    });
    return () => subscription.unsubscribe();
  }, [taskService]);

  const reload = useCallback(async () => {
    // liveQuery handles reactive updates automatically
  }, []);

  return { completedTasks, isLoading, reload };
}

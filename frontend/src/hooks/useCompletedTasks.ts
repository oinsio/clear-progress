import { useState, useEffect, useCallback } from "react";
import { liveQuery } from "dexie";
import type { Task } from "@/types/entities";
import { TaskService } from "@/services/TaskService";
import { defaultTaskService } from "@/services/defaultServices";
import { useSync } from "@/app/providers/SyncProvider";

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

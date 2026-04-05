import { useState, useEffect, useCallback } from "react";
import { liveQuery } from "dexie";
import type { Task } from "@/types/entities";
import type { Box } from "@/types/common";
import { TaskService } from "@/services/TaskService";
import { useTaskMutations } from "./useTaskMutations";

export interface UseFilteredTasksReturn {
  tasks: Task[];
  isLoading: boolean;
  createTask: (title: string, box: Box, notes?: string) => Promise<void>;
  completeTask: (id: string) => Promise<string | null>;
  updateTask: (id: string, changes: Partial<Task>) => Promise<void>;
  moveTask: (id: string, box: Box) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
}

interface FilterConfig {
  queryFn: () => Promise<Task[]>;
  createTaskData: Record<string, string>;
}

export function useFilteredTasks(
  config: FilterConfig,
  taskService: TaskService,
): UseFilteredTasksReturn {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    const subscription = liveQuery(config.queryFn).subscribe({
      next: (filteredTasks) => {
        setTasks(filteredTasks);
        setIsLoading(false);
      },
    });
    return () => subscription.unsubscribe();
  }, [config.queryFn]);

  const createTask = useCallback(
    async (title: string, box: Box, notes = "") => {
      await taskService.create({ title, box, notes, ...config.createTaskData });
    },
    [taskService, config.createTaskData],
  );

  const noopReload = useCallback(async () => {}, []);
  const mutations = useTaskMutations(taskService, noopReload);

  return { tasks, isLoading, createTask, ...mutations };
}

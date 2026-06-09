import { liveQuery } from "dexie";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSync } from "@/app/providers/SyncProvider";
import { defaultTaskService } from "@/services/defaultServices";
import { compareCompletedTasks } from "@/services/SortOrderService";
import type { TaskService } from "@/services/TaskService";
import type { Box } from "@/types/common";
import type { Task } from "@/types/entities";
import { useTaskMutations } from "./useTaskMutations";

export interface UseGoalTasksReturn {
  tasks: Task[];
  completedTasks: Task[];
  isLoading: boolean;
  createTask: (name: string, box: Box, description?: string) => Promise<void>;
  completeTask: (id: string) => Promise<string | null>;
  updateTask: (id: string, changes: Partial<Task>) => Promise<void>;
  moveTask: (id: string, box: Box) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  duplicateTask: (id: string) => Promise<Task>;
  reorderTasks: (taskId: string, newSortOrder: string) => Promise<void>;
}

/** Implements FR9 of hide-tasks */
export function useGoalTasks(
  goalId: string,
  options?: { showHidden?: boolean },
  taskService: TaskService = defaultTaskService,
): UseGoalTasksReturn {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [completedTasks, setCompletedTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { schedulePush } = useSync();

  const queryFn = useMemo(
    () => () =>
      taskService.getByGoalId(goalId, { includeHidden: options?.showHidden }),
    [goalId, options?.showHidden, taskService],
  );

  useEffect(() => {
    setIsLoading(true);
    const subscription = liveQuery(queryFn).subscribe({
      next: (allGoalTasks) => {
        setTasks(allGoalTasks.filter((task) => !task.is_completed));
        setCompletedTasks(
          allGoalTasks
            .filter((task) => task.is_completed)
            .sort(compareCompletedTasks),
        );
        setIsLoading(false);
      },
    });
    return () => subscription.unsubscribe();
  }, [queryFn]);

  const createTask = useCallback(
    async (name: string, box: Box, description = "") => {
      await taskService.create({ name, box, description, goal_id: goalId });
    },
    [taskService, goalId],
  );

  const reorderTasks = useCallback(
    async (taskId: string, newSortOrder: string) => {
      await taskService.reorderTasks(taskId, newSortOrder);
      schedulePush();
    },
    [taskService, schedulePush],
  );

  const noopReload = useCallback(async () => {}, []);
  const mutations = useTaskMutations(taskService, noopReload);

  return {
    tasks,
    completedTasks,
    isLoading,
    createTask,
    reorderTasks,
    ...mutations,
  };
}

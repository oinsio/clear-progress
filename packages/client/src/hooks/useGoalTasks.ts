import { liveQuery } from "dexie";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSync } from "@/app/providers/SyncProvider";
import { AttachmentRepository } from "@/db/repositories/AttachmentRepository";
import { ChecklistRepository } from "@/db/repositories/ChecklistRepository";
import { TaskRepository } from "@/db/repositories/TaskRepository";
import { TaskService } from "@/services/TaskService";
import type { Box } from "@/types/common";
import type { Task } from "@/types/entities";
import { useTaskMutations } from "./useTaskMutations";

const defaultTaskService = new TaskService(
  new TaskRepository(),
  new ChecklistRepository(),
  undefined,
  new AttachmentRepository(),
);

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
  reorderTasks: (orderedTasks: Task[]) => Promise<void>;
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
            .sort((taskA, taskB) => {
              if (taskA.completed_at && taskB.completed_at) {
                return taskB.completed_at > taskA.completed_at ? 1 : -1;
              }
              return taskB.sort_order - taskA.sort_order;
            }),
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
    async (orderedTasks: Task[]) => {
      setTasks(orderedTasks);
      await taskService.reorderTasks(orderedTasks);
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

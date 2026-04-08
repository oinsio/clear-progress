import { useState, useEffect, useCallback, useMemo } from "react";
import { liveQuery } from "dexie";
import type { Task } from "@/types/entities";
import type { Box } from "@/types/common";
import { TaskService } from "@/services/TaskService";
import { TaskRepository } from "@/db/repositories/TaskRepository";
import { ChecklistRepository } from "@/db/repositories/ChecklistRepository";
import { useTaskMutations } from "./useTaskMutations";

const defaultTaskService = new TaskService(
  new TaskRepository(),
  new ChecklistRepository(),
);

export interface UseGoalTasksReturn {
  tasks: Task[];
  completedTasks: Task[];
  isLoading: boolean;
  createTask: (title: string, box: Box, notes?: string) => Promise<void>;
  completeTask: (id: string) => Promise<string | null>;
  updateTask: (id: string, changes: Partial<Task>) => Promise<void>;
  moveTask: (id: string, box: Box) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  duplicateTask: (id: string) => Promise<Task>;
}

export function useGoalTasks(
  goalId: string,
  taskService: TaskService = defaultTaskService,
): UseGoalTasksReturn {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [completedTasks, setCompletedTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const queryFn = useMemo(
    () => () => taskService.getByGoalId(goalId),
    [goalId, taskService],
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
                return taskB.completed_at.localeCompare(taskA.completed_at);
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
    async (title: string, box: Box, notes = "") => {
      await taskService.create({ title, box, notes, goal_id: goalId });
    },
    [taskService, goalId],
  );

  const noopReload = useCallback(async () => {}, []);
  const mutations = useTaskMutations(taskService, noopReload);

  return { tasks, completedTasks, isLoading, createTask, ...mutations };
}

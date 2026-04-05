import { useState, useEffect, useCallback } from "react";
import { liveQuery } from "dexie";
import type { Goal, Task } from "@/types/entities";
import type { GoalStatus } from "@/types/common";
import { GoalService } from "@/services/GoalService";
import { GoalRepository } from "@/db/repositories/GoalRepository";
import { TaskService } from "@/services/TaskService";
import { defaultTaskService } from "@/services/defaultServices";
import { useSync } from "@/app/providers/SyncProvider";

const defaultGoalService = new GoalService(new GoalRepository());

export interface UseGoalReturn {
  goal: Goal | undefined;
  tasks: Task[];
  isLoading: boolean;
  updateGoal: (changes: Partial<Goal>) => Promise<void>;
  updateGoalStatus: (status: GoalStatus) => Promise<void>;
  deleteGoal: () => Promise<void>;
  reload: () => Promise<void>;
}

export function useGoal(
  id: string,
  goalService: GoalService = defaultGoalService,
  taskService: TaskService = defaultTaskService,
): UseGoalReturn {
  const [goal, setGoal] = useState<Goal | undefined>(undefined);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { schedulePush } = useSync();

  useEffect(() => {
    setIsLoading(true);
    const subscription = liveQuery(async () => {
      const [foundGoal, goalTasks] = await Promise.all([
        goalService.getById(id),
        taskService.getByGoalId(id),
      ]);
      return { foundGoal, goalTasks };
    }).subscribe({
      next: ({ foundGoal, goalTasks }) => {
        setGoal(foundGoal);
        setTasks(goalTasks);
        setIsLoading(false);
      },
    });
    return () => subscription.unsubscribe();
  }, [id, goalService, taskService]);

  const updateGoal = useCallback(
    async (changes: Partial<Goal>) => {
      if (!goal) return;
      await goalService.update(goal.id, changes);
      schedulePush();
    },
    [goalService, goal, schedulePush],
  );

  const updateGoalStatus = useCallback(
    async (status: GoalStatus) => {
      if (!goal) return;
      await goalService.updateStatus(goal.id, status);
      schedulePush();
    },
    [goalService, goal, schedulePush],
  );

  const deleteGoal = useCallback(async () => {
    if (!goal) return;
    await goalService.softDelete(goal.id);
    schedulePush();
  }, [goalService, goal, schedulePush]);

  const reload = useCallback(async () => {
    // liveQuery handles reactive updates automatically
  }, []);

  return { goal, tasks, isLoading, updateGoal, updateGoalStatus, deleteGoal, reload };
}

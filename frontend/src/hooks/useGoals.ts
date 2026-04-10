import { useState, useEffect, useCallback } from "react";
import { liveQuery } from "dexie";
import type { Goal } from "@/types/entities";
import type { GoalStatus } from "@/types/common";
import { GoalService } from "@/services/GoalService";
import { GoalRepository } from "@/db/repositories/GoalRepository";
import { useSync } from "@/app/providers/SyncProvider";

const defaultGoalService = new GoalService(new GoalRepository());

export interface UseGoalsReturn {
  goals: Goal[];
  isLoading: boolean;
  reloadGoals: () => Promise<void>;
  createGoal: (data: Pick<Goal, "name"> & Partial<Goal>) => Promise<void>;
  updateGoal: (id: string, changes: Partial<Goal>) => Promise<void>;
  updateGoalStatus: (id: string, status: GoalStatus) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;
  reorderGoals: (orderedGoals: Goal[]) => Promise<void>;
}

export function useGoals(
  goalService: GoalService = defaultGoalService,
): UseGoalsReturn {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { schedulePush } = useSync();

  useEffect(() => {
    setIsLoading(true);
    const subscription = liveQuery(() => goalService.getAll()).subscribe({
      next: (allGoals) => {
        setGoals(allGoals);
        setIsLoading(false);
      },
    });
    return () => subscription.unsubscribe();
  }, [goalService]);

  const createGoal = useCallback(
    async (data: Pick<Goal, "name"> & Partial<Goal>) => {
      await goalService.create(data);
      schedulePush();
    },
    [goalService, schedulePush],
  );

  const updateGoal = useCallback(
    async (id: string, changes: Partial<Goal>) => {
      await goalService.update(id, changes);
      schedulePush();
    },
    [goalService, schedulePush],
  );

  const updateGoalStatus = useCallback(
    async (id: string, status: GoalStatus) => {
      await goalService.updateStatus(id, status);
      schedulePush();
    },
    [goalService, schedulePush],
  );

  const deleteGoal = useCallback(
    async (id: string) => {
      await goalService.softDelete(id);
      schedulePush();
    },
    [goalService, schedulePush],
  );

  const reorderGoals = useCallback(
    async (orderedGoals: Goal[]) => {
      await goalService.reorderGoals(orderedGoals);
      schedulePush();
    },
    [goalService, schedulePush],
  );

  const reloadGoals = useCallback(async () => {
    // liveQuery handles reactive updates automatically
  }, []);

  return {
    goals,
    isLoading,
    reloadGoals,
    createGoal,
    updateGoal,
    updateGoalStatus,
    deleteGoal,
    reorderGoals,
  };
}

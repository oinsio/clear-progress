import { liveQuery } from "dexie";
import { useCallback, useEffect, useState } from "react";
import { useSync } from "@/app/providers/SyncProvider";
import { useShowHidden } from "@/hooks/useShowHidden";
import { systemClock } from "@/lib/temporal";
import { defaultTaskService } from "@/services/defaultServices";
import type { TaskService } from "@/services/TaskService";
import type { Box } from "@/types/common";
import type { Task } from "@/types/entities";
import { getLogicalDate } from "@/utils/getLogicalDate";

import { getCachedDayBoundary } from "./useSettings";

export interface UseTasksReturn {
  tasks: Task[];
  isLoading: boolean;
  createTask: (name: string) => Promise<void>;
  completeTask: (id: string) => Promise<string | null>;
  deleteTask: (id: string) => Promise<void>;
  moveTask: (id: string, box: Box) => Promise<void>;
  updateTask: (id: string, changes: Partial<Task>) => Promise<void>;
  reorderTasks: (orderedTasks: Task[]) => Promise<void>;
  duplicateTask: (id: string) => Promise<Task>;
  reload: () => Promise<void>;
}

export function useTasks(
  box: Box,
  taskService: TaskService = defaultTaskService,
): UseTasksReturn {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { showHidden } = useShowHidden();
  const { schedulePush } = useSync();

  useEffect(() => {
    setIsLoading(true);
    const subscription = liveQuery(() => taskService.getByBox(box)).subscribe({
      next: (boxTasks) => {
        const filteredTasks = showHidden
          ? boxTasks
          : boxTasks.filter((task) => !task.is_hidden);
        setTasks(filteredTasks);
        setIsLoading(false);
      },
    });
    return () => subscription.unsubscribe();
  }, [box, taskService, showHidden]);

  const createTask = useCallback(
    async (name: string) => {
      await taskService.create({ name, box });
      schedulePush();
    },
    [taskService, box, schedulePush],
  );

  const completeTask = useCallback(
    async (id: string): Promise<string | null> => {
      const task = await taskService.getById(id);
      if (!task) return null;
      let recurringId: string | null = null;
      if (task.is_completed) {
        await taskService.noncomplete(id);
      } else {
        const logicalDate = getLogicalDate(systemClock, getCachedDayBoundary());
        const { recurring } = await taskService.complete(id, logicalDate);
        // Return ID only if the recurring copy is NOT hidden
        recurringId = recurring && !recurring.is_hidden ? recurring.id : null;
      }
      schedulePush();
      return recurringId;
    },
    [taskService, schedulePush],
  );

  const deleteTask = useCallback(
    async (id: string) => {
      await taskService.softDelete(id);
      schedulePush();
    },
    [taskService, schedulePush],
  );

  const moveTask = useCallback(
    async (id: string, targetBox: Box) => {
      await taskService.moveToBox(id, targetBox);
      schedulePush();
    },
    [taskService, schedulePush],
  );

  const updateTask = useCallback(
    async (id: string, changes: Partial<Task>) => {
      await taskService.update(id, changes);
      schedulePush();
    },
    [taskService, schedulePush],
  );

  const reorderTasks = useCallback(
    async (orderedTasks: Task[]) => {
      setTasks(orderedTasks);
      await taskService.reorderTasks(orderedTasks);
      schedulePush();
    },
    [taskService, schedulePush],
  );

  const duplicateTask = useCallback(
    async (id: string): Promise<Task> => {
      const newTask = await taskService.duplicate(id);
      schedulePush();
      return newTask;
    },
    [taskService, schedulePush],
  );

  const reload = useCallback(async () => {
    // liveQuery handles reactive updates automatically
  }, []);

  return {
    tasks,
    isLoading,
    createTask,
    completeTask,
    deleteTask,
    moveTask,
    updateTask,
    reorderTasks,
    duplicateTask,
    reload,
  };
}

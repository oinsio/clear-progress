import { useCallback, useEffect, useState } from "react";
import { systemClock } from "@/lib/temporal";
import { defaultTaskService } from "@/services/defaultServices";
import type { TaskService } from "@/services/TaskService";
import type { Box } from "@/types/common";
import type { Task } from "@/types/entities";
import { getLogicalDate } from "@/utils/getLogicalDate";

import { getCachedDayBoundary } from "./useSettings";

export interface UseTaskReturn {
  task: Task | undefined;
  isLoading: boolean;
  updateTask: (changes: Partial<Task>) => Promise<void>;
  completeTask: () => Promise<void>;
  deleteTask: () => Promise<void>;
  moveTask: (box: Box) => Promise<void>;
}

export function useTask(
  id: string,
  taskService: TaskService = defaultTaskService,
): UseTaskReturn {
  const [task, setTask] = useState<Task | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);

  const loadTask = useCallback(async () => {
    const foundTask = await taskService.getById(id);
    setTask(foundTask);
    setIsLoading(false);
  }, [taskService, id]);

  useEffect(() => {
    void loadTask();
  }, [loadTask]);

  const updateTask = useCallback(
    async (changes: Partial<Task>) => {
      if (!task) return;
      await taskService.update(task.id, changes);
      await loadTask();
    },
    [taskService, task, loadTask],
  );

  const completeTask = useCallback(async () => {
    if (!task) return;
    const logicalDate = getLogicalDate(systemClock, getCachedDayBoundary());
    await taskService.complete(task.id, logicalDate);
    await loadTask();
  }, [taskService, task, loadTask]);

  const deleteTask = useCallback(async () => {
    if (!task) return;
    await taskService.softDelete(task.id);
  }, [taskService, task]);

  const moveTask = useCallback(
    async (box: Box) => {
      if (!task) return;
      await taskService.moveToBox(task.id, box);
      await loadTask();
    },
    [taskService, task, loadTask],
  );

  return { task, isLoading, updateTask, completeTask, deleteTask, moveTask };
}

import { useState, useEffect, useCallback } from "react";
import { liveQuery } from "dexie";
import type { Task } from "@/types/entities";
import type { Box } from "@/types/common";
import { TaskService } from "@/services/TaskService";
import { defaultTaskService } from "@/services/defaultServices";
import { useSync } from "@/app/providers/SyncProvider";

export interface UseTasksReturn {
  tasks: Task[];
  isLoading: boolean;
  createTask: (title: string) => Promise<void>;
  completeTask: (id: string) => Promise<string | null>;
  deleteTask: (id: string) => Promise<void>;
  moveTask: (id: string, box: Box) => Promise<void>;
  updateTask: (id: string, changes: Partial<Task>) => Promise<void>;
  reorderTasks: (orderedTasks: Task[]) => Promise<void>;
  reload: () => Promise<void>;
}

export function useTasks(
  box: Box,
  taskService: TaskService = defaultTaskService,
): UseTasksReturn {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { schedulePush } = useSync();

  useEffect(() => {
    setIsLoading(true);
    const subscription = liveQuery(() => taskService.getByBox(box)).subscribe({
      next: (boxTasks) => {
        setTasks(boxTasks);
        setIsLoading(false);
      },
    });
    return () => subscription.unsubscribe();
  }, [box, taskService]);

  const createTask = useCallback(
    async (title: string) => {
      await taskService.create({ title, box });
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
        const { recurring } = await taskService.complete(id);
        recurringId = recurring?.id ?? null;
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

  const reload = useCallback(async () => {
    // liveQuery handles reactive updates automatically
  }, []);

  return { tasks, isLoading, createTask, completeTask, deleteTask, moveTask, updateTask, reorderTasks, reload };
}

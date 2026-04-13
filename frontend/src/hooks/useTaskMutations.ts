import { useMemo } from "react";
import type { Task } from "@/types/entities";
import type { Box } from "@/types/common";
import { TaskService } from "@/services/TaskService";
import { useSyncWrapper } from "./useMutationHelpers";

export interface UseTaskMutationsReturn {
  completeTask: (id: string) => Promise<string | null>;
  updateTask: (id: string, changes: Partial<Task>) => Promise<void>;
  moveTask: (id: string, box: Box) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  duplicateTask: (id: string) => Promise<Task>;
}

export function useTaskMutations(
  taskService: TaskService,
  onReload: () => Promise<void>,
): UseTaskMutationsReturn {
  const withSync = useSyncWrapper(onReload);

  return useMemo(
    () => ({
      completeTask: async (id: string): Promise<string | null> => {
        const task = await taskService.getById(id);
        if (!task) return null;

        return withSync(async () => {
          let recurringId: string | null = null;
          if (task.is_completed) {
            await taskService.noncomplete(id);
          } else {
            const { recurring } = await taskService.complete(id);
            // Возвращаем ID только если копия НЕ скрыта
            recurringId = recurring && !recurring.is_hidden ? recurring.id : null;
          }
          return recurringId;
        });
      },
      updateTask: async (id: string, changes: Partial<Task>) => {
        await withSync(() => taskService.update(id, changes));
      },
      moveTask: async (id: string, box: Box) => {
        await withSync(() => taskService.moveToBox(id, box));
      },
      deleteTask: async (id: string) => {
        await withSync(() => taskService.softDelete(id));
      },
      duplicateTask: async (id: string): Promise<Task> => {
        return withSync(() => taskService.duplicate(id), false);
      },
    }),
    [taskService, withSync],
  );
}

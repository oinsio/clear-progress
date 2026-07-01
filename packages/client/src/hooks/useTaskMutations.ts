import { useMemo } from "react";
import { useAlerts } from "@/app/providers/AlertProvider";
import { systemClock } from "@/lib/temporal";
import type { TaskService } from "@/services/TaskService";
import type { Box } from "@/types/common";
import type { Task } from "@/types/entities";
import { getLogicalDate } from "@/utils/getLogicalDate";
import { useSyncWrapper } from "./useMutationHelpers";
import { getCachedDayBoundary } from "./useSettings";

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
  const { addAlerts } = useAlerts();
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
            const logicalDate = getLogicalDate(
              systemClock,
              getCachedDayBoundary(),
            );
            const { recurringResult } = await taskService.complete(
              id,
              logicalDate,
            );
            if (recurringResult.status === "skipped_invalid_rule") {
              addAlerts([
                { type: "repeat_rule_invalid", taskNames: [task.name] },
              ]);
            }
            // Return ID only if the copy is NOT hidden
            recurringId =
              recurringResult.status === "created" &&
              !recurringResult.task.is_hidden
                ? recurringResult.task.id
                : null;
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
    [taskService, withSync, addAlerts],
  );
}

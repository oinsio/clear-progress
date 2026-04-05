import { useMemo } from "react";
import { TaskService } from "@/services/TaskService";
import { TaskRepository } from "@/db/repositories/TaskRepository";
import { ChecklistRepository } from "@/db/repositories/ChecklistRepository";
import { useFilteredTasks, type UseFilteredTasksReturn } from "./useFilteredTasks";

const defaultTaskService = new TaskService(new TaskRepository(), new ChecklistRepository());

export interface UseCategoryTasksReturn extends UseFilteredTasksReturn {}

export function useCategoryTasks(
  categoryId: string,
  taskService: TaskService = defaultTaskService,
): UseCategoryTasksReturn {
  const config = useMemo(
    () => ({
      queryFn: () => taskService.getByCategoryId(categoryId),
      createTaskData: { category_id: categoryId },
    }),
    [categoryId, taskService],
  );

  return useFilteredTasks(config, taskService);
}

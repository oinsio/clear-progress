import { useMemo } from "react";
import { BOX } from "@/constants";
import type { Task } from "@/types/entities";
import type { Box } from "@/types/common";

export function useTasksByBox(tasks: Task[]): Record<Box, Task[]> {
  return useMemo(() => {
    const grouped: Record<Box, Task[]> = {
      [BOX.INBOX]: [],
      [BOX.TODAY]: [],
      [BOX.WEEK]: [],
      [BOX.LATER]: [],
    };
    for (const task of tasks) {
      grouped[task.box].push(task);
    }
    return grouped;
  }, [tasks]);
}

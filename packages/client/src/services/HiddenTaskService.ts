import type { TaskRepository } from "@/db/repositories/TaskRepository";
import { type Clock, systemClock } from "@/lib/temporal";
import type { ISODate, Task } from "@/types/entities";

export class HiddenTaskService {
  constructor(
    private readonly taskRepository: TaskRepository,
    private readonly clock: Clock = systemClock,
  ) {}

  /**
   * Implements FR1 of fix-stale-sync-overwrites (preserves updated_at on reveal).
   * Implements FR4 of day-boundary (current-date resolution for reveal check).
   */
  async revealHiddenTasks(logicalDate?: ISODate): Promise<Task[]> {
    const currentDate = logicalDate ?? this.clock.plainDateISO().toString();
    const tasksToReveal =
      await this.taskRepository.getTasksToReveal(currentDate);

    if (tasksToReveal.length === 0) {
      return [];
    }

    const revealedTasks: Task[] = [];

    for (const task of tasksToReveal) {
      const updatedTask: Task = {
        ...task,
        is_hidden: false,
        syncStatus: "pending" as const,
      };

      await this.taskRepository.update(updatedTask);
      revealedTasks.push(updatedTask);
    }

    return revealedTasks;
  }
}

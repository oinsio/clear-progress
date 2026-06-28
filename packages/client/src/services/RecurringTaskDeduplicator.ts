import { RECORD_SYNC_STATUS } from "@/constants";
import type { ChecklistRepository } from "@/db/repositories/ChecklistRepository";
import type { TaskRepository } from "@/db/repositories/TaskRepository";
import { type Clock, systemClock } from "@/lib/temporal";
import type { Task } from "@/types/entities";
import { toISOTimestamp } from "@/utils/dateHelpers";

const MINIMUM_DUPLICATE_GROUP_SIZE = 2;

/**
 * Deduplicates recurring task copies after a pull batch.
 * Implements FR1, FR2, FR3, FR5 of dedup-recurring-after-pull.
 */
export class RecurringTaskDeduplicator {
  constructor(
    private readonly taskRepository: TaskRepository,
    private readonly checklistRepository: ChecklistRepository,
    private readonly clock: Clock = systemClock,
  ) {}

  /**
   * Deduplicates recurring copies for the given original_task_id values.
   * Implements FR1, FR2, FR3, FR5 of dedup-recurring-after-pull.
   *
   * @param originalTaskIds - original_task_id values from the pull batch
   */
  async deduplicate(originalTaskIds: string[]): Promise<void> {
    const uniqueNonEmptyIds = this.extractUniqueNonEmptyIds(originalTaskIds);

    if (uniqueNonEmptyIds.length === 0) {
      return;
    }

    const groups =
      await this.taskRepository.findDuplicateRecurringGroups(uniqueNonEmptyIds);

    for (const [, activeCopies] of groups) {
      if (activeCopies.length < MINIMUM_DUPLICATE_GROUP_SIZE) {
        continue;
      }

      const sortedCopies = this.sortByWinnerPriority(activeCopies);
      const [, ...losers] = sortedCopies;

      const now = toISOTimestamp(this.clock);

      for (const loser of losers) {
        await this.softDeleteTask(loser, now);
        await this.cascadeSoftDeleteChecklistItems(loser.id, now);
      }
    }
  }

  private extractUniqueNonEmptyIds(originalTaskIds: string[]): string[] {
    return [...new Set(originalTaskIds.filter((id) => id !== ""))];
  }

  private sortByWinnerPriority(tasks: Task[]): Task[] {
    return [...tasks].sort((taskA, taskB) => {
      const dateComparison = taskA.next_date.localeCompare(taskB.next_date);
      if (dateComparison !== 0) {
        return dateComparison;
      }
      return taskA.id.localeCompare(taskB.id);
    });
  }

  private async softDeleteTask(task: Task, timestamp: string): Promise<void> {
    const deletedTask: Task = {
      ...task,
      is_deleted: true,
      syncStatus: RECORD_SYNC_STATUS.PENDING,
      updated_at: timestamp,
    };
    await this.taskRepository.update(deletedTask);
  }

  private async cascadeSoftDeleteChecklistItems(
    taskId: string,
    timestamp: string,
  ): Promise<void> {
    const checklistItems =
      await this.checklistRepository.getAllByTaskId(taskId);

    for (const item of checklistItems) {
      const deletedItem = {
        ...item,
        is_deleted: true,
        syncStatus: RECORD_SYNC_STATUS.PENDING as typeof item.syncStatus,
        updated_at: timestamp,
      };
      await this.checklistRepository.update(deletedItem);
    }
  }
}

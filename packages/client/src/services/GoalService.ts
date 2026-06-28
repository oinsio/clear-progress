import { GOAL_STATUS_SORT_ORDER } from "@/constants";
import type { AttachmentRepository } from "@/db/repositories/AttachmentRepository";
import type { GoalRepository } from "@/db/repositories/GoalRepository";
import {
  compareSortKeys,
  generateAppendKey,
  needsRebalancing,
  rebalanceKeys,
} from "@/services/SortOrderService";
import type { GoalStatus } from "@/types/common";
import type { Goal } from "@/types/entities";
import { toISOTimestamp } from "@/utils/dateHelpers";
import { hasEntityChanged } from "@/utils/deepEqual";

export class GoalService {
  constructor(
    private readonly goalRepository: GoalRepository,
    private readonly attachmentRepository?: AttachmentRepository,
  ) {}

  async getAll(): Promise<Goal[]> {
    const goals = await this.goalRepository.getActive();
    return goals.sort((goalA, goalB) =>
      compareSortKeys(String(goalA.sort_order), String(goalB.sort_order)),
    );
  }

  async getById(id: string): Promise<Goal | undefined> {
    return this.goalRepository.getById(id);
  }

  async create(partialGoal: Pick<Goal, "name"> & Partial<Goal>): Promise<Goal> {
    const existingGoals = await this.goalRepository.getActive();
    const existingKeys = existingGoals.map((goal) => String(goal.sort_order));
    const now = toISOTimestamp();
    const goal: Goal = {
      description: "",
      cover_hash: "",
      status: "planning",
      sort_order: generateAppendKey(existingKeys),
      ...partialGoal,
      id: crypto.randomUUID(),
      is_deleted: false,
      created_at: now,
      updated_at: now,
      revision: 0,
      syncStatus: "pending" as const,
    };
    await this.goalRepository.create(goal);
    return goal;
  }

  async update(id: string, changes: Partial<Goal>): Promise<Goal> {
    const existingGoal = await this.goalRepository.getById(id);
    if (!existingGoal) {
      throw new Error(`Goal not found: ${id}`);
    }

    // Build the updated version without modifying metadata
    const candidateGoal: Goal = {
      ...existingGoal,
      ...changes,
      id,
    };

    // Check whether anything actually changed
    const hasChanged = hasEntityChanged(existingGoal, candidateGoal);

    // Apply metadata only if there are changes
    const updatedGoal: Goal = {
      ...candidateGoal,
      updated_at: hasChanged ? toISOTimestamp() : existingGoal.updated_at,
      syncStatus: hasChanged ? ("pending" as const) : ("synced" as const),
    };

    await this.goalRepository.update(updatedGoal);
    return updatedGoal;
  }

  async updateStatus(id: string, status: GoalStatus): Promise<Goal> {
    return this.update(id, { status });
  }

  /** Implements FR14 of add-file-attachments */
  async softDelete(id: string): Promise<Goal> {
    if (this.attachmentRepository) {
      await this.attachmentRepository.softDeleteByEntityTypeAndId("goal", id);
    }
    return this.update(id, { is_deleted: true });
  }

  /** Implements FR15 of add-file-attachments */
  async restore(id: string): Promise<Goal> {
    if (this.attachmentRepository) {
      await this.attachmentRepository.restoreByEntityTypeAndId("goal", id);
    }
    return this.update(id, { is_deleted: false });
  }

  async searchByName(query: string): Promise<Goal[]> {
    const allGoals = await this.goalRepository.getActive();
    const lowerQuery = query.toLowerCase();
    const matchingGoals = allGoals.filter(
      (goal) =>
        goal.name.toLowerCase().includes(lowerQuery) ||
        goal.description.toLowerCase().includes(lowerQuery),
    );
    return matchingGoals.sort((goalA, goalB) => {
      const priorityA = GOAL_STATUS_SORT_ORDER[goalA.status];
      const priorityB = GOAL_STATUS_SORT_ORDER[goalB.status];

      if (priorityA !== priorityB) {
        return priorityA - priorityB;
      }

      return goalB.updated_at > goalA.updated_at ? 1 : -1;
    });
  }

  async reorderGoals(goalId: string, newSortOrder: string): Promise<void> {
    const goal = await this.goalRepository.getById(goalId);
    if (!goal) throw new Error(`Goal not found: ${goalId}`);

    const now = toISOTimestamp();
    await this.goalRepository.update({
      ...goal,
      sort_order: newSortOrder,
      updated_at: now,
      syncStatus: "pending" as const,
    });

    if (needsRebalancing(newSortOrder)) {
      await this.rebalanceAllGoals();
    }
  }

  private async rebalanceAllGoals(): Promise<void> {
    const goals = await this.goalRepository.getActive();
    const sorted = goals.sort((goalA, goalB) =>
      compareSortKeys(String(goalA.sort_order), String(goalB.sort_order)),
    );
    const newKeys = rebalanceKeys(sorted.length);
    const now = toISOTimestamp();
    const rebalancedGoals = sorted.map((goal, index) => ({
      ...goal,
      sort_order: newKeys[index],
      updated_at: now,
      syncStatus: "pending" as const,
    }));
    await this.goalRepository.bulkUpsert(rebalancedGoals);
  }
}

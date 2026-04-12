import type { Goal } from "@/types/entities";
import type { GoalStatus } from "@/types/common";
import { GoalRepository } from "@/db/repositories/GoalRepository";
import { GOAL_STATUS_SORT_ORDER } from "@/constants";

export class GoalService {
  constructor(private readonly goalRepository: GoalRepository) {}

  async getAll(): Promise<Goal[]> {
    const goals = await this.goalRepository.getActive();
    return goals.sort((goalA, goalB) => goalA.sort_order - goalB.sort_order);
  }

  async getById(id: string): Promise<Goal | undefined> {
    return this.goalRepository.getById(id);
  }

  async create(
    partialGoal: Pick<Goal, "name"> & Partial<Goal>,
  ): Promise<Goal> {
    const existingGoals = await this.goalRepository.getActive();
    const now = new Date().toISOString();
    const goal: Goal = {
      description: "",
      cover_file_id: "",
      status: "planning",
      sort_order: existingGoals.length,
      ...partialGoal,
      id: crypto.randomUUID(),
      is_deleted: false,
      created_at: now,
      updated_at: now,
      version: 1,
      revision: 0,
      _dirty: true,
    };
    await this.goalRepository.create(goal);
    return goal;
  }

  async update(id: string, changes: Partial<Goal>): Promise<Goal> {
    const existingGoal = await this.goalRepository.getById(id);
    if (!existingGoal) {
      throw new Error(`Goal not found: ${id}`);
    }
    const updatedGoal: Goal = {
      ...existingGoal,
      ...changes,
      id,
      updated_at: new Date().toISOString(),
      version: existingGoal.version + 1,
      _dirty: true,
    };
    await this.goalRepository.update(updatedGoal);
    return updatedGoal;
  }

  async updateStatus(id: string, status: GoalStatus): Promise<Goal> {
    return this.update(id, { status });
  }

  async softDelete(id: string): Promise<Goal> {
    return this.update(id, { is_deleted: true });
  }

  async restore(id: string): Promise<Goal> {
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

      return goalB.updated_at.localeCompare(goalA.updated_at);
    });
  }

  async reorderGoals(orderedGoals: Goal[]): Promise<void> {
    if (orderedGoals.length === 0) return;
    const now = new Date().toISOString();
    const updatedGoals = orderedGoals.map((goal, index) => ({
      ...goal,
      sort_order: index,
      updated_at: now,
      version: goal.version + 1,
      _dirty: true,
    }));
    await this.goalRepository.bulkUpsert(updatedGoals);
  }
}

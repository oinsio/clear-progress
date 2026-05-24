import { expect } from "vitest";
import { db } from "@/db/database";
import { GoalRepository } from "@/db/repositories/GoalRepository";
import { GoalService } from "@/services/GoalService";
import { buildGoal } from "@/test/factories/goalFactory";
import { getIdOrThrow } from "@/test/helpers/getIdOrThrow";
import type { Goal, Task } from "@/types/entities";

export function createScenarioContext() {
  const goalIds = new Map<string, string>();
  let goalService: GoalService;

  const reset = async () => {
    await db.goals.clear();
    await db.tasks.clear();
    goalIds.clear();
    goalService = new GoalService(new GoalRepository());
  };

  return {
    goalIds,
    get goalService() {
      return goalService;
    },
    reset,
  };
}

export async function seedGoal(
  goalIds: Map<string, string>,
  name: string,
  overrides: Partial<Goal> = {},
) {
  const goalId = crypto.randomUUID();
  goalIds.set(name, goalId);
  await db.goals.add(buildGoal({ id: goalId, ...overrides }));
  return goalId;
}

export async function getGoal(
  goalIds: Map<string, string>,
  name: string,
): Promise<Goal> {
  return (await db.goals.get(getIdOrThrow(goalIds, name))) as Goal;
}

export async function seedGoalsWithOrder(
  goalIds: Map<string, string>,
  names: string[],
) {
  for (let i = 0; i < names.length; i++) {
    await seedGoal(goalIds, names[i], {
      sort_order: i,
      needsSync: false,
    });
  }
}

export function sortCompletedTasks(tasks: Task[]): Task[] {
  return tasks
    .filter((task) => task.is_completed)
    .sort((taskA, taskB) => {
      if (taskA.completed_at && taskB.completed_at) {
        return taskB.completed_at > taskA.completed_at ? 1 : -1;
      }
      return taskB.sort_order - taskA.sort_order;
    });
}

export async function expectGoalSortOrder(
  goalIds: Map<string, string>,
  name: string,
  expectedOrder: number,
) {
  const goal = await getGoal(goalIds, name);
  expect(goal.sort_order).toBe(expectedOrder);
}

export async function expectGoalNeedsSync(
  goalIds: Map<string, string>,
  name: string,
  expectedNeedsSync: boolean,
) {
  const goal = await getGoal(goalIds, name);
  expect(goal.needsSync).toBe(expectedNeedsSync);
}

export function expectTaskOrder(
  tasks: Task[],
  expectedFirst: string,
  expectedSecond: string,
) {
  expect(tasks[0].name).toBe(expectedFirst);
  expect(tasks[1].name).toBe(expectedSecond);
}

import { renderHook, waitFor } from "@testing-library/react";
import { expect, vi } from "vitest";
import { db } from "@/db/database";
import { ChecklistRepository } from "@/db/repositories/ChecklistRepository";
import { GoalRepository } from "@/db/repositories/GoalRepository";
import { TaskRepository } from "@/db/repositories/TaskRepository";
import { GoalService } from "@/services/GoalService";
import { TaskService } from "@/services/TaskService";
import type { buildGoal } from "@/test/factories/goalFactory";
import { useGoal } from "./useGoal";

export const mockSchedulePush = vi.fn();

export const goalService = new GoalService(new GoalRepository());
export const taskService = new TaskService(
  new TaskRepository(),
  new ChecklistRepository(),
);

export async function renderGoalHook(goal: ReturnType<typeof buildGoal>) {
  await db.goals.add(goal);
  const { result } = renderHook(() =>
    useGoal(goal.id, goalService, taskService),
  );
  await waitFor(() => expect(result.current.goal).toBeDefined());
  return result;
}

export async function clearDatabase() {
  await db.goals.clear();
  await db.tasks.clear();
  await db.checklist_items.clear();
  mockSchedulePush.mockClear();
}

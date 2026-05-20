import { expect, vi } from "vitest";
import { createMockEntity } from "../../../tests/server/helpers";
import {
  deleteCategoriesByIds,
  getAllCategories,
} from "../sheets/categories.sheet";
import {
  deleteChecklistItemsByIds,
  getAllChecklistItems,
} from "../sheets/checklists.sheet";
import { deleteContextsByIds, getAllContexts } from "../sheets/contexts.sheet";
import { deleteGoalsByIds, getAllGoals } from "../sheets/goals.sheet";
import { deleteIdeasByIds, getAllIdeas } from "../sheets/ideas.sheet";
import { readPurgeRevision, savePurgeRevision } from "../sheets/meta.sheet";
import { deleteTasksByIds, getAllTasks } from "../sheets/tasks.sheet";

export {
  deleteCategoriesByIds,
  deleteChecklistItemsByIds,
  deleteContextsByIds,
  deleteGoalsByIds,
  deleteIdeasByIds,
  deleteTasksByIds,
  getAllCategories,
  getAllChecklistItems,
  getAllContexts,
  getAllGoals,
  getAllIdeas,
  getAllTasks,
};

export function resetAllMocks(): void {
  vi.clearAllMocks();
  vi.mocked(getAllTasks).mockReturnValue([]);
  vi.mocked(getAllGoals).mockReturnValue([]);
  vi.mocked(getAllContexts).mockReturnValue([]);
  vi.mocked(getAllCategories).mockReturnValue([]);
  vi.mocked(getAllChecklistItems).mockReturnValue([]);
  vi.mocked(getAllIdeas).mockReturnValue([]);
  vi.mocked(deleteTasksByIds).mockReturnValue(0);
  vi.mocked(deleteGoalsByIds).mockReturnValue(0);
  vi.mocked(deleteContextsByIds).mockReturnValue(0);
  vi.mocked(deleteCategoriesByIds).mockReturnValue(0);
  vi.mocked(deleteChecklistItemsByIds).mockReturnValue(0);
  vi.mocked(deleteIdeasByIds).mockReturnValue(0);
  vi.mocked(readPurgeRevision).mockReturnValue(0);
  vi.mocked(savePurgeRevision).mockReturnValue(undefined);
}

export function setupAllEntitiesWithOneDeleted(): void {
  vi.mocked(getAllTasks).mockReturnValue([createMockEntity("task1", true)]);
  vi.mocked(getAllGoals).mockReturnValue([createMockEntity("goal1", true)]);
  vi.mocked(getAllContexts).mockReturnValue([
    createMockEntity("context1", true),
  ]);
  vi.mocked(getAllCategories).mockReturnValue([
    createMockEntity("category1", true),
  ]);
  vi.mocked(getAllChecklistItems).mockReturnValue([
    createMockEntity("checklist1", true),
  ]);
  vi.mocked(getAllIdeas).mockReturnValue([createMockEntity("idea1", true)]);
  vi.mocked(deleteTasksByIds).mockReturnValue(1);
  vi.mocked(deleteGoalsByIds).mockReturnValue(1);
  vi.mocked(deleteContextsByIds).mockReturnValue(1);
  vi.mocked(deleteCategoriesByIds).mockReturnValue(1);
  vi.mocked(deleteChecklistItemsByIds).mockReturnValue(1);
  vi.mocked(deleteIdeasByIds).mockReturnValue(1);
}

export function expectAllDeleteCallsWithIds(
  ids: Record<string, string[]>,
): void {
  expect(deleteTasksByIds).toHaveBeenCalledWith(ids.tasks || []);
  expect(deleteGoalsByIds).toHaveBeenCalledWith(ids.goals || []);
  expect(deleteContextsByIds).toHaveBeenCalledWith(ids.contexts || []);
  expect(deleteCategoriesByIds).toHaveBeenCalledWith(ids.categories || []);
  expect(deleteChecklistItemsByIds).toHaveBeenCalledWith(
    ids.checklistItems || [],
  );
  expect(deleteIdeasByIds).toHaveBeenCalledWith(ids.ideas || []);
}

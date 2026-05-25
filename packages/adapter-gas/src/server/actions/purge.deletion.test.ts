import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createMockEntity,
  expectInternalError,
  expectSuccessResponse,
} from "../../../tests/server/helpers";

vi.mock("../sheets/tasks.sheet");
vi.mock("../sheets/goals.sheet");
vi.mock("../sheets/contexts.sheet");
vi.mock("../sheets/categories.sheet");
vi.mock("../sheets/checklists.sheet");
vi.mock("../sheets/ideas.sheet");
vi.mock("../sheets/meta.sheet");

import { purge } from "./purge";
import {
  deleteCategoriesByIds,
  deleteChecklistItemsByIds,
  deleteContextsByIds,
  deleteGoalsByIds,
  deleteIdeasByIds,
  deleteTasksByIds,
  expectAllDeleteCallsWithIds,
  getAllCategories,
  getAllChecklistItems,
  getAllContexts,
  getAllGoals,
  getAllIdeas,
  getAllTasks,
  readPurgeRevision,
  resetAllMocks,
  savePurgeRevision,
  setupAllEntitiesWithOneDeleted,
} from "./purge-test-utils";

describe("purge — deletion", () => {
  beforeEach(() => {
    resetAllMocks();
  });

  it("should delete soft-deleted tasks and return correct count", () => {
    vi.mocked(getAllTasks).mockReturnValue([
      createMockEntity("task-1", true),
      createMockEntity("task-2", false),
    ]);
    vi.mocked(deleteTasksByIds).mockReturnValue(1);

    purge({ confirm: true });
    const response = expectSuccessResponse();

    expect(deleteTasksByIds).toHaveBeenCalledWith(["task-1"]);
    expect(response.purged).toMatchObject({ tasks: 1 });
  });

  it("should not delete records where is_deleted is false", () => {
    vi.mocked(getAllTasks).mockReturnValue([
      createMockEntity("task-1", false),
      createMockEntity("task-2", false),
    ]);

    purge({ confirm: true });

    expect(deleteTasksByIds).toHaveBeenCalledWith([]);
  });

  it("should delete soft-deleted goals and return correct count", () => {
    vi.mocked(getAllGoals).mockReturnValue([
      createMockEntity("goal-1", true),
      createMockEntity("goal-2", false),
    ]);
    vi.mocked(deleteGoalsByIds).mockReturnValue(1);

    purge({ confirm: true });
    const response = expectSuccessResponse();

    expect(deleteGoalsByIds).toHaveBeenCalledWith(["goal-1"]);
    expect(response.purged).toMatchObject({ goals: 1 });
  });

  it("should delete only soft-deleted contexts and exclude active ones", () => {
    vi.mocked(getAllContexts).mockReturnValue([
      createMockEntity("ctx-1", true),
      createMockEntity("ctx-2", false),
    ]);
    vi.mocked(deleteContextsByIds).mockReturnValue(1);

    purge({ confirm: true });
    const response = expectSuccessResponse();

    expect(deleteContextsByIds).toHaveBeenCalledWith(["ctx-1"]);
    expect(response.purged).toMatchObject({ contexts: 1 });
  });

  it("should delete only soft-deleted categories and exclude active ones", () => {
    vi.mocked(getAllCategories).mockReturnValue([
      createMockEntity("cat-1", true),
      createMockEntity("cat-2", false),
    ]);
    vi.mocked(deleteCategoriesByIds).mockReturnValue(1);

    purge({ confirm: true });
    const response = expectSuccessResponse();

    expect(deleteCategoriesByIds).toHaveBeenCalledWith(["cat-1"]);
    expect(response.purged).toMatchObject({ categories: 1 });
  });

  it("should delete only soft-deleted checklist items and exclude active ones", () => {
    vi.mocked(getAllChecklistItems).mockReturnValue([
      createMockEntity("cl-1", true),
      createMockEntity("cl-2", false),
    ]);
    vi.mocked(deleteChecklistItemsByIds).mockReturnValue(1);

    purge({ confirm: true });
    const response = expectSuccessResponse();

    expect(deleteChecklistItemsByIds).toHaveBeenCalledWith(["cl-1"]);
    expect(response.purged).toMatchObject({ checklist_items: 1 });
  });

  it("should delete only soft-deleted ideas and exclude active ones", () => {
    vi.mocked(getAllIdeas).mockReturnValue([
      createMockEntity("idea-1", true),
      createMockEntity("idea-2", false),
    ]);
    vi.mocked(deleteIdeasByIds).mockReturnValue(1);

    purge({ confirm: true });
    const response = expectSuccessResponse();

    expect(deleteIdeasByIds).toHaveBeenCalledWith(["idea-1"]);
    expect(response.purged).toMatchObject({ ideas: 1 });
  });

  it("should return INTERNAL_ERROR when a sheet operation throws", () => {
    vi.mocked(getAllTasks).mockImplementation(() => {
      throw new Error("Sheet error");
    });

    purge({ confirm: true });
    expectInternalError();
  });

  it("should increment purge_revision after successful purge", () => {
    vi.mocked(readPurgeRevision).mockReturnValue(2);
    setupAllEntitiesWithOneDeleted();

    purge({ confirm: true });
    const response = expectSuccessResponse();

    expect(savePurgeRevision).toHaveBeenCalledWith(3);
    expect(response.purge_revision).toBe(3);
  });

  it("should increment purge_revision even with no soft-deleted records", () => {
    vi.mocked(readPurgeRevision).mockReturnValue(5);

    purge({ confirm: true });
    const response = expectSuccessResponse();

    expect(savePurgeRevision).toHaveBeenCalledWith(6);
    expect(response.purge_revision).toBe(6);
  });

  it("should delete soft-deleted records for all entity types", () => {
    setupAllEntitiesWithOneDeleted();

    purge({ confirm: true });
    const response = expectSuccessResponse();

    expectAllDeleteCallsWithIds({
      tasks: ["task1"],
      goals: ["goal1"],
      contexts: ["context1"],
      categories: ["category1"],
      checklistItems: ["checklist1"],
      ideas: ["idea1"],
    });
    expect(response.purged).toEqual({
      tasks: 1,
      goals: 1,
      contexts: 1,
      categories: 1,
      checklist_items: 1,
      ideas: 1,
    });
  });
});

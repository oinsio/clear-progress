import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createMockEntity,
  expectInternalError,
  expectInvalidPayloadError,
  expectSuccessResponse,
} from "../../tests/helpers";
import { purge } from "./purge";

vi.mock("../sheets/tasks.sheet");
vi.mock("../sheets/goals.sheet");
vi.mock("../sheets/contexts.sheet");
vi.mock("../sheets/categories.sheet");
vi.mock("../sheets/checklists.sheet");
vi.mock("../sheets/ideas.sheet");
vi.mock("../sheets/meta.sheet");

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

function resetAllMocks() {
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

function setupAllEntitiesWithOneDeleted() {
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

function expectAllDeleteCallsWithIds(ids: Record<string, string[]>) {
  expect(deleteTasksByIds).toHaveBeenCalledWith(ids.tasks || []);
  expect(deleteGoalsByIds).toHaveBeenCalledWith(ids.goals || []);
  expect(deleteContextsByIds).toHaveBeenCalledWith(ids.contexts || []);
  expect(deleteCategoriesByIds).toHaveBeenCalledWith(ids.categories || []);
  expect(deleteChecklistItemsByIds).toHaveBeenCalledWith(
    ids.checklistItems || [],
  );
  expect(deleteIdeasByIds).toHaveBeenCalledWith(ids.ideas || []);
}

describe("purge", () => {
  beforeEach(() => {
    resetAllMocks();
  });

  it("should return error when confirm is missing", () => {
    purge({});
    expectInvalidPayloadError();
  });

  it("should return error when confirm is false", () => {
    purge({ confirm: false });
    expectInvalidPayloadError();
  });

  it("should return error when payload is null", () => {
    purge(null as never);
    expectInvalidPayloadError();
  });

  it("should return error when payload is undefined", () => {
    purge(undefined as never);
    expectInvalidPayloadError();
  });

  it.each([
    1,
    "true",
    {},
    [],
  ])("should return error when confirm is %s (truthy but not true)", (value) => {
    purge({ confirm: value });
    expectInvalidPayloadError();
  });

  it("should return zeros when no soft-deleted records exist", () => {
    purge({ confirm: true });
    const response = expectSuccessResponse();
    expect(response.purged).toEqual({
      tasks: 0,
      goals: 0,
      contexts: 0,
      categories: 0,
      checklist_items: 0,
      ideas: 0,
    });
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

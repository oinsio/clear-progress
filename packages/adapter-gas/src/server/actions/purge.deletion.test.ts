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
vi.mock("../sheets/attachments.sheet");
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

type MockGetAll = ReturnType<typeof vi.fn>;
type MockDeleteByIds = ReturnType<typeof vi.fn>;

interface EntityDeletionTestCase {
  entityLabel: string;
  deletedId: string;
  activeId: string;
  purgedKey: string;
  getGetAllMock: () => MockGetAll;
  getDeleteByIdsMock: () => MockDeleteByIds;
}

const entityDeletionCases: EntityDeletionTestCase[] = [
  {
    entityLabel: "tasks",
    deletedId: "task-1",
    activeId: "task-2",
    purgedKey: "tasks",
    getGetAllMock: () => vi.mocked(getAllTasks),
    getDeleteByIdsMock: () => vi.mocked(deleteTasksByIds),
  },
  {
    entityLabel: "goals",
    deletedId: "goal-1",
    activeId: "goal-2",
    purgedKey: "goals",
    getGetAllMock: () => vi.mocked(getAllGoals),
    getDeleteByIdsMock: () => vi.mocked(deleteGoalsByIds),
  },
  {
    entityLabel: "contexts",
    deletedId: "ctx-1",
    activeId: "ctx-2",
    purgedKey: "contexts",
    getGetAllMock: () => vi.mocked(getAllContexts),
    getDeleteByIdsMock: () => vi.mocked(deleteContextsByIds),
  },
  {
    entityLabel: "categories",
    deletedId: "cat-1",
    activeId: "cat-2",
    purgedKey: "categories",
    getGetAllMock: () => vi.mocked(getAllCategories),
    getDeleteByIdsMock: () => vi.mocked(deleteCategoriesByIds),
  },
  {
    entityLabel: "checklist items",
    deletedId: "cl-1",
    activeId: "cl-2",
    purgedKey: "checklist_items",
    getGetAllMock: () => vi.mocked(getAllChecklistItems),
    getDeleteByIdsMock: () => vi.mocked(deleteChecklistItemsByIds),
  },
  {
    entityLabel: "ideas",
    deletedId: "idea-1",
    activeId: "idea-2",
    purgedKey: "ideas",
    getGetAllMock: () => vi.mocked(getAllIdeas),
    getDeleteByIdsMock: () => vi.mocked(deleteIdeasByIds),
  },
];

describe("purge — deletion", () => {
  beforeEach(() => {
    resetAllMocks();
  });

  it.each(
    entityDeletionCases,
  )("should delete soft-deleted $entityLabel and return correct count", ({
    deletedId,
    activeId,
    purgedKey,
    getGetAllMock,
    getDeleteByIdsMock,
  }) => {
    getGetAllMock().mockReturnValue([
      createMockEntity(deletedId, true),
      createMockEntity(activeId, false),
    ]);
    getDeleteByIdsMock().mockReturnValue(1);

    purge({ confirm: true });
    const response = expectSuccessResponse();

    expect(getDeleteByIdsMock()).toHaveBeenCalledWith([deletedId]);
    expect(response.purged).toMatchObject({ [purgedKey]: 1 });
  });

  it("should not delete records where is_deleted is false", () => {
    vi.mocked(getAllTasks).mockReturnValue([
      createMockEntity("task-1", false),
      createMockEntity("task-2", false),
    ]);

    purge({ confirm: true });

    expect(deleteTasksByIds).toHaveBeenCalledWith([]);
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
      attachments: ["attachment1"],
    });
    expect(response.purged).toEqual({
      tasks: 1,
      goals: 1,
      contexts: 1,
      categories: 1,
      checklist_items: 1,
      ideas: 1,
      attachments: 1,
      files: 0,
    });
  });
});

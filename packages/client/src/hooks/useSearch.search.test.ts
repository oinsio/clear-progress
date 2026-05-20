import { act } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  buildGoal,
  buildIdea,
  buildTask,
  createMockGoalService,
  createMockIdeaService,
  createMockTaskService,
  createSearchMocks,
  renderUseSearch,
  type SearchMocks,
} from "./useSearch.test-utils";

describe("useSearch — search", () => {
  let mocks: SearchMocks;

  beforeEach(() => {
    mocks = createSearchMocks();
  });

  it("should return matching tasks when search is called with a query", async () => {
    const tasks = [buildTask({ name: "Buy groceries" })];
    mocks.mockTaskService = createMockTaskService({
      searchByName: vi.fn().mockResolvedValue(tasks),
    });
    const { result } = renderUseSearch(mocks);

    await act(async () => {
      await result.current.search("buy");
    });

    expect(result.current.tasks).toEqual(tasks);
  });

  it("should return matching goals when search is called with a query", async () => {
    const goals = [buildGoal({ name: "Learn piano" })];
    mocks.mockGoalService = createMockGoalService({
      searchByName: vi.fn().mockResolvedValue(goals),
    });
    const { result } = renderUseSearch(mocks);

    await act(async () => {
      await result.current.search("piano");
    });

    expect(result.current.goals).toEqual(goals);
  });

  it("should search tasks and goals simultaneously", async () => {
    const tasks = [buildTask({ name: "Buy groceries" })];
    const goals = [buildGoal({ name: "Buy a house" })];
    mocks.mockTaskService = createMockTaskService({
      searchByName: vi.fn().mockResolvedValue(tasks),
    });
    mocks.mockGoalService = createMockGoalService({
      searchByName: vi.fn().mockResolvedValue(goals),
    });
    const { result } = renderUseSearch(mocks);

    await act(async () => {
      await result.current.search("buy");
    });

    expect(result.current.tasks).toEqual(tasks);
    expect(result.current.goals).toEqual(goals);
  });

  it("should call taskService.searchByName with the query", async () => {
    const { result } = renderUseSearch(mocks);

    await act(async () => {
      await result.current.search("meeting");
    });

    expect(mocks.mockTaskService.searchByName).toHaveBeenCalledWith("meeting");
  });

  it("should call goalService.searchByName with the query", async () => {
    const { result } = renderUseSearch(mocks);

    await act(async () => {
      await result.current.search("meeting");
    });

    expect(mocks.mockGoalService.searchByName).toHaveBeenCalledWith("meeting");
  });

  it("should return empty tasks and goals when query is empty string", async () => {
    const { result } = renderUseSearch(mocks);

    await act(async () => {
      await result.current.search("");
    });

    expect(result.current.tasks).toEqual([]);
    expect(result.current.goals).toEqual([]);
    expect(mocks.mockTaskService.searchByName).not.toHaveBeenCalled();
    expect(mocks.mockGoalService.searchByName).not.toHaveBeenCalled();
  });

  it("should set isSearching to false after search completes", async () => {
    const { result } = renderUseSearch(mocks);

    await act(async () => {
      await result.current.search("query");
    });

    expect(result.current.isSearching).toBe(false);
  });

  it("should update results on subsequent searches", async () => {
    const firstTasks = [buildTask({ name: "First task" })];
    const secondTasks = [
      buildTask({ name: "Second task A" }),
      buildTask({ name: "Second task B" }),
    ];
    const mockSearchByName = vi
      .fn()
      .mockResolvedValueOnce(firstTasks)
      .mockResolvedValueOnce(secondTasks);
    mocks.mockTaskService = createMockTaskService({
      searchByName: mockSearchByName,
    });
    const { result } = renderUseSearch(mocks);

    await act(async () => {
      await result.current.search("first");
    });
    expect(result.current.tasks).toEqual(firstTasks);

    await act(async () => {
      await result.current.search("second");
    });
    expect(result.current.tasks).toEqual(secondTasks);
  });

  it("should return matching ideas when search is called with a query", async () => {
    const ideas = [buildIdea({ name: "Learn piano" })];
    mocks.mockIdeaService = createMockIdeaService({
      searchByName: vi.fn().mockResolvedValue(ideas),
    });
    const { result } = renderUseSearch(mocks);

    await act(async () => {
      await result.current.search("piano");
    });

    expect(result.current.ideas).toEqual(ideas);
  });

  it("should search tasks, goals and ideas simultaneously", async () => {
    const tasks = [buildTask({ name: "Buy groceries" })];
    const goals = [buildGoal({ name: "Buy a house" })];
    const ideas = [buildIdea({ name: "Buy a car" })];
    mocks.mockTaskService = createMockTaskService({
      searchByName: vi.fn().mockResolvedValue(tasks),
    });
    mocks.mockGoalService = createMockGoalService({
      searchByName: vi.fn().mockResolvedValue(goals),
    });
    mocks.mockIdeaService = createMockIdeaService({
      searchByName: vi.fn().mockResolvedValue(ideas),
    });
    const { result } = renderUseSearch(mocks);

    await act(async () => {
      await result.current.search("buy");
    });

    expect(result.current.tasks).toEqual(tasks);
    expect(result.current.goals).toEqual(goals);
    expect(result.current.ideas).toEqual(ideas);
  });

  it("should call ideaService.searchByName with the query", async () => {
    const { result } = renderUseSearch(mocks);

    await act(async () => {
      await result.current.search("meeting");
    });

    expect(mocks.mockIdeaService.searchByName).toHaveBeenCalledWith("meeting");
  });

  it("should not call ideaService.searchByName when query is empty", async () => {
    const { result } = renderUseSearch(mocks);

    await act(async () => {
      await result.current.search("");
    });

    expect(mocks.mockIdeaService.searchByName).not.toHaveBeenCalled();
  });
});

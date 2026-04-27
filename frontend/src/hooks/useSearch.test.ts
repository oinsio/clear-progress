import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { GoalService } from "@/services/GoalService";
import type { IdeaService } from "@/services/IdeaService";
import type { TaskService } from "@/services/TaskService";
import { buildGoal } from "@/test/factories/goalFactory";
import { buildIdea } from "@/test/factories/ideaFactory";
import { buildTask } from "@/test/factories/taskFactory";
import { createMockGoalService } from "@/test/mocks/goalServiceMock";
import { createMockIdeaService } from "@/test/mocks/ideaServiceMock";
import { createMockTaskService } from "@/test/mocks/taskServiceMock";
import { useSearch } from "./useSearch";

describe("useSearch", () => {
  let mockTaskService: TaskService;
  let mockGoalService: GoalService;
  let mockIdeaService: IdeaService;

  beforeEach(() => {
    mockTaskService = createMockTaskService();
    mockGoalService = createMockGoalService();
    mockIdeaService = createMockIdeaService();
  });

  it("should return empty tasks on initial render", () => {
    const { result } = renderHook(() =>
      useSearch(mockTaskService, mockGoalService, mockIdeaService),
    );
    expect(result.current.tasks).toEqual([]);
  });

  it("should return empty goals on initial render", () => {
    const { result } = renderHook(() =>
      useSearch(mockTaskService, mockGoalService, mockIdeaService),
    );
    expect(result.current.goals).toEqual([]);
  });

  it("should not be searching on initial render", () => {
    const { result } = renderHook(() =>
      useSearch(mockTaskService, mockGoalService, mockIdeaService),
    );
    expect(result.current.isSearching).toBe(false);
  });

  it("should return matching tasks when search is called with a query", async () => {
    const tasks = [buildTask({ name: "Buy groceries" })];
    mockTaskService = createMockTaskService({
      searchByName: vi.fn().mockResolvedValue(tasks),
    });
    const { result } = renderHook(() =>
      useSearch(mockTaskService, mockGoalService, mockIdeaService),
    );

    await act(async () => {
      await result.current.search("buy");
    });

    expect(result.current.tasks).toEqual(tasks);
  });

  it("should return matching goals when search is called with a query", async () => {
    const goals = [buildGoal({ name: "Learn piano" })];
    mockGoalService = createMockGoalService({
      searchByName: vi.fn().mockResolvedValue(goals),
    });
    const { result } = renderHook(() =>
      useSearch(mockTaskService, mockGoalService, mockIdeaService),
    );

    await act(async () => {
      await result.current.search("piano");
    });

    expect(result.current.goals).toEqual(goals);
  });

  it("should search tasks and goals simultaneously", async () => {
    const tasks = [buildTask({ name: "Buy groceries" })];
    const goals = [buildGoal({ name: "Buy a house" })];
    mockTaskService = createMockTaskService({
      searchByName: vi.fn().mockResolvedValue(tasks),
    });
    mockGoalService = createMockGoalService({
      searchByName: vi.fn().mockResolvedValue(goals),
    });
    const { result } = renderHook(() =>
      useSearch(mockTaskService, mockGoalService, mockIdeaService),
    );

    await act(async () => {
      await result.current.search("buy");
    });

    expect(result.current.tasks).toEqual(tasks);
    expect(result.current.goals).toEqual(goals);
  });

  it("should call taskService.searchByName with the query", async () => {
    const { result } = renderHook(() =>
      useSearch(mockTaskService, mockGoalService, mockIdeaService),
    );

    await act(async () => {
      await result.current.search("meeting");
    });

    expect(mockTaskService.searchByName).toHaveBeenCalledWith("meeting");
  });

  it("should call goalService.searchByName with the query", async () => {
    const { result } = renderHook(() =>
      useSearch(mockTaskService, mockGoalService, mockIdeaService),
    );

    await act(async () => {
      await result.current.search("meeting");
    });

    expect(mockGoalService.searchByName).toHaveBeenCalledWith("meeting");
  });

  it("should return empty tasks and goals when query is empty string", async () => {
    const { result } = renderHook(() =>
      useSearch(mockTaskService, mockGoalService, mockIdeaService),
    );

    await act(async () => {
      await result.current.search("");
    });

    expect(result.current.tasks).toEqual([]);
    expect(result.current.goals).toEqual([]);
    expect(mockTaskService.searchByName).not.toHaveBeenCalled();
    expect(mockGoalService.searchByName).not.toHaveBeenCalled();
  });

  it("should set isSearching to false after search completes", async () => {
    const { result } = renderHook(() =>
      useSearch(mockTaskService, mockGoalService, mockIdeaService),
    );

    await act(async () => {
      await result.current.search("query");
    });

    expect(result.current.isSearching).toBe(false);
  });

  it("should clear tasks and goals when clear is called", async () => {
    const tasks = [buildTask()];
    const goals = [buildGoal()];
    mockTaskService = createMockTaskService({
      searchByName: vi.fn().mockResolvedValue(tasks),
    });
    mockGoalService = createMockGoalService({
      searchByName: vi.fn().mockResolvedValue(goals),
    });
    const { result } = renderHook(() =>
      useSearch(mockTaskService, mockGoalService, mockIdeaService),
    );

    await act(async () => {
      await result.current.search("task");
    });
    expect(result.current.tasks).toHaveLength(1);
    expect(result.current.goals).toHaveLength(1);

    act(() => {
      result.current.clear();
    });

    expect(result.current.tasks).toEqual([]);
    expect(result.current.goals).toEqual([]);
  });

  it("should set isSearching to false and clear results when search throws", async () => {
    mockGoalService = createMockGoalService({
      searchByName: vi.fn().mockRejectedValue(new Error("Search failed")),
    });
    const { result } = renderHook(() =>
      useSearch(mockTaskService, mockGoalService, mockIdeaService),
    );

    await act(async () => {
      await result.current.search("query");
    });

    expect(result.current.isSearching).toBe(false);
    expect(result.current.tasks).toEqual([]);
    expect(result.current.goals).toEqual([]);
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
    mockTaskService = createMockTaskService({
      searchByName: mockSearchByName,
    });
    const { result } = renderHook(() =>
      useSearch(mockTaskService, mockGoalService, mockIdeaService),
    );

    await act(async () => {
      await result.current.search("first");
    });
    expect(result.current.tasks).toEqual(firstTasks);

    await act(async () => {
      await result.current.search("second");
    });
    expect(result.current.tasks).toEqual(secondTasks);
  });

  it("should return empty ideas on initial render", () => {
    const { result } = renderHook(() =>
      useSearch(mockTaskService, mockGoalService, mockIdeaService),
    );
    expect(result.current.ideas).toEqual([]);
  });

  it("should return matching ideas when search is called with a query", async () => {
    const ideas = [buildIdea({ name: "Learn piano" })];
    mockIdeaService = createMockIdeaService({
      searchByName: vi.fn().mockResolvedValue(ideas),
    });
    const { result } = renderHook(() =>
      useSearch(mockTaskService, mockGoalService, mockIdeaService),
    );

    await act(async () => {
      await result.current.search("piano");
    });

    expect(result.current.ideas).toEqual(ideas);
  });

  it("should search tasks, goals and ideas simultaneously", async () => {
    const tasks = [buildTask({ name: "Buy groceries" })];
    const goals = [buildGoal({ name: "Buy a house" })];
    const ideas = [buildIdea({ name: "Buy a car" })];
    mockTaskService = createMockTaskService({
      searchByName: vi.fn().mockResolvedValue(tasks),
    });
    mockGoalService = createMockGoalService({
      searchByName: vi.fn().mockResolvedValue(goals),
    });
    mockIdeaService = createMockIdeaService({
      searchByName: vi.fn().mockResolvedValue(ideas),
    });
    const { result } = renderHook(() =>
      useSearch(mockTaskService, mockGoalService, mockIdeaService),
    );

    await act(async () => {
      await result.current.search("buy");
    });

    expect(result.current.tasks).toEqual(tasks);
    expect(result.current.goals).toEqual(goals);
    expect(result.current.ideas).toEqual(ideas);
  });

  it("should call ideaService.searchByName with the query", async () => {
    const { result } = renderHook(() =>
      useSearch(mockTaskService, mockGoalService, mockIdeaService),
    );

    await act(async () => {
      await result.current.search("meeting");
    });

    expect(mockIdeaService.searchByName).toHaveBeenCalledWith("meeting");
  });

  it("should not call ideaService.searchByName when query is empty", async () => {
    const { result } = renderHook(() =>
      useSearch(mockTaskService, mockGoalService, mockIdeaService),
    );

    await act(async () => {
      await result.current.search("");
    });

    expect(mockIdeaService.searchByName).not.toHaveBeenCalled();
  });

  it("should clear ideas when clear is called", async () => {
    const ideas = [buildIdea()];
    mockIdeaService = createMockIdeaService({
      searchByName: vi.fn().mockResolvedValue(ideas),
    });
    const { result } = renderHook(() =>
      useSearch(mockTaskService, mockGoalService, mockIdeaService),
    );

    await act(async () => {
      await result.current.search("idea");
    });
    expect(result.current.ideas).toHaveLength(1);

    act(() => {
      result.current.clear();
    });

    expect(result.current.ideas).toEqual([]);
  });

  it("should clear ideas when search throws", async () => {
    mockIdeaService = createMockIdeaService({
      searchByName: vi.fn().mockRejectedValue(new Error("Search failed")),
    });
    const { result } = renderHook(() =>
      useSearch(mockTaskService, mockGoalService, mockIdeaService),
    );

    await act(async () => {
      await result.current.search("query");
    });

    expect(result.current.ideas).toEqual([]);
  });
});

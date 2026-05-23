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

describe("useSearch — clear and error handling", () => {
  let mocks: SearchMocks;

  beforeEach(() => {
    mocks = createSearchMocks();
  });

  it("should clear tasks and goals when clear is called", async () => {
    const tasks = [buildTask()];
    const goals = [buildGoal()];
    mocks.mockTaskService = createMockTaskService({
      searchByName: vi.fn().mockResolvedValue(tasks),
    });
    mocks.mockGoalService = createMockGoalService({
      searchByName: vi.fn().mockResolvedValue(goals),
    });
    const { result } = renderUseSearch(mocks);

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
    mocks.mockGoalService = createMockGoalService({
      searchByName: vi.fn().mockRejectedValue(new Error("Search failed")),
    });
    const { result } = renderUseSearch(mocks);

    await act(async () => {
      await result.current.search("query");
    });

    expect(result.current.isSearching).toBe(false);
    expect(result.current.tasks).toEqual([]);
    expect(result.current.goals).toEqual([]);
  });

  it("should clear ideas when clear is called", async () => {
    const ideas = [buildIdea()];
    mocks.mockIdeaService = createMockIdeaService({
      searchByName: vi.fn().mockResolvedValue(ideas),
    });
    const { result } = renderUseSearch(mocks);

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
    mocks.mockIdeaService = createMockIdeaService({
      searchByName: vi.fn().mockRejectedValue(new Error("Search failed")),
    });
    const { result } = renderUseSearch(mocks);

    await act(async () => {
      await result.current.search("query");
    });

    expect(result.current.ideas).toEqual([]);
  });
});

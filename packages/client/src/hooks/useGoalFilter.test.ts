// implements FR2, FR6 of goals-filter
import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { DEFAULT_GOAL_FILTER, STORAGE_KEYS } from "@/constants";
import { useGoalFilter } from "@/hooks/useGoalFilter";

describe("useGoalFilter", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  // FR2: default value is "all"
  it("should return 'all' when no preference is saved", () => {
    const { result } = renderHook(() => useGoalFilter());
    expect(result.current.goalFilter).toBe(DEFAULT_GOAL_FILTER);
  });

  // FR6: persists selected value
  it("should persist selected filter to localStorage", () => {
    const { result } = renderHook(() => useGoalFilter());

    act(() => {
      result.current.setGoalFilter("active");
    });

    expect(localStorage.getItem(STORAGE_KEYS.GOAL_FILTER)).toBe("active");
    expect(result.current.goalFilter).toBe("active");
  });

  // FR6: reads stored value
  it("should return stored value from localStorage", () => {
    localStorage.setItem(STORAGE_KEYS.GOAL_FILTER, "paused");
    const { result } = renderHook(() => useGoalFilter());
    expect(result.current.goalFilter).toBe("paused");
  });

  // FR6: corrupted value self-heals
  it("should self-heal corrupted value to default", () => {
    localStorage.setItem(STORAGE_KEYS.GOAL_FILTER, "invalid");
    const { result } = renderHook(() => useGoalFilter());
    expect(result.current.goalFilter).toBe(DEFAULT_GOAL_FILTER);
    expect(localStorage.getItem(STORAGE_KEYS.GOAL_FILTER)).toBeNull();
  });

  // FR6: returns setter function
  it("should return setGoalFilter function", () => {
    const { result } = renderHook(() => useGoalFilter());
    expect(typeof result.current.setGoalFilter).toBe("function");
  });

  // FR6: uses correct storage key
  it("should use GOAL_FILTER storage key", () => {
    const { result } = renderHook(() => useGoalFilter());

    act(() => {
      result.current.setGoalFilter("finished");
    });

    expect(localStorage.getItem("goal_filter")).toBe("finished");
  });
});

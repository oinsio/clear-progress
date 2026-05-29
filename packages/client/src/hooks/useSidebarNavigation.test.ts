import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockNavigate = vi.fn();

vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>();
  return { ...actual, useNavigate: () => mockNavigate };
});

import { ROUTES } from "@/constants";
import { useSidebarNavigation } from "./useSidebarNavigation";

// implements FR6 of add-sidebar-specs
describe("useSidebarNavigation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should not navigate when mode is null", () => {
    const { result } = renderHook(() => useSidebarNavigation());

    result.current(null);

    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("should navigate to search route when mode is search", () => {
    const { result } = renderHook(() => useSidebarNavigation());

    result.current("search");

    expect(mockNavigate).toHaveBeenCalledWith(ROUTES.SEARCH);
  });

  it("should navigate to contexts route when mode is contexts", () => {
    const { result } = renderHook(() => useSidebarNavigation());

    result.current("contexts");

    expect(mockNavigate).toHaveBeenCalledWith(ROUTES.CONTEXTS);
  });

  it("should navigate to categories route when mode is categories", () => {
    const { result } = renderHook(() => useSidebarNavigation());

    result.current("categories");

    expect(mockNavigate).toHaveBeenCalledWith(ROUTES.CATEGORIES);
  });

  it("should navigate to goals route when mode is goals", () => {
    const { result } = renderHook(() => useSidebarNavigation());

    result.current("goals");

    expect(mockNavigate).toHaveBeenCalledWith(ROUTES.GOALS);
  });

  it("should navigate to ideas route when mode is ideas", () => {
    const { result } = renderHook(() => useSidebarNavigation());

    result.current("ideas");

    expect(mockNavigate).toHaveBeenCalledWith(ROUTES.IDEAS);
  });

  it("should navigate to deleted route when mode is deleted", () => {
    const { result } = renderHook(() => useSidebarNavigation());

    result.current("deleted");

    expect(mockNavigate).toHaveBeenCalledWith(ROUTES.DELETED);
  });

  it("should navigate to inbox with filterMode state when mode is inbox", () => {
    const { result } = renderHook(() => useSidebarNavigation());

    result.current("inbox");

    expect(mockNavigate).toHaveBeenCalledWith(ROUTES.INBOX, {
      state: { filterMode: "inbox" },
    });
  });

  it("should navigate to inbox with filterMode state when mode is tasks", () => {
    const { result } = renderHook(() => useSidebarNavigation());

    result.current("tasks");

    expect(mockNavigate).toHaveBeenCalledWith(ROUTES.INBOX, {
      state: { filterMode: "tasks" },
    });
  });

  it("should navigate to inbox with filterMode state when mode is completed", () => {
    const { result } = renderHook(() => useSidebarNavigation());

    result.current("completed");

    expect(mockNavigate).toHaveBeenCalledWith(ROUTES.INBOX, {
      state: { filterMode: "completed" },
    });
  });

  it("should navigate to inbox with filterMode state when mode is focused_goals", () => {
    const { result } = renderHook(() => useSidebarNavigation());

    result.current("focused_goals");

    expect(mockNavigate).toHaveBeenCalledWith(ROUTES.INBOX, {
      state: { filterMode: "focused_goals" },
    });
  });

  it("should return stable function reference across re-renders", () => {
    const { result, rerender } = renderHook(() => useSidebarNavigation());

    const firstReference = result.current;
    rerender();
    const secondReference = result.current;

    expect(firstReference).toBe(secondReference);
  });

  it("should only call navigate once per invocation for search mode", () => {
    const { result } = renderHook(() => useSidebarNavigation());

    result.current("search");

    expect(mockNavigate).toHaveBeenCalledTimes(1);
  });

  it("should only call navigate once per invocation for mode with route", () => {
    const { result } = renderHook(() => useSidebarNavigation());

    result.current("contexts");

    expect(mockNavigate).toHaveBeenCalledTimes(1);
  });

  it("should only call navigate once per invocation for mode without route", () => {
    const { result } = renderHook(() => useSidebarNavigation());

    result.current("tasks");

    expect(mockNavigate).toHaveBeenCalledTimes(1);
  });
});

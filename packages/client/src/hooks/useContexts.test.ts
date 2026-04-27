import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { db } from "@/db/database";
import { ContextRepository } from "@/db/repositories/ContextRepository";
import { ContextService } from "@/services/ContextService";
import { buildContext } from "@/test/factories/contextFactory";
import { useContexts } from "./useContexts";

const mockSchedulePush = vi.fn();

vi.mock("@/app/providers/SyncProvider", () => ({
  useSync: () => ({
    syncVersion: 0,
    syncStatus: "idle",
    pull: vi.fn(),
    push: vi.fn(),
    schedulePush: mockSchedulePush,
    lastSyncedAt: null,
  }),
}));

const contextService = new ContextService(new ContextRepository());

describe("useContexts", () => {
  beforeEach(async () => {
    await db.contexts.clear();
    mockSchedulePush.mockClear();
  });

  it("should set isLoading to true on initial render", () => {
    const { result } = renderHook(() => useContexts(contextService));
    expect(result.current.isLoading).toBe(true);
  });

  it("should set isLoading to false after contexts are loaded", async () => {
    const { result } = renderHook(() => useContexts(contextService));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
  });

  it("should return empty array when no contexts exist", async () => {
    const { result } = renderHook(() => useContexts(contextService));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.contexts).toEqual([]);
  });

  it("should return contexts after loading", async () => {
    const context = buildContext();
    await db.contexts.add(context);
    const { result } = renderHook(() => useContexts(contextService));
    await waitFor(() => expect(result.current.contexts).toHaveLength(1));
    expect(result.current.contexts[0].id).toBe(context.id);
  });

  it("should not return deleted contexts", async () => {
    await db.contexts.add(buildContext({ is_deleted: true }));
    const { result } = renderHook(() => useContexts(contextService));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.contexts).toHaveLength(0);
  });

  it("should reactively update when a context is written to DB externally", async () => {
    const { result } = renderHook(() => useContexts(contextService));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.contexts).toHaveLength(0);

    await act(async () => {
      await db.contexts.add(buildContext());
    });

    await waitFor(() => expect(result.current.contexts).toHaveLength(1));
  });

  it("should add context and schedule push when createContext is called", async () => {
    const { result } = renderHook(() => useContexts(contextService));
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.createContext("@Home");
    });

    await waitFor(() => expect(result.current.contexts).toHaveLength(1));
    expect(result.current.contexts[0].name).toBe("@Home");
    expect(mockSchedulePush).toHaveBeenCalledTimes(1);
  });

  it("should update context name and schedule push when updateContext is called", async () => {
    const context = buildContext({ name: "@Old" });
    await db.contexts.add(context);

    const { result } = renderHook(() => useContexts(contextService));
    await waitFor(() => expect(result.current.contexts).toHaveLength(1));

    await act(async () => {
      await result.current.updateContext(context.id, "@New");
    });

    await waitFor(() => expect(result.current.contexts[0].name).toBe("@New"));
    expect(mockSchedulePush).toHaveBeenCalledTimes(1);
  });

  it("should remove context and schedule push when deleteContext is called", async () => {
    const context = buildContext();
    await db.contexts.add(context);

    const { result } = renderHook(() => useContexts(contextService));
    await waitFor(() => expect(result.current.contexts).toHaveLength(1));

    await act(async () => {
      await result.current.deleteContext(context.id);
    });

    await waitFor(() => expect(result.current.contexts).toHaveLength(0));
    expect(mockSchedulePush).toHaveBeenCalledTimes(1);
  });
});

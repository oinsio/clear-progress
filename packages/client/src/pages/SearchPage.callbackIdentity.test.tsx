/**
 * Stale-closure / referential-identity tests for SearchPage's useCallback
 * hooks. Guards the dependency arrays: if a dependency (e.g. searchQuery) is
 * dropped from an array, the handler passed down to children keeps a stale
 * closure instead of being recreated, and callers relying on the fresh value
 * (e.g. `if (searchQuery) void search(searchQuery)`) would silently use an
 * outdated query.
 * implements FR1, FR2, FR3 of fix-search-page-sync-push (mutation coverage)
 */
import { fireEvent, render, screen } from "@testing-library/react";
import type React from "react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { mockSchedulePush } from "@/app/providers/__mocks__/SyncProvider";
import { buildGoal } from "@/test/factories/goalFactory";
import { buildIdea } from "@/test/factories/ideaFactory";
import { buildTask } from "@/test/factories/taskFactory";
import { createMockGoalService } from "@/test/mocks/goalServiceMock";
import { createMockIdeaService } from "@/test/mocks/ideaServiceMock";
import { createMockTaskService } from "@/test/mocks/taskServiceMock";
import type { Box } from "@/types/common";
import type { Goal, Idea, Task } from "@/types/entities";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock(
  "@/app/providers/SyncProvider",
  async () => import("@/app/providers/__mocks__/SyncProvider"),
);

vi.mock("@/hooks/useGoals", () => ({
  useGoals: () => ({ goals: [], isLoading: false }),
}));
vi.mock("@/hooks/useContexts", () => ({
  useContexts: () => ({ contexts: [], isLoading: false }),
}));
vi.mock("@/hooks/useCategories", () => ({
  useCategories: () => ({ categories: [], isLoading: false }),
}));
vi.mock("@/hooks/useFocusMode", () => ({
  useFocusMode: () => ({ isFocusMode: false, focusOpacity: 1 }),
}));

vi.mock("@/components/layout/SidebarShell", () => ({
  SidebarShell: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="sidebar-shell">{children}</div>
  ),
}));

// Capture the exact function references SearchPage hands to its children on
// every render, so tests can compare identity across re-renders.
interface CapturedTaskListProps {
  onComplete: (id: string) => void;
  onUpdate: (id: string, changes: Partial<Task>) => void;
  onMove: (id: string, box: Box) => void;
  onDelete: (id: string) => void;
  onSelect: (id: string) => void;
}
interface CapturedTaskDetailPanelProps {
  onUpdate: (id: string, changes: Partial<Task>) => void;
  onMove: (id: string, box: Box) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  onClose: () => void;
}
interface CapturedIdeaDetailPanelProps {
  onUpdate: (id: string, changes: Partial<Idea>) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}
interface CapturedGoalItemProps {
  onNavigate: (id: string) => void;
}

const capturedTaskListProps: CapturedTaskListProps[] = [];
const capturedTaskDetailPanelProps: CapturedTaskDetailPanelProps[] = [];
const capturedIdeaDetailPanelProps: CapturedIdeaDetailPanelProps[] = [];
const capturedGoalItemProps: CapturedGoalItemProps[] = [];

vi.mock("@/components/tasks/TaskList", () => ({
  TaskList: (
    props: CapturedTaskListProps & {
      tasks: Task[];
      selectedTaskId: string | null;
    },
  ) => {
    capturedTaskListProps.push(props);
    return (
      <div data-testid="task-list">
        {props.tasks.map((task) => (
          <div key={task.id} data-testid="task-item" data-task-id={task.id}>
            {task.name}
            <button
              data-testid={`complete-${task.id}`}
              onClick={() => props.onComplete(task.id)}
            />
            <button
              data-testid={`update-${task.id}`}
              onClick={() => props.onUpdate(task.id, { name: "Updated" })}
            />
            <button
              data-testid={`move-${task.id}`}
              onClick={() => props.onMove(task.id, "next" as Box)}
            />
            <button
              data-testid={`delete-${task.id}`}
              onClick={() => props.onDelete(task.id)}
            />
            <button
              data-testid={`select-${task.id}`}
              onClick={() => props.onSelect(task.id)}
            />
          </div>
        ))}
      </div>
    );
  },
}));

vi.mock("@/components/tasks/TaskDetailPanel", () => ({
  TaskDetailPanel: (props: CapturedTaskDetailPanelProps & { task: Task }) => {
    capturedTaskDetailPanelProps.push(props);
    return (
      <div data-testid="task-detail-panel">
        <button
          data-testid={`duplicate-${props.task.id}`}
          onClick={() => props.onDuplicate(props.task.id)}
        />
        <button data-testid="close-task-detail" onClick={props.onClose} />
      </div>
    );
  },
}));

vi.mock("@/components/ideas/IdeaItem", () => ({
  IdeaItem: ({ idea }: { idea: Idea }) => (
    <span data-testid={`idea-item-${idea.id}`}>{idea.name}</span>
  ),
}));

vi.mock("@/components/ideas/IdeaDetailPanel", () => ({
  IdeaDetailPanel: (props: CapturedIdeaDetailPanelProps & { idea: Idea }) => {
    capturedIdeaDetailPanelProps.push(props);
    return (
      <div data-testid="idea-detail-panel">
        <button data-testid="close-idea-detail" onClick={props.onClose} />
      </div>
    );
  },
}));

vi.mock("@/components/goals/GoalItem", () => ({
  GoalItem: (props: CapturedGoalItemProps & { goal: Goal }) => {
    capturedGoalItemProps.push(props);
    return (
      <button
        data-testid={`goal-item-${props.goal.id}`}
        onClick={() => props.onNavigate(props.goal.id)}
      >
        {props.goal.name}
      </button>
    );
  },
}));

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const foundTask = buildTask({ name: "Search Result Task" });
const foundGoal = buildGoal({ name: "Search Result Goal" });
const foundIdea = buildIdea({ name: "Search Result Idea" });

const mockGetById = vi.fn().mockResolvedValue(foundTask);
const mockComplete = vi.fn().mockResolvedValue({
  completed: foundTask,
  recurringResult: { status: "not_recurring" },
});
const mockNoncomplete = vi.fn().mockResolvedValue(undefined);
const mockUpdate = vi.fn().mockResolvedValue(undefined);
const mockMoveToBox = vi.fn().mockResolvedValue(undefined);
const mockSoftDelete = vi.fn().mockResolvedValue(undefined);
const mockDuplicate = vi.fn().mockResolvedValue(undefined);
const mockTaskSearchByName = vi.fn().mockResolvedValue([foundTask]);
const mockGoalSearchByName = vi.fn().mockResolvedValue([foundGoal]);

const mockIdeaUpdate = vi.fn().mockResolvedValue(undefined);
const mockIdeaSoftDelete = vi.fn().mockResolvedValue(undefined);
const mockIdeaSearchByName = vi.fn().mockResolvedValue([foundIdea]);

vi.mock("@/services/defaultServices", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/services/defaultServices")>();
  return {
    ...actual,
    defaultTaskService: createMockTaskService({
      getById: (...args: unknown[]) => mockGetById(...args),
      complete: (...args: unknown[]) => mockComplete(...args),
      noncomplete: (...args: unknown[]) => mockNoncomplete(...args),
      update: (...args: unknown[]) => mockUpdate(...args),
      moveToBox: (...args: unknown[]) => mockMoveToBox(...args),
      softDelete: (...args: unknown[]) => mockSoftDelete(...args),
      duplicate: (...args: unknown[]) => mockDuplicate(...args),
      searchByName: (...args: unknown[]) => mockTaskSearchByName(...args),
    }),
    defaultGoalService: createMockGoalService({
      searchByName: (...args: unknown[]) => mockGoalSearchByName(...args),
    }),
    defaultIdeaService: createMockIdeaService({
      update: (...args: unknown[]) => mockIdeaUpdate(...args),
      softDelete: (...args: unknown[]) => mockIdeaSoftDelete(...args),
      searchByName: (...args: unknown[]) => mockIdeaSearchByName(...args),
    }),
  };
});

import SearchPage from "./SearchPage";

function renderSearchPage() {
  return render(
    <MemoryRouter>
      <SearchPage />
    </MemoryRouter>,
  );
}

async function typeSearchQuery(query: string) {
  const searchInput = screen.getByTestId("search-input");
  fireEvent.change(searchInput, { target: { value: query } });
  await screen.findByTestId(`complete-${foundTask.id}`);
  await vi.waitFor(() => {
    expect(mockTaskSearchByName).toHaveBeenCalledWith(query);
  });
}

describe("SearchPage > useCallback referential identity (searchQuery dependency)", () => {
  beforeEach(() => {
    capturedTaskListProps.length = 0;
    capturedTaskDetailPanelProps.length = 0;
    capturedIdeaDetailPanelProps.length = 0;
    capturedGoalItemProps.length = 0;
    mockSchedulePush.mockClear();
    mockNavigate.mockClear();
  });

  // The five handlers below all list `searchQuery` in their dependency
  // array. If an ArrayDeclaration mutant empties that array, React would
  // keep reusing the first render's callback instead of recreating it when
  // searchQuery changes.
  it("should recreate onComplete, onUpdate, onMove and onDelete passed to TaskList when searchQuery changes", async () => {
    renderSearchPage();
    await typeSearchQuery("first");
    const propsAfterFirstQuery =
      capturedTaskListProps[capturedTaskListProps.length - 1];

    await typeSearchQuery("second");
    const propsAfterSecondQuery =
      capturedTaskListProps[capturedTaskListProps.length - 1];

    expect(propsAfterSecondQuery.onComplete).not.toBe(
      propsAfterFirstQuery.onComplete,
    );
    expect(propsAfterSecondQuery.onUpdate).not.toBe(
      propsAfterFirstQuery.onUpdate,
    );
    expect(propsAfterSecondQuery.onMove).not.toBe(propsAfterFirstQuery.onMove);
    expect(propsAfterSecondQuery.onDelete).not.toBe(
      propsAfterFirstQuery.onDelete,
    );
  });

  it("should use the fresh searchQuery when completing a task after the query changed, not a stale one", async () => {
    renderSearchPage();
    await typeSearchQuery("first");
    await typeSearchQuery("second");
    mockTaskSearchByName.mockClear();

    const latestProps = capturedTaskListProps[capturedTaskListProps.length - 1];
    latestProps.onComplete(foundTask.id);

    await vi.waitFor(() => {
      expect(mockComplete).toHaveBeenCalledWith(
        foundTask.id,
        expect.any(String),
      );
    });
    await vi.waitFor(() => {
      // A stale closure would either re-search "first" or skip re-searching
      // entirely; the fresh closure must re-search with "second".
      expect(mockTaskSearchByName).toHaveBeenCalledWith("second");
    });
  });

  it("should recreate onUpdate, onMove, onDelete and onDuplicate passed to TaskDetailPanel when searchQuery changes", async () => {
    renderSearchPage();
    await typeSearchQuery("first");
    fireEvent.click(screen.getByTestId(`select-${foundTask.id}`));
    await screen.findByTestId("task-detail-panel");
    const propsAfterFirstQuery =
      capturedTaskDetailPanelProps[capturedTaskDetailPanelProps.length - 1];

    await typeSearchQuery("second");
    const propsAfterSecondQuery =
      capturedTaskDetailPanelProps[capturedTaskDetailPanelProps.length - 1];

    expect(propsAfterSecondQuery.onUpdate).not.toBe(
      propsAfterFirstQuery.onUpdate,
    );
    expect(propsAfterSecondQuery.onMove).not.toBe(propsAfterFirstQuery.onMove);
    expect(propsAfterSecondQuery.onDelete).not.toBe(
      propsAfterFirstQuery.onDelete,
    );
    expect(propsAfterSecondQuery.onDuplicate).not.toBe(
      propsAfterFirstQuery.onDuplicate,
    );
  });

  it("should use the fresh searchQuery when duplicating a task after the query changed, not a stale one", async () => {
    renderSearchPage();
    await typeSearchQuery("first");
    fireEvent.click(screen.getByTestId(`select-${foundTask.id}`));
    const duplicateButtonAfterFirstQuery = await screen.findByTestId(
      `duplicate-${foundTask.id}`,
    );
    void duplicateButtonAfterFirstQuery;
    await typeSearchQuery("second");
    mockTaskSearchByName.mockClear();

    fireEvent.click(screen.getByTestId(`duplicate-${foundTask.id}`));

    await vi.waitFor(() => {
      expect(mockDuplicate).toHaveBeenCalledWith(foundTask.id);
    });
    await vi.waitFor(() => {
      expect(mockTaskSearchByName).toHaveBeenCalledWith("second");
    });
  });

  it("should recreate onUpdate and onDelete passed to IdeaDetailPanel when searchQuery changes", async () => {
    renderSearchPage();
    await typeSearchQuery("first");
    fireEvent.click(await screen.findByTestId(`idea-item-${foundIdea.id}`));
    await screen.findByTestId("idea-detail-panel");
    const propsAfterFirstQuery =
      capturedIdeaDetailPanelProps[capturedIdeaDetailPanelProps.length - 1];

    await typeSearchQuery("second");
    const propsAfterSecondQuery =
      capturedIdeaDetailPanelProps[capturedIdeaDetailPanelProps.length - 1];

    expect(propsAfterSecondQuery.onUpdate).not.toBe(
      propsAfterFirstQuery.onUpdate,
    );
    expect(propsAfterSecondQuery.onDelete).not.toBe(
      propsAfterFirstQuery.onDelete,
    );
  });

  it("should use the fresh searchQuery when soft-deleting an idea after the query changed, not a stale one", async () => {
    renderSearchPage();
    await typeSearchQuery("first");
    fireEvent.click(await screen.findByTestId(`idea-item-${foundIdea.id}`));
    await screen.findByTestId("idea-detail-panel");
    await typeSearchQuery("second");
    mockIdeaSearchByName.mockClear();

    const latestProps =
      capturedIdeaDetailPanelProps[capturedIdeaDetailPanelProps.length - 1];
    latestProps.onDelete(foundIdea.id);

    await vi.waitFor(() => {
      expect(mockIdeaSoftDelete).toHaveBeenCalledWith(foundIdea.id);
    });
    await vi.waitFor(() => {
      expect(mockIdeaSearchByName).toHaveBeenCalledWith("second");
    });
  });
});

describe("SearchPage > useCallback with stable dependencies (equivalent-mutant candidates)", () => {
  beforeEach(() => {
    capturedGoalItemProps.length = 0;
    mockSchedulePush.mockClear();
    mockNavigate.mockClear();
  });

  // handleNavigateToGoal depends only on `navigate` (stable across
  // re-renders under react-router). Its identity is not expected to change,
  // but the callback must still navigate using the id argument it receives
  // at call time (never captures searchQuery or other page state).
  it("should navigate to the goal detail route using the id passed at call time", async () => {
    renderSearchPage();
    await typeSearchQuery("first");
    const goalButton = await screen.findByTestId(`goal-item-${foundGoal.id}`);

    fireEvent.click(goalButton);

    expect(mockNavigate).toHaveBeenCalledWith(`/goals/${foundGoal.id}`);
  });

  // handleIdeaClick, handleIdeaClose, handleTaskSelect and
  // handleTaskDetailClose all have an empty dependency array and only call a
  // setState setter (React guarantees setState identity is stable forever).
  // There is nothing outside `[]` for these closures to capture, so an
  // ArrayDeclaration mutant to `[]` is behaviorally equivalent to the
  // original for referential identity — both are stable across ALL
  // re-renders. We instead assert their setState-driven behavior is correct
  // on every call, including after unrelated state (searchQuery) changes.
  it("should open and close the task detail panel correctly even after searchQuery has changed", async () => {
    renderSearchPage();
    await typeSearchQuery("first");
    await typeSearchQuery("second");

    fireEvent.click(screen.getByTestId(`select-${foundTask.id}`));
    await screen.findByTestId("task-detail-panel");

    fireEvent.click(screen.getByTestId("close-task-detail"));
    expect(screen.queryByTestId("task-detail-panel")).not.toBeInTheDocument();
  });

  it("should open and close the idea detail panel correctly even after searchQuery has changed", async () => {
    renderSearchPage();
    await typeSearchQuery("first");
    await typeSearchQuery("second");

    fireEvent.click(await screen.findByTestId(`idea-item-${foundIdea.id}`));
    await screen.findByTestId("idea-detail-panel");

    fireEvent.click(screen.getByTestId("close-idea-detail"));
    expect(screen.queryByTestId("idea-detail-panel")).not.toBeInTheDocument();
  });
});

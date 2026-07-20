/**
 * RED tests: SearchPage task mutation paths (complete, noncomplete, update,
 * moveToBox) must schedule a push after mutating.
 * implements FR1 of fix-search-page-sync-push (task 2.1)
 */
import { fireEvent, render, screen } from "@testing-library/react";
import type React from "react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { mockSchedulePush } from "@/app/providers/__mocks__/SyncProvider";
import { buildTask } from "@/test/factories/taskFactory";
import { createMockGoalService } from "@/test/mocks/goalServiceMock";
import { createMockIdeaService } from "@/test/mocks/ideaServiceMock";
import { createMockTaskService } from "@/test/mocks/taskServiceMock";
import type { Box } from "@/types/common";
import type { Task } from "@/types/entities";

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

vi.mock("@/components/tasks/TaskList", () => ({
  TaskList: ({
    tasks,
    onComplete,
    onUpdate,
    onMove,
  }: {
    tasks: Task[];
    onComplete: (id: string) => void;
    onUpdate: (id: string, changes: Partial<Task>) => void;
    onMove: (id: string, box: Box) => void;
  }) => (
    <div data-testid="task-list">
      {tasks.map((task) => (
        <div key={task.id} data-testid="task-item" data-task-id={task.id}>
          {task.name}
          <button
            data-testid={`complete-${task.id}`}
            onClick={() => onComplete(task.id)}
          />
          <button
            data-testid={`update-${task.id}`}
            onClick={() => onUpdate(task.id, { name: "Updated name" })}
          />
          <button
            data-testid={`move-${task.id}`}
            onClick={() => onMove(task.id, "next" as Box)}
          />
        </div>
      ))}
    </div>
  ),
}));

const foundTask = buildTask({ name: "Search Result Task" });

const mockGetById = vi.fn().mockResolvedValue(foundTask);
const mockComplete = vi.fn().mockResolvedValue({
  completed: foundTask,
  recurringResult: { status: "not_recurring" },
});
const mockNoncomplete = vi.fn().mockResolvedValue(undefined);
const mockUpdate = vi.fn().mockResolvedValue(undefined);
const mockMoveToBox = vi.fn().mockResolvedValue(undefined);
const mockSearchByName = vi.fn().mockResolvedValue([foundTask]);

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
      searchByName: (...args: unknown[]) => mockSearchByName(...args),
    }),
    defaultGoalService: createMockGoalService(),
    defaultIdeaService: createMockIdeaService(),
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

async function typeSearchQueryAndGetTaskButtons(query: string) {
  const searchInput = screen.getByTestId("search-input");
  fireEvent.change(searchInput, { target: { value: query } });
  const completeButton = await screen.findByTestId(`complete-${foundTask.id}`);
  await vi.waitFor(() => {
    expect(mockSearchByName).toHaveBeenCalledWith(query);
  });
  return {
    completeButton,
    updateButton: screen.getByTestId(`update-${foundTask.id}`),
    moveButton: screen.getByTestId(`move-${foundTask.id}`),
  };
}

describe("SearchPage > schedulePush on task mutations", () => {
  beforeEach(() => {
    mockSchedulePush.mockClear();
    mockGetById.mockClear();
    mockComplete.mockClear();
    mockNoncomplete.mockClear();
    mockUpdate.mockClear();
    mockMoveToBox.mockClear();
  });

  it("should call schedulePush exactly once after completing an incomplete task", async () => {
    mockGetById.mockResolvedValue(
      buildTask({ ...foundTask, is_completed: false }),
    );
    renderSearchPage();

    const { completeButton } = await typeSearchQueryAndGetTaskButtons("Search");
    fireEvent.click(completeButton);

    await vi.waitFor(() => {
      expect(mockComplete).toHaveBeenCalledWith(
        foundTask.id,
        expect.any(String),
      );
    });
    expect(mockSchedulePush).toHaveBeenCalledOnce();
  });

  it("should call schedulePush exactly once after uncompleting an already-completed task", async () => {
    mockGetById.mockResolvedValue(
      buildTask({ ...foundTask, is_completed: true }),
    );
    renderSearchPage();

    const { completeButton } = await typeSearchQueryAndGetTaskButtons("Search");
    fireEvent.click(completeButton);

    await vi.waitFor(() => {
      expect(mockNoncomplete).toHaveBeenCalledWith(foundTask.id);
    });
    expect(mockSchedulePush).toHaveBeenCalledOnce();
  });

  it("should call schedulePush exactly once after updating a task", async () => {
    renderSearchPage();

    const { updateButton } = await typeSearchQueryAndGetTaskButtons("Search");
    fireEvent.click(updateButton);

    await vi.waitFor(() => {
      expect(mockUpdate).toHaveBeenCalledWith(foundTask.id, {
        name: "Updated name",
      });
    });
    expect(mockSchedulePush).toHaveBeenCalledOnce();
  });

  it("should call schedulePush exactly once after moving a task to a different box", async () => {
    renderSearchPage();

    const { moveButton } = await typeSearchQueryAndGetTaskButtons("Search");
    fireEvent.click(moveButton);

    await vi.waitFor(() => {
      expect(mockMoveToBox).toHaveBeenCalledWith(foundTask.id, "next");
    });
    expect(mockSchedulePush).toHaveBeenCalledOnce();
  });
});

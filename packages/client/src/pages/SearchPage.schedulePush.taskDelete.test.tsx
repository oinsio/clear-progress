/**
 * RED tests: SearchPage task mutation paths (softDelete, duplicate) must
 * schedule a push after mutating.
 * implements FR1 of fix-search-page-sync-push (task 2.1)
 */
import { fireEvent, render, screen } from "@testing-library/react";
import type React from "react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { mockSchedulePush } from "@/app/providers/__mocks__/SyncProvider";
import { buildTask } from "@/test/factories/taskFactory";
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
    onDelete,
    onSelect,
  }: {
    tasks: Task[];
    onDelete: (id: string) => void;
    onSelect: (id: string) => void;
  }) => (
    <div data-testid="task-list">
      {tasks.map((task) => (
        <div key={task.id} data-testid="task-item" data-task-id={task.id}>
          {task.name}
          <button
            data-testid={`delete-${task.id}`}
            onClick={() => onDelete(task.id)}
          />
          <button
            data-testid={`select-${task.id}`}
            onClick={() => onSelect(task.id)}
          />
        </div>
      ))}
    </div>
  ),
}));

vi.mock("@/components/tasks/TaskDetailPanel", () => ({
  TaskDetailPanel: ({
    task,
    onDuplicate,
  }: {
    task: Task;
    onDuplicate: (id: string) => void;
  }) => (
    <div data-testid="task-detail-panel">
      <button
        data-testid={`duplicate-${task.id}`}
        onClick={() => onDuplicate(task.id)}
      />
    </div>
  ),
}));

const foundTask = buildTask({ name: "Search Result Task" });

const mockGetById = vi.fn().mockResolvedValue(foundTask);
const mockSoftDelete = vi.fn().mockResolvedValue(undefined);
const mockDuplicate = vi.fn().mockResolvedValue(undefined);
const mockSearchByName = vi.fn().mockResolvedValue([foundTask]);

vi.mock("@/services/defaultServices", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/services/defaultServices")>();
  return {
    ...actual,
    defaultTaskService: {
      getById: (...args: unknown[]) => mockGetById(...args),
      complete: vi.fn(),
      noncomplete: vi.fn(),
      softDelete: (...args: unknown[]) => mockSoftDelete(...args),
      duplicate: (...args: unknown[]) => mockDuplicate(...args),
      searchByName: (...args: unknown[]) => mockSearchByName(...args),
    },
    defaultGoalService: {
      searchByName: vi.fn().mockResolvedValue([]),
    },
    defaultIdeaService: {
      searchByName: vi.fn().mockResolvedValue([]),
    },
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
  const deleteButton = await screen.findByTestId(`delete-${foundTask.id}`);
  await vi.waitFor(() => {
    expect(mockSearchByName).toHaveBeenCalledWith(query);
  });
  return deleteButton;
}

describe("SearchPage > schedulePush on task delete/duplicate", () => {
  beforeEach(() => {
    mockSchedulePush.mockClear();
    mockSoftDelete.mockClear();
    mockDuplicate.mockClear();
  });

  it("should call schedulePush exactly once after soft-deleting a task", async () => {
    renderSearchPage();

    const deleteButton = await typeSearchQuery("Search");
    fireEvent.click(deleteButton);

    await vi.waitFor(() => {
      expect(mockSoftDelete).toHaveBeenCalledWith(foundTask.id);
    });
    expect(mockSchedulePush).toHaveBeenCalledOnce();
  });

  it("should call schedulePush exactly once after duplicating a task", async () => {
    renderSearchPage();

    await typeSearchQuery("Search");
    // Selecting the task opens the TaskDetailPanel, which exposes duplicate.
    fireEvent.click(screen.getByTestId(`select-${foundTask.id}`));
    const duplicateButton = await screen.findByTestId(
      `duplicate-${foundTask.id}`,
    );
    fireEvent.click(duplicateButton);

    await vi.waitFor(() => {
      expect(mockDuplicate).toHaveBeenCalledWith(foundTask.id);
    });
    expect(mockSchedulePush).toHaveBeenCalledOnce();
  });
});

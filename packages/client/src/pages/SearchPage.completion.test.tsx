/**
 * Tests for SearchPage task completion alerting.
 * implements FR5, FR6, U3 of fix-recurring-completion-error-masking
 */
import { fireEvent, render, screen } from "@testing-library/react";
import type React from "react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { mockAddAlerts } from "@/app/providers/__mocks__/AlertProvider";
import { buildTask } from "@/test/factories/taskFactory";
import type { Task } from "@/types/entities";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock(
  "@/app/providers/AlertProvider",
  async () => import("@/app/providers/__mocks__/AlertProvider"),
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
  }: {
    tasks: Task[];
    onComplete: (id: string) => void;
  }) => (
    <div data-testid="task-list">
      {tasks.map((task) => (
        <div key={task.id} data-testid="task-item" data-task-id={task.id}>
          {task.name}
          <button
            data-testid={`complete-${task.id}`}
            onClick={() => onComplete(task.id)}
          />
        </div>
      ))}
    </div>
  ),
}));

const foundTask = buildTask({
  name: "Recurring Task",
  is_completed: false,
  repeat_rule: JSON.stringify({ type: "daily" }),
});

const mockGetById = vi.fn().mockResolvedValue(foundTask);
const mockComplete = vi.fn();
const mockSearchByName = vi.fn().mockResolvedValue([foundTask]);

vi.mock("@/services/defaultServices", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/services/defaultServices")>();
  return {
    ...actual,
    defaultTaskService: {
      getById: (...args: unknown[]) => mockGetById(...args),
      complete: (...args: unknown[]) => mockComplete(...args),
      noncomplete: vi.fn(),
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
  // useSearch triggers search on debounce; wait for the resulting task item
  // so state updates from the debounced search settle before we act again.
  const completeButton = await screen.findByTestId(`complete-${foundTask.id}`);
  await vi.waitFor(() => {
    expect(mockSearchByName).toHaveBeenCalledWith(query);
  });
  return completeButton;
}

describe("SearchPage > completion", () => {
  beforeEach(() => {
    mockAddAlerts.mockClear();
  });

  it(// FR6, U3: SearchPage now raises the same alert as every other completion entry point
  "should raise a repeat_rule_invalid alert when completing a task whose recurringResult is skipped_invalid_rule", async () => {
    mockComplete.mockResolvedValue({
      completed: foundTask,
      recurringResult: { status: "skipped_invalid_rule" },
    });
    renderSearchPage();

    const completeButton = await typeSearchQuery("Recurring");
    fireEvent.click(completeButton);

    await vi.waitFor(() => {
      expect(mockComplete).toHaveBeenCalledWith(
        foundTask.id,
        expect.any(String),
      );
    });

    await vi.waitFor(() => {
      expect(mockAddAlerts).toHaveBeenCalledWith([
        { type: "repeat_rule_invalid", taskNames: [foundTask.name] },
      ]);
    });
  });

  it("should not raise an alert when completing a task whose recurringResult is not_recurring", async () => {
    mockComplete.mockResolvedValue({
      completed: foundTask,
      recurringResult: { status: "not_recurring" },
    });
    renderSearchPage();

    const completeButton = await typeSearchQuery("Recurring");
    fireEvent.click(completeButton);

    await vi.waitFor(() => {
      expect(mockComplete).toHaveBeenCalledWith(
        foundTask.id,
        expect.any(String),
      );
    });

    expect(mockAddAlerts).not.toHaveBeenCalled();
  });
});

/**
 * Guard test: running a search (typing a query, no mutation) must call
 * schedulePush() zero times. Guards against over-scheduling on pure reads.
 * implements FR1, FR2 of fix-search-page-sync-push (task 2.3)
 */
import { fireEvent, render, screen } from "@testing-library/react";
import type React from "react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { mockSchedulePush } from "@/app/providers/__mocks__/SyncProvider";
import { buildIdea } from "@/test/factories/ideaFactory";
import { buildTask } from "@/test/factories/taskFactory";

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
  TaskList: () => <div data-testid="task-list" />,
}));

const foundTask = buildTask({ name: "Search Result Task" });
const foundIdea = buildIdea({ name: "Search Result Idea" });

const mockTaskSearchByName = vi.fn().mockResolvedValue([foundTask]);
const mockGoalSearchByName = vi.fn().mockResolvedValue([]);
const mockIdeaSearchByName = vi.fn().mockResolvedValue([foundIdea]);

vi.mock("@/services/defaultServices", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/services/defaultServices")>();
  return {
    ...actual,
    defaultTaskService: {
      searchByName: (...args: unknown[]) => mockTaskSearchByName(...args),
    },
    defaultGoalService: {
      searchByName: (...args: unknown[]) => mockGoalSearchByName(...args),
    },
    defaultIdeaService: {
      searchByName: (...args: unknown[]) => mockIdeaSearchByName(...args),
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

describe("SearchPage > schedulePush on pure search (no mutation)", () => {
  beforeEach(() => {
    mockSchedulePush.mockClear();
    mockTaskSearchByName.mockClear();
    mockGoalSearchByName.mockClear();
    mockIdeaSearchByName.mockClear();
  });

  it("should call schedulePush zero times after typing a search query with results", async () => {
    renderSearchPage();

    const searchInput = screen.getByTestId("search-input");
    fireEvent.change(searchInput, { target: { value: "Search" } });

    await vi.waitFor(() => {
      expect(mockTaskSearchByName).toHaveBeenCalledWith("Search");
    });
    await vi.waitFor(() => {
      expect(mockIdeaSearchByName).toHaveBeenCalledWith("Search");
    });

    expect(mockSchedulePush).not.toHaveBeenCalled();
  });
});

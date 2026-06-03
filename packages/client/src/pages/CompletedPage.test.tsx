import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  buildCategoriesHook,
  buildCompletedTasksHook,
  buildContextsHook,
  buildGoalsHook,
  buildTasksHook,
} from "@/test/builders/hookBuilders";
import { buildTask } from "@/test/factories/taskFactory";

vi.mock("@/app/providers/AuthProvider", () => ({
  useAuth: () => ({
    accessToken: null,
    userEmail: null,
    userPicture: null,
    signIn: vi.fn(),
    signOut: vi.fn(),
    silentRefresh: vi.fn(),
  }),
}));
vi.mock("@/hooks/useTasks");
vi.mock("@/hooks/useGoals");
vi.mock("@/hooks/useContexts");
vi.mock("@/hooks/useCategories");
vi.mock("@/hooks/useCompletedTasks");
vi.mock("@/hooks/useFocusMode", () => ({
  useFocusMode: () => ({
    isFocusMode: false,
    setFocusMode: vi.fn(),
    focusOpacity: 30,
    setFocusOpacity: vi.fn(),
  }),
}));
vi.mock("@/hooks/useShowHidden", () => ({
  useShowHidden: () => ({
    showHidden: false,
    toggleShowHidden: vi.fn(),
  }),
}));

import { useCategories } from "@/hooks/useCategories";
import { useCompletedTasks } from "@/hooks/useCompletedTasks";
import { useContexts } from "@/hooks/useContexts";
import { useGoals } from "@/hooks/useGoals";
import { useTasks } from "@/hooks/useTasks";
import CompletedPage from "./CompletedPage";

const mockUseTasks = vi.mocked(useTasks);
const mockUseGoals = vi.mocked(useGoals);
const mockUseContexts = vi.mocked(useContexts);
const mockUseCategories = vi.mocked(useCategories);
const mockUseCompletedTasks = vi.mocked(useCompletedTasks);

function renderPage() {
  return render(
    <MemoryRouter>
      <CompletedPage />
    </MemoryRouter>,
  );
}

function renderWithCompletedTasks(
  daysAgo: number,
  overrides?: Parameters<typeof buildTask>[0],
) {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  const completedTasks = [
    buildTask({
      is_completed: true,
      completed_at: date.toISOString(),
      ...overrides,
    }),
  ];
  mockUseCompletedTasks.mockReturnValue(
    buildCompletedTasksHook({ completedTasks }),
  );
  renderPage();
}

describe("CompletedPage", () => {
  beforeEach(() => {
    mockUseTasks.mockReturnValue(buildTasksHook());
    mockUseGoals.mockReturnValue(buildGoalsHook());
    mockUseContexts.mockReturnValue(buildContextsHook());
    mockUseCategories.mockReturnValue(buildCategoriesHook());
    mockUseCompletedTasks.mockReturnValue(buildCompletedTasksHook());
  });

  // FR-3: renders root container with correct data-testid
  it("should render the page container", () => {
    renderPage();
    expect(screen.getByTestId("completed-page")).toBeInTheDocument();
  });

  // FR-3: renders TaskPageLayout
  it("should render TaskPageLayout", () => {
    renderPage();
    expect(screen.getByTestId("task-page-layout")).toBeInTheDocument();
  });

  // FR-3: does not render BoxFilterBar
  it("should not render BoxFilterBar", () => {
    renderPage();
    expect(screen.queryByTestId("box-filter-toggle")).not.toBeInTheDocument();
  });

  // FR-20: does not render CommandBar
  it("should not render CommandBar", () => {
    renderPage();
    expect(screen.queryByTestId("command-bar")).not.toBeInTheDocument();
  });

  // FR-3: does not render AddTaskInput or add button
  it("should not render add task button", () => {
    renderPage();
    expect(screen.queryByTestId("add-task-button")).not.toBeInTheDocument();
  });

  // FR-3: shows empty message when no completed tasks
  it("should show empty message when no completed tasks", () => {
    renderPage();
    expect(screen.getByTestId("task-list-empty")).toBeInTheDocument();
  });

  // FR-3: empty message uses correct translated text
  it("should show empty message with correct translated text", () => {
    renderPage();
    expect(screen.getByText("Завершённых задач нет")).toBeInTheDocument();
  });

  // FR-3: renders TaskSection for today group when tasks exist
  it("should render today section for today completed tasks", () => {
    renderWithCompletedTasks(0, { name: "Today task" });
    expect(screen.getByText(/Today task/)).toBeInTheDocument();
  });

  // FR-3: today section has correct label (text may be split across elements)
  it("should render today section with correct label", () => {
    renderWithCompletedTasks(0);
    // Section header contains "Сегодня" with count
    const sectionHeaders = screen.getAllByText(/Сегодня/);
    expect(sectionHeaders.length).toBeGreaterThanOrEqual(1);
  });

  // FR-3: hides empty date groups (only non-empty groups render TaskSection)
  it("should not render sections for empty date groups", () => {
    renderWithCompletedTasks(0, { name: "Today task" });
    // Only 1 task item should appear (just the today group)
    expect(screen.getAllByTestId("task-item")).toHaveLength(1);
  });

  // FR-3: does not show empty message when completed tasks exist
  it("should not show empty message when completed tasks exist", () => {
    renderWithCompletedTasks(0, { name: "Today task" });
    expect(screen.queryByTestId("task-list-empty")).not.toBeInTheDocument();
  });

  // FR-3: renders yesterday section when yesterday tasks exist
  it("should render yesterday section when yesterday tasks exist", () => {
    renderWithCompletedTasks(1, { name: "Yesterday task" });
    expect(screen.getByText(/Yesterday task/)).toBeInTheDocument();
    // Section header "Вчера (1)" is split across elements, verify via getAllByText
    const yesterdayElements = screen.getAllByText(/Вчера/);
    expect(yesterdayElements.length).toBeGreaterThanOrEqual(1);
  });

  // FR-3: does not render yesterday section when no yesterday tasks
  it("should not render yesterday section label when no yesterday tasks", () => {
    renderWithCompletedTasks(0);
    // Only "Сегодня" section should exist, no "Вчера"
    const yesterdayElements = screen.queryAllByText(/^Вчера/);
    expect(yesterdayElements).toHaveLength(0);
  });

  // FR-3: renders multiple date groups when tasks span different periods
  it("should render multiple date group sections for tasks from different dates", () => {
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const completedTasks = [
      buildTask({
        name: "Today completed",
        is_completed: true,
        completed_at: today.toISOString(),
      }),
      buildTask({
        name: "Yesterday completed",
        is_completed: true,
        completed_at: yesterday.toISOString(),
      }),
    ];
    mockUseCompletedTasks.mockReturnValue(
      buildCompletedTasksHook({ completedTasks }),
    );
    renderPage();
    expect(screen.getByText(/Today completed/)).toBeInTheDocument();
    expect(screen.getByText(/Yesterday completed/)).toBeInTheDocument();
    expect(screen.getAllByTestId("task-item")).toHaveLength(2);
  });

  // FR-3: renders week section for tasks from 3 days ago
  it("should render week section for tasks completed this week", () => {
    renderWithCompletedTasks(3, { name: "Week task" });
    expect(screen.getByText(/Week task/)).toBeInTheDocument();
    expect(screen.queryByTestId("task-list-empty")).not.toBeInTheDocument();
  });

  // FR-3: renders month section for tasks from 15 days ago
  it("should render month section for tasks completed this month", () => {
    renderWithCompletedTasks(15, { name: "Month task" });
    expect(screen.getByText(/Month task/)).toBeInTheDocument();
    expect(screen.queryByTestId("task-list-empty")).not.toBeInTheDocument();
  });

  // FR-3: renders earlier section for tasks from 60 days ago
  it("should render earlier section for tasks completed long ago", () => {
    renderWithCompletedTasks(60, { name: "Earlier task" });
    expect(screen.getByText(/Earlier task/)).toBeInTheDocument();
    expect(screen.queryByTestId("task-list-empty")).not.toBeInTheDocument();
  });

  // FR-3: week section label uses correct translation
  it("should render week section with correct label", () => {
    renderWithCompletedTasks(3);
    expect(screen.getAllByText(/7 дней/).length).toBeGreaterThanOrEqual(1);
  });

  // FR-3: month section label uses correct translation
  it("should render month section with correct label", () => {
    renderWithCompletedTasks(15);
    expect(screen.getAllByText(/За месяц/).length).toBeGreaterThanOrEqual(1);
  });

  // FR-3: earlier section label uses correct translation
  it("should render earlier section with correct label", () => {
    renderWithCompletedTasks(60);
    expect(screen.getAllByText(/Ранее/).length).toBeGreaterThanOrEqual(1);
  });

  // FR-3: does not show today section when only yesterday tasks exist
  it("should not render today section when no today tasks", () => {
    renderWithCompletedTasks(1);
    // Should have exactly 1 task item (in yesterday section)
    expect(screen.getAllByTestId("task-item")).toHaveLength(1);
  });
});

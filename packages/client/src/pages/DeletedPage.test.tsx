/**
 * Tests for DeletedPage — rendering, states, sections.
 * Implements FR18, FR21, UX1 of swipeable-item.
 */
import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { buildCategory } from "@/test/factories/categoryFactory";
import { buildChecklistItem } from "@/test/factories/checklistItemFactory";
import { buildContext } from "@/test/factories/contextFactory";
import { buildGoal } from "@/test/factories/goalFactory";
import { buildIdea } from "@/test/factories/ideaFactory";
import { buildTask } from "@/test/factories/taskFactory";
import { renderDeletedPage } from "./deletedPage.testSetup";

describe("DeletedPage", () => {
  it("should show page title", () => {
    renderDeletedPage();
    expect(screen.getByText("Удалённое")).toBeInTheDocument();
  });

  it("should show loading state when isLoading is true", () => {
    renderDeletedPage({ isLoading: true });
    expect(screen.getByText("Загрузка...")).toBeInTheDocument();
  });

  it("should not show loading text when isLoading is false", () => {
    renderDeletedPage({ isLoading: false });
    expect(screen.queryByText("Загрузка...")).not.toBeInTheDocument();
  });

  it("should show empty state text when all entities are empty", () => {
    renderDeletedPage();
    expect(screen.getByText("Удалённых записей нет")).toBeInTheDocument();
  });

  it("should not show empty state when entities exist", () => {
    renderDeletedPage({
      tasks: [buildTask({ is_deleted: true })],
    });
    expect(screen.queryByText("Удалённых записей нет")).not.toBeInTheDocument();
  });

  it("should render section names for all entity types", () => {
    const taskNameMap = new Map<string, string>();
    renderDeletedPage({
      tasks: [buildTask({ is_deleted: true })],
      goals: [buildGoal({ is_deleted: true })],
      ideas: [buildIdea({ is_deleted: true })],
      contexts: [buildContext({ is_deleted: true })],
      categories: [buildCategory({ is_deleted: true })],
      checklistItems: [buildChecklistItem({ is_deleted: true })],
      taskNameMap,
    });

    expect(screen.getByText("Задачи")).toBeInTheDocument();
    expect(screen.getByText("Цели")).toBeInTheDocument();
    expect(screen.getByText("Идеи")).toBeInTheDocument();
    expect(screen.getByText("Контексты")).toBeInTheDocument();
    expect(screen.getByText("Категории")).toBeInTheDocument();
    expect(screen.getByText("Чек-листы")).toBeInTheDocument();
  });

  it("should render entity names in their sections", () => {
    renderDeletedPage({
      tasks: [buildTask({ name: "Task A", is_deleted: true })],
      contexts: [buildContext({ name: "Ctx B", is_deleted: true })],
      categories: [buildCategory({ name: "Cat C", is_deleted: true })],
    });

    expect(screen.getByText("Task A")).toBeInTheDocument();
    expect(screen.getByText("Ctx B")).toBeInTheDocument();
    expect(screen.getByText("Cat C")).toBeInTheDocument();
  });

  it("should render restore aria labels for all entity types", () => {
    renderDeletedPage({
      tasks: [buildTask({ name: "T1", is_deleted: true })],
      goals: [buildGoal({ name: "G1", is_deleted: true })],
      ideas: [buildIdea({ name: "I1", is_deleted: true })],
      contexts: [buildContext({ name: "X1", is_deleted: true })],
      categories: [buildCategory({ name: "C1", is_deleted: true })],
    });

    expect(screen.getByLabelText("Восстановить T1")).toBeInTheDocument();
    expect(screen.getByLabelText("Восстановить G1")).toBeInTheDocument();
    expect(screen.getByLabelText("Восстановить I1")).toBeInTheDocument();
    expect(screen.getByLabelText("Восстановить X1")).toBeInTheDocument();
    expect(screen.getByLabelText("Восстановить C1")).toBeInTheDocument();
  });

  it("should render checklist item with parent task name", () => {
    const parentTaskId = crypto.randomUUID();
    const taskNameMap = new Map([[parentTaskId, "Parent Task"]]);

    renderDeletedPage({
      checklistItems: [
        buildChecklistItem({
          name: "Check item",
          task_id: parentTaskId,
          is_deleted: true,
        }),
      ],
      taskNameMap,
    });

    expect(screen.getByText("Check item")).toBeInTheDocument();
    expect(screen.getByText("Задача: Parent Task")).toBeInTheDocument();
    expect(
      screen.getByLabelText("Восстановить Check item"),
    ).toBeInTheDocument();
  });

  it("should not show parent task name when not available", () => {
    renderDeletedPage({
      checklistItems: [
        buildChecklistItem({ name: "Orphan item", is_deleted: true }),
      ],
      taskNameMap: new Map(),
    });

    expect(screen.getByText("Orphan item")).toBeInTheDocument();
    expect(screen.queryByText(/Задача:/)).not.toBeInTheDocument();
  });

  it("should render swipeable containers for all entity types", () => {
    renderDeletedPage({
      tasks: [buildTask({ is_deleted: true })],
      goals: [buildGoal({ is_deleted: true })],
      ideas: [buildIdea({ is_deleted: true })],
      contexts: [buildContext({ is_deleted: true })],
      categories: [buildCategory({ is_deleted: true })],
    });

    const swipeableContainers = screen.getAllByTestId("swipeable-container");
    expect(swipeableContainers).toHaveLength(5);
  });
});

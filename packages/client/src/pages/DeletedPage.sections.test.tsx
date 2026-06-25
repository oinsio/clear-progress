/**
 * Tests for DeletedPage — CollapsibleSection behavior, counts, aria.
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

describe("DeletedPage sections", () => {
  it("should show item count in section header when items exist", () => {
    renderDeletedPage({
      tasks: [
        buildTask({ name: "A", is_deleted: true }),
        buildTask({ name: "B", is_deleted: true }),
      ],
    });

    expect(screen.getByText("(2)")).toBeInTheDocument();
  });

  it("should not show count when section has zero items", () => {
    renderDeletedPage({
      tasks: [buildTask({ is_deleted: true })],
    });

    const countElements = screen.queryAllByText(/^\(\d+\)$/);
    expect(countElements).toHaveLength(1);
    expect(countElements[0]).toHaveTextContent("(1)");
  });

  it("should mark section headers as aria-expanded true", () => {
    renderDeletedPage({
      tasks: [buildTask({ is_deleted: true })],
    });

    const sectionButtons = screen.getAllByRole("button", {
      expanded: true,
    });
    expect(sectionButtons.length).toBeGreaterThanOrEqual(1);
  });

  it("should show section empty text for sections without items", () => {
    renderDeletedPage({
      tasks: [buildTask({ is_deleted: true })],
    });

    const emptyTexts = screen.getAllByText("Нет удалённых");
    expect(emptyTexts.length).toBeGreaterThanOrEqual(1);
  });

  it("should not show sections at all when loading", () => {
    renderDeletedPage({ isLoading: true });

    expect(screen.queryByText("Задачи")).not.toBeInTheDocument();
    expect(screen.queryByText("Цели")).not.toBeInTheDocument();
  });

  it("should not show sections when empty and not loading", () => {
    renderDeletedPage({ isLoading: false });

    expect(screen.queryByText("Задачи")).not.toBeInTheDocument();
  });

  it("should render swipe background for tasks", () => {
    renderDeletedPage({
      tasks: [buildTask({ name: "Swipe task", is_deleted: true })],
    });

    const backgrounds = screen.getAllByTestId("swipe-background-left");
    expect(backgrounds.length).toBeGreaterThanOrEqual(1);
    expect(backgrounds[0].className).toContain("bg-blue-500");
  });

  it("should render swipe background for goals", () => {
    renderDeletedPage({
      goals: [buildGoal({ name: "Swipe goal", is_deleted: true })],
    });

    const backgrounds = screen.getAllByTestId("swipe-background-left");
    expect(backgrounds[0].className).toContain("bg-blue-500");
  });

  it("should render swipe background for ideas", () => {
    renderDeletedPage({
      ideas: [buildIdea({ name: "Swipe idea", is_deleted: true })],
    });

    const backgrounds = screen.getAllByTestId("swipe-background-left");
    expect(backgrounds[0].className).toContain("bg-blue-500");
  });

  it("should render swipe background for contexts", () => {
    renderDeletedPage({
      contexts: [buildContext({ name: "Swipe ctx", is_deleted: true })],
    });

    const backgrounds = screen.getAllByTestId("swipe-background-left");
    expect(backgrounds[0].className).toContain("bg-blue-500");
  });

  it("should render swipe background for categories", () => {
    renderDeletedPage({
      categories: [buildCategory({ name: "Swipe cat", is_deleted: true })],
    });

    const backgrounds = screen.getAllByTestId("swipe-background-left");
    expect(backgrounds[0].className).toContain("bg-blue-500");
  });

  it("should render swipe background for checklist items", () => {
    renderDeletedPage({
      checklistItems: [
        buildChecklistItem({ name: "Swipe cl", is_deleted: true }),
      ],
    });

    const backgrounds = screen.getAllByTestId("swipe-background-left");
    expect(backgrounds[0].className).toContain("bg-blue-500");
  });
});

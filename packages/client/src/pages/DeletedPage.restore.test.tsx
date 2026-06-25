/**
 * Tests for DeletedPage — restore button click handlers.
 * Implements FR18, FR21, UX1 of swipeable-item.
 */
import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { buildCategory } from "@/test/factories/categoryFactory";
import { buildChecklistItem } from "@/test/factories/checklistItemFactory";
import { buildContext } from "@/test/factories/contextFactory";
import { buildGoal } from "@/test/factories/goalFactory";
import { buildIdea } from "@/test/factories/ideaFactory";
import { buildTask } from "@/test/factories/taskFactory";
import {
  MOCK_RESTORE_ENTITY,
  renderDeletedPage,
} from "./deletedPage.testSetup";

describe("DeletedPage restore", () => {
  it("should call restoreTask when task restore button is clicked", () => {
    const task = buildTask({ name: "Restore me", is_deleted: true });
    renderDeletedPage({ tasks: [task] });

    fireEvent.click(screen.getByLabelText("Восстановить Restore me"));
    expect(MOCK_RESTORE_ENTITY.restoreTask).toHaveBeenCalledWith(task.id);
  });

  it("should call restoreGoal when goal restore button is clicked", () => {
    const goal = buildGoal({ name: "Goal restore", is_deleted: true });
    renderDeletedPage({ goals: [goal] });

    fireEvent.click(screen.getByLabelText("Восстановить Goal restore"));
    expect(MOCK_RESTORE_ENTITY.restoreGoal).toHaveBeenCalledWith(goal.id);
  });

  it("should call restoreIdea when idea restore button is clicked", () => {
    const idea = buildIdea({ name: "Idea restore", is_deleted: true });
    renderDeletedPage({ ideas: [idea] });

    fireEvent.click(screen.getByLabelText("Восстановить Idea restore"));
    expect(MOCK_RESTORE_ENTITY.restoreIdea).toHaveBeenCalledWith(idea.id);
  });

  it("should call restoreContext when context restore button is clicked", () => {
    const context = buildContext({ name: "Ctx restore", is_deleted: true });
    renderDeletedPage({ contexts: [context] });

    fireEvent.click(screen.getByLabelText("Восстановить Ctx restore"));
    expect(MOCK_RESTORE_ENTITY.restoreContext).toHaveBeenCalledWith(context.id);
  });

  it("should call restoreCategory when category restore button is clicked", () => {
    const category = buildCategory({ name: "Cat restore", is_deleted: true });
    renderDeletedPage({ categories: [category] });

    fireEvent.click(screen.getByLabelText("Восстановить Cat restore"));
    expect(MOCK_RESTORE_ENTITY.restoreCategory).toHaveBeenCalledWith(
      category.id,
    );
  });

  it("should call restoreChecklistItem when checklist restore is clicked", () => {
    const checklistItem = buildChecklistItem({
      name: "CL restore",
      is_deleted: true,
    });
    renderDeletedPage({ checklistItems: [checklistItem] });

    fireEvent.click(screen.getByLabelText("Восстановить CL restore"));
    expect(MOCK_RESTORE_ENTITY.restoreChecklistItem).toHaveBeenCalledWith(
      checklistItem.id,
    );
  });
});

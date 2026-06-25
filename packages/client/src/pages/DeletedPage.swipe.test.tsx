/**
 * Tests for DeletedPage — swipeRight.onAction callbacks via SwipeableItem mock.
 * Implements FR21 of swipeable-item.
 */

import { describe, expect, it, vi } from "vitest";
import type { SwipeableItemProps } from "@/components/shared/SwipeableItem";
import type { DeletedEntities } from "@/hooks/useDeletedEntities";
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

const capturedOnActions: Array<() => void> = [];

vi.mock("@/components/shared/SwipeableItem", () => ({
  SwipeableItem: ({ children, swipeRight }: SwipeableItemProps) => {
    if (swipeRight?.onAction) {
      capturedOnActions.push(swipeRight.onAction);
    }
    return <div data-testid="swipeable-container">{children}</div>;
  },
}));

function setup(entityOverrides: Partial<DeletedEntities>) {
  capturedOnActions.length = 0;
  renderDeletedPage(entityOverrides);
}

describe("DeletedPage swipe onAction", () => {
  it("should pass task restore as swipeRight.onAction", () => {
    const task = buildTask({ is_deleted: true });
    setup({ tasks: [task] });

    expect(capturedOnActions).toHaveLength(1);
    capturedOnActions[0]();
    expect(MOCK_RESTORE_ENTITY.restoreTask).toHaveBeenCalledWith(task.id);
  });

  it("should pass goal restore as swipeRight.onAction", () => {
    const goal = buildGoal({ is_deleted: true });
    setup({ goals: [goal] });

    expect(capturedOnActions).toHaveLength(1);
    capturedOnActions[0]();
    expect(MOCK_RESTORE_ENTITY.restoreGoal).toHaveBeenCalledWith(goal.id);
  });

  it("should pass idea restore as swipeRight.onAction", () => {
    const idea = buildIdea({ is_deleted: true });
    setup({ ideas: [idea] });

    expect(capturedOnActions).toHaveLength(1);
    capturedOnActions[0]();
    expect(MOCK_RESTORE_ENTITY.restoreIdea).toHaveBeenCalledWith(idea.id);
  });

  it("should pass context restore as swipeRight.onAction", () => {
    const context = buildContext({ is_deleted: true });
    setup({ contexts: [context] });

    expect(capturedOnActions).toHaveLength(1);
    capturedOnActions[0]();
    expect(MOCK_RESTORE_ENTITY.restoreContext).toHaveBeenCalledWith(context.id);
  });

  it("should pass category restore as swipeRight.onAction", () => {
    const category = buildCategory({ is_deleted: true });
    setup({ categories: [category] });

    expect(capturedOnActions).toHaveLength(1);
    capturedOnActions[0]();
    expect(MOCK_RESTORE_ENTITY.restoreCategory).toHaveBeenCalledWith(
      category.id,
    );
  });

  it("should pass checklist item restore as swipeRight.onAction", () => {
    const checklistItem = buildChecklistItem({ is_deleted: true });
    setup({ checklistItems: [checklistItem] });

    expect(capturedOnActions).toHaveLength(1);
    capturedOnActions[0]();
    expect(MOCK_RESTORE_ENTITY.restoreChecklistItem).toHaveBeenCalledWith(
      checklistItem.id,
    );
  });
});

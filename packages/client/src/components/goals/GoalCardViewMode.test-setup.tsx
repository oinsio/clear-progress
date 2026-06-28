import { cleanup, render } from "@testing-library/react";
import { afterEach, beforeEach, vi } from "vitest";
import type { Goal } from "@/types/entities";
import { GoalCardViewMode } from "./GoalCardViewMode";

export const BASE_GOAL: Goal = {
  id: "00000000-0000-0000-0000-000000000001",
  name: "Test Goal",
  description: "",
  cover_hash: "",
  status: "in_progress",
  sort_order: "0",
  is_deleted: false,
  created_at: "2026-01-01T00:00:00.000Z" as Goal["created_at"],
  updated_at: "2026-01-01T00:00:00.000Z" as Goal["updated_at"],
  revision: 1,
  syncStatus: "synced" as const,
};

export function createGoal(overrides: Partial<Goal> = {}): Goal {
  return { ...BASE_GOAL, ...overrides };
}

export interface RenderOptions {
  goal?: Goal;
  existingCoverUrl?: string | null;
  isFocused?: boolean;
  showCompleted?: boolean;
}

export function renderViewMode(options: RenderOptions = {}) {
  const {
    goal = createGoal(),
    existingCoverUrl = null,
    isFocused = false,
    showCompleted = false,
  } = options;

  const onFocusToggle = vi.fn();
  const onShowCompletedToggle = vi.fn();
  const onStartEdit = vi.fn();

  const result = render(
    <GoalCardViewMode
      goal={goal}
      existingCoverUrl={existingCoverUrl}
      isFocused={isFocused}
      showCompleted={showCompleted}
      onFocusToggle={onFocusToggle}
      onShowCompletedToggle={onShowCompletedToggle}
      onStartEdit={onStartEdit}
    />,
  );

  return { onFocusToggle, onShowCompletedToggle, onStartEdit, ...result };
}

export function useOverflowSetup() {
  let originalScrollHeight: PropertyDescriptor | undefined;
  let originalClientHeight: PropertyDescriptor | undefined;

  beforeEach(() => {
    originalScrollHeight = Object.getOwnPropertyDescriptor(
      HTMLElement.prototype,
      "scrollHeight",
    );
    originalClientHeight = Object.getOwnPropertyDescriptor(
      HTMLElement.prototype,
      "clientHeight",
    );
  });

  afterEach(() => {
    if (originalScrollHeight) {
      Object.defineProperty(
        HTMLElement.prototype,
        "scrollHeight",
        originalScrollHeight,
      );
    }
    if (originalClientHeight) {
      Object.defineProperty(
        HTMLElement.prototype,
        "clientHeight",
        originalClientHeight,
      );
    }
    cleanup();
    vi.restoreAllMocks();
  });
}

export function simulateOverflow() {
  Object.defineProperty(HTMLElement.prototype, "scrollHeight", {
    configurable: true,
    get() {
      return 200;
    },
  });
  Object.defineProperty(HTMLElement.prototype, "clientHeight", {
    configurable: true,
    get() {
      return 40;
    },
  });
}

export function simulateNoOverflow() {
  Object.defineProperty(HTMLElement.prototype, "scrollHeight", {
    configurable: true,
    get() {
      return 20;
    },
  });
  Object.defineProperty(HTMLElement.prototype, "clientHeight", {
    configurable: true,
    get() {
      return 40;
    },
  });
}

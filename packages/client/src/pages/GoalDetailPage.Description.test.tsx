import { fireEvent, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { buildGoalHook } from "@/test/builders/hookBuilders";
import { buildGoal } from "@/test/factories/goalFactory";
import {
  mockUseGoal,
  renderPage,
  setupDefaultMocks,
} from "./GoalDetailPage.test-setup";

const originalScrollHeight = Object.getOwnPropertyDescriptor(
  HTMLElement.prototype,
  "scrollHeight",
);
const originalClientHeight = Object.getOwnPropertyDescriptor(
  HTMLElement.prototype,
  "clientHeight",
);

function simulateOverflow() {
  Object.defineProperty(HTMLElement.prototype, "scrollHeight", {
    value: 100,
    configurable: true,
  });
  Object.defineProperty(HTMLElement.prototype, "clientHeight", {
    value: 40,
    configurable: true,
  });
}

beforeEach(() => {
  setupDefaultMocks();
  // Default: no overflow (scrollHeight <= clientHeight)
  Object.defineProperty(HTMLElement.prototype, "scrollHeight", {
    value: 20,
    configurable: true,
  });
  Object.defineProperty(HTMLElement.prototype, "clientHeight", {
    value: 40,
    configurable: true,
  });
  global.ResizeObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  }));
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
});

function setupOverflowGoal(description: string) {
  simulateOverflow();
  mockUseGoal.mockReturnValue(
    buildGoalHook({
      goal: buildGoal({ name: "Моя цель", description }),
    }),
  );
}

// FR3, FR4: collapsible description
describe("GoalDetailPage — Collapsible description", () => {
  it("should not show toggle when description is short", () => {
    mockUseGoal.mockReturnValue(
      buildGoalHook({
        goal: buildGoal({
          name: "Моя цель",
          description: "Короткое описание",
        }),
      }),
    );

    renderPage();

    expect(screen.getByText("Короткое описание")).toBeInTheDocument();
    expect(screen.queryByTestId("details-toggle")).not.toBeInTheDocument();
  });

  it("should show toggle when description overflows", () => {
    setupOverflowGoal("Длинное описание, которое не помещается в две строки");

    renderPage();

    expect(screen.getByTestId("details-toggle")).toBeInTheDocument();
  });

  it("should expand and collapse description", () => {
    setupOverflowGoal("Длинное описание");

    renderPage();

    const toggleButton = screen.getByTestId("details-toggle");
    expect(toggleButton).toHaveAttribute("aria-expanded", "false");

    fireEvent.click(toggleButton);

    expect(toggleButton).toHaveAttribute("aria-expanded", "true");

    fireEvent.click(toggleButton);

    expect(toggleButton).toHaveAttribute("aria-expanded", "false");
  });

  it("should not render description row when description is empty", () => {
    mockUseGoal.mockReturnValue(
      buildGoalHook({
        goal: buildGoal({
          name: "Моя цель",
          description: "",
        }),
      }),
    );

    renderPage();

    expect(screen.getByText("Моя цель")).toBeInTheDocument();
    expect(screen.queryByTestId("details-toggle")).not.toBeInTheDocument();
  });
});

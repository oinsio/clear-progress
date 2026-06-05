import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import {
  createGoal,
  renderViewMode,
  simulateOverflow,
  useOverflowSetup,
} from "./GoalCardViewMode.test-setup";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock("@/assets/default-goal-cover.svg", () => ({
  default: "default-cover.svg",
}));

vi.mock("@/components/goals/GoalStatusBadge", () => ({
  GoalStatusBadge: ({ status }: { status: string }) => (
    <span data-testid="goal-status-badge">{status}</span>
  ),
}));

vi.mock("@/components/ui/LinkedText", () => ({
  LinkedText: ({ text, className }: { text: string; className?: string }) => (
    <span className={className}>{text}</span>
  ),
}));

vi.mock("@/components/goals/CoverLightbox", () => ({
  CoverLightbox: ({
    onClose,
    imageUrl,
    imageAlt,
  }: {
    onClose: () => void;
    imageUrl: string;
    imageAlt: string;
  }) => (
    <div data-testid="cover-lightbox" data-url={imageUrl} data-alt={imageAlt}>
      <button data-testid="close-lightbox" onClick={onClose}>
        Close
      </button>
    </div>
  ),
}));

// FR1, FR4: description rendering, overflow, and expand/collapse
describe("GoalCardViewMode — description", () => {
  useOverflowSetup();

  describe("description", () => {
    it("should not render description section when empty", () => {
      renderViewMode({ goal: createGoal({ description: "" }) });

      expect(
        screen.queryByTestId("description-toggle"),
      ).not.toBeInTheDocument();
    });

    it("should render description text when present", () => {
      renderViewMode({
        goal: createGoal({ description: "A long description" }),
      });

      expect(screen.getByText("A long description")).toBeInTheDocument();
    });

    it("should not show toggle button when description does not overflow", () => {
      renderViewMode({
        goal: createGoal({ description: "Short description" }),
      });

      expect(
        screen.queryByTestId("description-toggle"),
      ).not.toBeInTheDocument();
    });

    it("should apply line-clamp-2 when description is not expanded", () => {
      renderViewMode({
        goal: createGoal({ description: "Some description" }),
      });

      const descriptionContainer = screen
        .getByText("Some description")
        .closest("div[class*='min-w-0']") as HTMLElement;
      expect(descriptionContainer?.className).toContain("line-clamp-2");
    });
  });

  describe("description overflow and expand/collapse", () => {
    it("should not show toggle when scrollHeight equals clientHeight", () => {
      Object.defineProperty(HTMLElement.prototype, "scrollHeight", {
        configurable: true,
        get() {
          return 40;
        },
      });
      Object.defineProperty(HTMLElement.prototype, "clientHeight", {
        configurable: true,
        get() {
          return 40;
        },
      });

      renderViewMode({
        goal: createGoal({ description: "Exact fit description" }),
      });

      expect(
        screen.queryByTestId("description-toggle"),
      ).not.toBeInTheDocument();
    });

    it("should show expand button when description overflows", () => {
      simulateOverflow();

      renderViewMode({
        goal: createGoal({ description: "Overflowing text content" }),
      });

      expect(screen.getByTestId("description-toggle")).toBeInTheDocument();
      expect(screen.getByTestId("description-toggle")).toHaveAttribute(
        "aria-expanded",
        "false",
      );
      expect(screen.getByTestId("description-toggle")).toHaveAttribute(
        "aria-label",
        "goal.expandDescription",
      );
    });

    it("should toggle expand state and update aria-label on click", () => {
      simulateOverflow();

      renderViewMode({
        goal: createGoal({ description: "Overflowing text content" }),
      });

      const toggleButton = screen.getByTestId("description-toggle");
      fireEvent.click(toggleButton);

      expect(toggleButton).toHaveAttribute("aria-expanded", "true");
      expect(toggleButton).toHaveAttribute(
        "aria-label",
        "goal.collapseDescription",
      );
    });

    it("should remove line-clamp-2 when expanded", () => {
      simulateOverflow();

      renderViewMode({
        goal: createGoal({ description: "Overflowing text" }),
      });

      const descriptionContainer = screen
        .getByText("Overflowing text")
        .closest("div[class*='min-w-0']") as HTMLElement;
      expect(descriptionContainer.className).toContain("line-clamp-2");

      fireEvent.click(screen.getByTestId("description-toggle"));

      expect(descriptionContainer.className).not.toContain("line-clamp-2");
    });
  });
});

import { fireEvent, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { renderViewMode } from "./GoalCardViewMode.test-setup";

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

vi.mock("@/hooks/useAttachments", () => ({
  useAttachments: () => ({ attachments: [], isLoading: false }),
}));

vi.mock("@/components/shared/AttachmentList", () => ({
  AttachmentList: () => null,
}));

// FR3, FR5: focus and show-completed toggle buttons
describe("GoalCardViewMode — toggles", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("focus toggle button", () => {
    it("should call onFocusToggle when clicked", () => {
      const { onFocusToggle } = renderViewMode();

      fireEvent.click(screen.getByTestId("focus-icon"));

      expect(onFocusToggle).toHaveBeenCalledOnce();
    });

    it("should show remove-from-focus label when focused", () => {
      renderViewMode({ isFocused: true });

      const focusButton = screen.getByTestId("focus-icon");
      expect(focusButton).toHaveAttribute("aria-label", "goal.removeFromFocus");
      expect(focusButton).toHaveAttribute("aria-pressed", "true");
    });

    it("should show add-to-focus label when not focused", () => {
      renderViewMode({ isFocused: false });

      const focusButton = screen.getByTestId("focus-icon");
      expect(focusButton).toHaveAttribute("aria-label", "goal.addToFocus");
      expect(focusButton).toHaveAttribute("aria-pressed", "false");
    });

    it("should apply accent styling when focused", () => {
      renderViewMode({ isFocused: true });

      const focusButton = screen.getByTestId("focus-icon");
      expect(focusButton.className).toContain("text-accent");
    });

    it("should apply gray styling when not focused", () => {
      renderViewMode({ isFocused: false });

      const focusButton = screen.getByTestId("focus-icon");
      expect(focusButton.className).toContain("text-gray-400");
    });

    it("should apply base button classes to focus toggle", () => {
      renderViewMode();

      const focusButton = screen.getByTestId("focus-icon");
      expect(focusButton.className).toContain("w-8");
    });
  });

  describe("show completed toggle button", () => {
    it("should call onShowCompletedToggle when clicked", () => {
      const { onShowCompletedToggle } = renderViewMode();

      fireEvent.click(screen.getByTestId("toggle-completed-button"));

      expect(onShowCompletedToggle).toHaveBeenCalledOnce();
    });

    it("should show hide-completed label when showing completed", () => {
      renderViewMode({ showCompleted: true });

      const toggleButton = screen.getByTestId("toggle-completed-button");
      expect(toggleButton).toHaveAttribute("aria-label", "goal.hideCompleted");
    });

    it("should show show-completed label when not showing completed", () => {
      renderViewMode({ showCompleted: false });

      const toggleButton = screen.getByTestId("toggle-completed-button");
      expect(toggleButton).toHaveAttribute("aria-label", "goal.showCompleted");
    });

    it("should apply green styling when showing completed", () => {
      renderViewMode({ showCompleted: true });

      const toggleButton = screen.getByTestId("toggle-completed-button");
      expect(toggleButton.className).toContain("text-green-600");
    });

    it("should apply gray styling when not showing completed", () => {
      renderViewMode({ showCompleted: false });

      const toggleButton = screen.getByTestId("toggle-completed-button");
      expect(toggleButton.className).toContain("text-gray-400");
    });

    it("should apply base button classes to completed toggle", () => {
      renderViewMode();

      const toggleButton = screen.getByTestId("toggle-completed-button");
      expect(toggleButton.className).toContain("w-8");
    });
  });
});

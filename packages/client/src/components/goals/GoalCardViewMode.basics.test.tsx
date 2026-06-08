import { fireEvent, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createGoal, renderViewMode } from "./GoalCardViewMode.test-setup";

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

vi.mock("@/hooks/useAttachments", () => ({
  useAttachments: () => ({ attachments: [], isLoading: false }),
}));

vi.mock("@/components/shared/AttachmentList", () => ({
  AttachmentList: () => null,
}));

// FR1, FR3: goal name, status, and edit button
describe("GoalCardViewMode — basics", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("goal name and status", () => {
    it("should render goal name", () => {
      renderViewMode({ goal: createGoal({ name: "My Goal" }) });

      expect(screen.getByText("My Goal")).toBeInTheDocument();
    });

    it("should render goal status badge", () => {
      renderViewMode({ goal: createGoal({ status: "paused" }) });

      expect(screen.getByTestId("goal-status-badge")).toHaveTextContent(
        "paused",
      );
    });
  });

  describe("edit button", () => {
    it("should call onStartEdit when clicked", () => {
      const { onStartEdit } = renderViewMode();

      fireEvent.click(screen.getByTestId("edit-goal-button"));

      expect(onStartEdit).toHaveBeenCalledOnce();
    });

    it("should have correct aria-label", () => {
      renderViewMode();

      const editButton = screen.getByTestId("edit-goal-button");
      expect(editButton).toHaveAttribute("aria-label", "goal.editName");
    });
  });
});

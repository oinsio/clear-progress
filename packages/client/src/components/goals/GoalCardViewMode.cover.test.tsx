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

const EXAMPLE_COVER_URL = "https://example.com/cover.jpg";

// FR1, FR4: cover circle and lightbox
describe("GoalCardViewMode — cover", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("cover circle", () => {
    it("should render default cover when no existing cover url", () => {
      renderViewMode({ existingCoverUrl: null });

      const coverCircle = screen.getByTestId("cover-circle");
      const coverImage = coverCircle.querySelector("img");
      expect(coverImage).toHaveAttribute("src", "default-cover.svg");
      expect(coverImage).toHaveAttribute("aria-hidden", "true");
    });

    it("should render clickable cover when existing cover url is present", () => {
      renderViewMode({ existingCoverUrl: EXAMPLE_COVER_URL });

      const coverCircle = screen.getByTestId("cover-circle");
      expect(coverCircle.tagName).toBe("BUTTON");
      expect(coverCircle).toHaveAttribute("aria-label", "goal.cover.viewFull");
    });

    it("should show goal name as cover alt when cover exists", () => {
      renderViewMode({
        goal: createGoal({ name: "Named Goal" }),
        existingCoverUrl: EXAMPLE_COVER_URL,
      });

      const coverImage = screen
        .getByTestId("cover-circle")
        .querySelector("img");
      expect(coverImage).toHaveAttribute("alt", "Named Goal");
    });

    it("should render non-clickable div for default cover", () => {
      renderViewMode({ existingCoverUrl: null });

      const coverCircle = screen.getByTestId("cover-circle");
      expect(coverCircle.tagName).toBe("DIV");
    });
  });

  describe("lightbox", () => {
    it("should open lightbox when clicking cover circle with real cover", () => {
      renderViewMode({ existingCoverUrl: EXAMPLE_COVER_URL });

      expect(screen.queryByTestId("cover-lightbox")).not.toBeInTheDocument();

      fireEvent.click(screen.getByTestId("cover-circle"));

      expect(screen.getByTestId("cover-lightbox")).toBeInTheDocument();
    });

    it("should close lightbox when onClose is called", () => {
      renderViewMode({ existingCoverUrl: EXAMPLE_COVER_URL });

      fireEvent.click(screen.getByTestId("cover-circle"));
      expect(screen.getByTestId("cover-lightbox")).toBeInTheDocument();

      fireEvent.click(screen.getByTestId("close-lightbox"));

      expect(screen.queryByTestId("cover-lightbox")).not.toBeInTheDocument();
    });
  });
});

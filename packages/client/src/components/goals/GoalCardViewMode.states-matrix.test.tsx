import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import {
  createGoal,
  renderViewMode,
  simulateNoOverflow,
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

vi.mock("@/hooks/useAttachments", () => ({
  useAttachments: () => ({ attachments: [], isLoading: false }),
}));

vi.mock("@/components/shared/AttachmentList", () => ({
  AttachmentList: () => null,
}));

const LONG_DESCRIPTION = "A very long description that overflows the container";

function expectNoDescriptionRow() {
  const descriptionTexts = screen.queryAllByText(/.+/);
  const hasDescriptionRow = descriptionTexts.some(
    (element) => element.closest("div[class*='min-w-0']") !== null,
  );
  expect(hasDescriptionRow).toBe(false);
}

// M1: all 6 UI states from States Matrix
describe("GoalCardViewMode — UI States Matrix", () => {
  useOverflowSetup();

  it("State 1: no cover, short description — default SVG div, full text, no toggle, 3-row", () => {
    simulateNoOverflow();

    renderViewMode({
      goal: createGoal({ description: "Short text" }),
      existingCoverUrl: null,
    });

    const coverCircle = screen.getByTestId("cover-circle");
    expect(coverCircle.tagName).toBe("DIV");

    expect(screen.getByText("Short text")).toBeInTheDocument();
    expect(screen.queryByTestId("details-toggle")).not.toBeInTheDocument();
  });

  it("State 2: has cover, short description — clickable button, full text, no toggle, 3-row", () => {
    simulateNoOverflow();

    renderViewMode({
      goal: createGoal({ description: "Short text" }),
      existingCoverUrl: "https://example.com/cover.jpg",
    });

    const coverCircle = screen.getByTestId("cover-circle");
    expect(coverCircle.tagName).toBe("BUTTON");
    expect(coverCircle).toHaveAttribute("aria-label", "goal.cover.viewFull");

    expect(screen.getByText("Short text")).toBeInTheDocument();
    expect(screen.queryByTestId("details-toggle")).not.toBeInTheDocument();
  });

  it("State 3: has cover, long description — clickable button, truncated with toggle, 3-row", () => {
    simulateOverflow();

    renderViewMode({
      goal: createGoal({
        description: LONG_DESCRIPTION,
      }),
      existingCoverUrl: "https://example.com/cover.jpg",
    });

    const coverCircle = screen.getByTestId("cover-circle");
    expect(coverCircle.tagName).toBe("BUTTON");
    expect(coverCircle).toHaveAttribute("aria-label", "goal.cover.viewFull");

    expect(screen.getByText(LONG_DESCRIPTION)).toBeInTheDocument();
    expect(screen.getByTestId("details-toggle")).toBeInTheDocument();
    expect(screen.getByTestId("details-toggle")).toHaveAttribute(
      "aria-expanded",
      "false",
    );
  });

  it("State 4: no cover, long description — default SVG div, truncated with toggle, 3-row", () => {
    simulateOverflow();

    renderViewMode({
      goal: createGoal({
        description: LONG_DESCRIPTION,
      }),
      existingCoverUrl: null,
    });

    const coverCircle = screen.getByTestId("cover-circle");
    expect(coverCircle.tagName).toBe("DIV");

    expect(screen.getByText(LONG_DESCRIPTION)).toBeInTheDocument();
    expect(screen.getByTestId("details-toggle")).toBeInTheDocument();
    expect(screen.getByTestId("details-toggle")).toHaveAttribute(
      "aria-expanded",
      "false",
    );
  });

  it("State 5: no cover, no description — default SVG div, no description row, 2-row", () => {
    renderViewMode({
      goal: createGoal({ description: "" }),
      existingCoverUrl: null,
    });

    const coverCircle = screen.getByTestId("cover-circle");
    expect(coverCircle.tagName).toBe("DIV");

    expect(screen.queryByTestId("details-toggle")).not.toBeInTheDocument();
    expectNoDescriptionRow();
  });

  it("State 6: has cover, no description — clickable button, no description row, 2-row", () => {
    renderViewMode({
      goal: createGoal({ description: "" }),
      existingCoverUrl: "https://example.com/cover.jpg",
    });

    const coverCircle = screen.getByTestId("cover-circle");
    expect(coverCircle.tagName).toBe("BUTTON");
    expect(coverCircle).toHaveAttribute("aria-label", "goal.cover.viewFull");

    expect(screen.queryByTestId("details-toggle")).not.toBeInTheDocument();
    expectNoDescriptionRow();
  });
});

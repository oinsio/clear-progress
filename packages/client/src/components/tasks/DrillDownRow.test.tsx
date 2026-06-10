import { cleanup, render, screen } from "@testing-library/react";
import { Star } from "lucide-react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DrillDownRow } from "./DrillDownRow";

// Implements FR1, NFR-A1 of icons-for-task-detail

const DEFAULT_PROPS = {
  label: "Priority",
  value: "High",
  hasValue: true,
  onClick: vi.fn(),
};

describe("DrillDownRow icon prop", () => {
  afterEach(() => {
    cleanup();
  });

  it("should render icon SVG with aria-hidden when icon prop is provided", () => {
    render(<DrillDownRow {...DEFAULT_PROPS} icon={Star} />);

    const iconElement = screen.getByRole("button").querySelector("svg");
    expect(iconElement).toBeInTheDocument();
    expect(iconElement).toHaveAttribute("aria-hidden", "true");
  });

  it("should not render icon SVG when icon prop is omitted", () => {
    render(<DrillDownRow {...DEFAULT_PROPS} />);

    const buttonElement = screen.getByRole("button");
    const svgElements = buttonElement.querySelectorAll("svg");

    // Only the ChevronRight SVG should be present (on the right side)
    expect(svgElements).toHaveLength(1);
  });
});

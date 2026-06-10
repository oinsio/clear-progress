import { fireEvent, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import {
  mockUseFileUrl,
  renderPage,
  setupDefaultMocks,
} from "./GoalDetailPage.test-setup";

beforeEach(() => {
  setupDefaultMocks();
});

describe("GoalDetailPage — Cover circle", () => {
  // FR1: cover circle clickability
  it("should render cover circle as clickable button when real cover exists", () => {
    mockUseFileUrl.mockReturnValue({ url: "https://example.com/cover.jpg" });

    renderPage();

    const coverCircle = screen.getByTestId("cover-circle");
    expect(coverCircle.tagName).toBe("BUTTON");
  });

  // FR1: cover circle clickability
  it("should render cover circle as non-interactive div when no cover", () => {
    mockUseFileUrl.mockReturnValue({ url: null });

    renderPage();

    const coverCircle = screen.getByTestId("cover-circle");
    expect(coverCircle.tagName).toBe("DIV");
  });

  // FR1: cover circle clickability
  it("should open lightbox when clicking cover with real cover", () => {
    mockUseFileUrl.mockReturnValue({ url: "https://example.com/cover.jpg" });

    renderPage();

    const coverCircle = screen.getByTestId("cover-circle");
    fireEvent.click(coverCircle);

    expect(screen.getByTestId("cover-lightbox")).toBeInTheDocument();
  });

  // FR1: cover circle clickability
  it("should show hover scale class when real cover exists", () => {
    mockUseFileUrl.mockReturnValue({ url: "https://example.com/cover.jpg" });

    renderPage();

    const coverCircle = screen.getByTestId("cover-circle");
    expect(coverCircle.className).toContain("hover:scale-110");
  });

  // FR1: cover circle clickability
  it("should not show hover scale class when no cover", () => {
    mockUseFileUrl.mockReturnValue({ url: null });

    renderPage();

    const coverCircle = screen.getByTestId("cover-circle");
    expect(coverCircle.className).not.toContain("hover:scale-110");
  });
});

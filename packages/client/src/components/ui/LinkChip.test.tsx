import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { LinkChip } from "./LinkChip";

// implements FR9, FR4, FR5 of markdown-in-descriptions

describe("LinkChip", () => {
  const TEST_HREF = "https://example.com/some/path";
  const TEST_TEXT = "Example";

  it("should render link emoji icon", () => {
    render(<LinkChip href={TEST_HREF}>{TEST_TEXT}</LinkChip>);

    const link = screen.getByRole("link");
    expect(link).toHaveTextContent("🔗");
  });

  it("should render children text", () => {
    render(<LinkChip href={TEST_HREF}>{TEST_TEXT}</LinkChip>);

    expect(screen.getByText(TEST_TEXT)).toBeInTheDocument();
  });

  it("should have correct href attribute", () => {
    render(<LinkChip href={TEST_HREF}>{TEST_TEXT}</LinkChip>);

    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", TEST_HREF);
  });

  // FR5: Links open in a new tab
  it("should have target _blank attribute", () => {
    render(<LinkChip href={TEST_HREF}>{TEST_TEXT}</LinkChip>);

    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("target", "_blank");
  });

  // FR5: Links open in a new tab with security attributes
  it("should have rel noopener noreferrer attribute", () => {
    render(<LinkChip href={TEST_HREF}>{TEST_TEXT}</LinkChip>);

    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("should have title attribute with full href", () => {
    render(<LinkChip href={TEST_HREF}>{TEST_TEXT}</LinkChip>);

    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("title", TEST_HREF);
  });

  // FR4: Clicking a link calls stopPropagation
  it("should stop click propagation", async () => {
    const user = userEvent.setup();
    const handleParentClick = vi.fn();

    render(
      <div onClick={handleParentClick}>
        <LinkChip href={TEST_HREF}>{TEST_TEXT}</LinkChip>
      </div>,
    );

    const link = screen.getByRole("link");
    await user.click(link);

    expect(handleParentClick).not.toHaveBeenCalled();
  });

  // FR9: Blue background highlight styling
  it("should apply blue background styling classes", () => {
    render(<LinkChip href={TEST_HREF}>{TEST_TEXT}</LinkChip>);

    const link = screen.getByRole("link");
    expect(link).toHaveClass("bg-blue-600/5");
    expect(link).toHaveClass("text-blue-600");
    expect(link).toHaveClass("rounded");
  });

  // FR9: Truncation for long text
  it("should apply truncation class on text span", () => {
    const longText = "Very long link text that should be truncated";
    render(<LinkChip href={TEST_HREF}>{longText}</LinkChip>);

    const textSpan = screen.getByText(longText);
    expect(textSpan).toHaveClass("truncate");
    expect(textSpan).toHaveClass("max-w-[16.25rem]");
  });

  it("should apply text-xs class on emoji span", () => {
    render(<LinkChip href={TEST_HREF}>{TEST_TEXT}</LinkChip>);

    const link = screen.getByRole("link");
    const emojiSpan = link.querySelector("span.text-xs");
    expect(emojiSpan).toBeInTheDocument();
    expect(emojiSpan).toHaveTextContent("🔗");
  });
});

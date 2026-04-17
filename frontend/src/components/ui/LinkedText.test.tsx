import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LinkedText } from "./LinkedText";

describe("LinkedText", () => {
  it("should render plain text without links", () => {
    render(<LinkedText text="Just plain text" />);
    expect(screen.getByText("Just plain text")).toBeInTheDocument();
  });

  it("should render text with single link as anchor", () => {
    render(<LinkedText text="Visit https://example.com for details" />);

    expect(screen.getByText("Visit")).toBeInTheDocument();
    expect(screen.getByText("for details")).toBeInTheDocument();

    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "https://example.com");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("should render multiple links", () => {
    render(<LinkedText text="Visit https://example.com and https://test.org" />);

    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(2);
    expect(links[0]).toHaveAttribute("href", "https://example.com");
    expect(links[1]).toHaveAttribute("href", "https://test.org");
  });

  it("should display shortened URL text", () => {
    render(<LinkedText text="Visit https://www.example.com/very/long/path" />);

    const link = screen.getByRole("link");
    expect(link).toHaveTextContent("example.com/very/…/path");
  });

  it("should show full URL in title attribute", () => {
    render(<LinkedText text="Visit https://example.com/path" />);

    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("title", "https://example.com/path");
  });

  it("should stop propagation on link click", async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();

    render(
      <div onClick={handleClick}>
        <LinkedText text="Visit https://example.com" />
      </div>
    );

    const link = screen.getByRole("link");
    await user.click(link);

    expect(handleClick).not.toHaveBeenCalled();
  });

  it("should apply custom className", () => {
    const { container } = render(
      <LinkedText text="Plain text" className="custom-class" />
    );

    expect(container.firstChild).toHaveClass("custom-class");
  });

  it("should render link icon", () => {
    render(<LinkedText text="Visit https://example.com" />);

    const link = screen.getByRole("link");
    expect(link).toHaveTextContent("🔗");
  });

  it("should handle empty text", () => {
    const { container } = render(<LinkedText text="" />);
    expect(container.firstChild).toBeEmptyDOMElement();
  });

  it("should handle text with only URL", () => {
    render(<LinkedText text="https://example.com" />);

    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "https://example.com");
  });

  it("should handle URL at end of text", () => {
    render(<LinkedText text="Check this https://example.com" />);

    expect(screen.getByText("Check this")).toBeInTheDocument();
    expect(screen.getByRole("link")).toHaveAttribute("href", "https://example.com");
  });
});

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { DescriptionMarkdown } from "./DescriptionMarkdown";

describe("DescriptionMarkdown", () => {
  // FR1: markdown rendering
  it("should render heading from markdown text", () => {
    render(<DescriptionMarkdown text="# My Heading" />);
    expect(
      screen.getByRole("heading", { level: 1, name: "My Heading" }),
    ).toBeInTheDocument();
  });

  // FR1: markdown rendering — bold
  it("should render bold text as strong element", () => {
    const { container } = render(
      <DescriptionMarkdown text="This is **bold** text" />,
    );
    const strongElement = container.querySelector("strong");
    expect(strongElement).toBeInTheDocument();
    expect(strongElement).toHaveTextContent("bold");
  });

  // FR1: markdown rendering — italic
  it("should render italic text as em element", () => {
    const { container } = render(
      <DescriptionMarkdown text="This is *italic* text" />,
    );
    const emphasisElement = container.querySelector("em");
    expect(emphasisElement).toBeInTheDocument();
    expect(emphasisElement).toHaveTextContent("italic");
  });

  // FR1: markdown rendering — unordered list
  it("should render unordered list", () => {
    render(<DescriptionMarkdown text={"- item one\n- item two"} />);
    const listItems = screen.getAllByRole("listitem");
    expect(listItems).toHaveLength(2);
  });

  // FR1: markdown rendering — code block
  it("should render code block as code element", () => {
    const { container } = render(
      <DescriptionMarkdown text={"```\nconst x = 1;\n```"} />,
    );
    const codeElement = container.querySelector("code");
    expect(codeElement).toBeInTheDocument();
    expect(codeElement).toHaveTextContent("const x = 1;");
  });

  // FR1, FR7: strikethrough via remark-gfm
  it("should render strikethrough as del element", () => {
    const { container } = render(
      <DescriptionMarkdown text="This is ~~deleted~~ text" />,
    );
    const deletedElement = container.querySelector("del");
    expect(deletedElement).toBeInTheDocument();
    expect(deletedElement).toHaveTextContent("deleted");
  });

  // FR1, FR7: table via remark-gfm
  it("should render GFM table as HTML table", () => {
    const tableMarkdown = "| Header |\n| --- |\n| Cell |";
    const { container } = render(<DescriptionMarkdown text={tableMarkdown} />);
    expect(container.querySelector("table")).toBeInTheDocument();
    expect(container.querySelector("thead")).toBeInTheDocument();
    expect(container.querySelector("tbody")).toBeInTheDocument();
  });

  // FR2: XSS sanitization — script tag
  it("should strip script tags for XSS protection", () => {
    const { container } = render(
      <DescriptionMarkdown text="<script>alert('xss')</script>" />,
    );
    expect(container.querySelector("script")).not.toBeInTheDocument();
  });

  // FR2: XSS sanitization — event handler
  it("should strip event handler attributes for XSS protection", () => {
    const xssMarkdown = [
      '<img src="https://example.com/image.png" alt="test"',
      " onerror=\"alert('xss')\">",
    ].join("");
    const { container } = render(<DescriptionMarkdown text={xssMarkdown} />);
    const imageElement = container.querySelector("img");
    if (imageElement) {
      expect(imageElement).not.toHaveAttribute("onerror");
    }
  });

  // FR3: autolink — https
  it("should autolink bare https URL", () => {
    render(<DescriptionMarkdown text="Visit https://example.com for info" />);
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "https://example.com");
    expect(link).toHaveTextContent("example.com");
  });

  // FR3: autolink — http
  it("should autolink bare http URL", () => {
    render(<DescriptionMarkdown text="See http://example.com" />);
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "http://example.com");
  });

  // FR9: autolink displays shortened URL via LinkChip
  it("should display shortened URL for autolinked URL with path", () => {
    render(
      <DescriptionMarkdown text="Visit https://example.com/path for info" />,
    );
    const link = screen.getByRole("link");
    expect(link).toHaveTextContent("example.com/path");
  });

  // FR9: markdown link displays custom text via LinkChip
  it("should display custom text for markdown link", () => {
    render(<DescriptionMarkdown text="[My Link](https://example.com)" />);
    const link = screen.getByRole("link");
    expect(link).toHaveTextContent("My Link");
  });

  // FR9: autolink with long path shows abbreviated URL
  it("should display abbreviated URL for autolink with long path", () => {
    render(
      <DescriptionMarkdown text="Visit https://example.com/very/long/path" />,
    );
    const link = screen.getByRole("link");
    expect(link).toHaveTextContent("example.com/very/…/path");
  });

  // FR4: link click stopPropagation
  it("should stop propagation when link is clicked", async () => {
    const user = userEvent.setup();
    const handleParentClick = vi.fn();

    render(
      <div onClick={handleParentClick}>
        <DescriptionMarkdown text="[Example](https://example.com)" />
      </div>,
    );

    const link = screen.getByRole("link");
    await user.click(link);

    expect(handleParentClick).not.toHaveBeenCalled();
  });

  // FR5: links open in new tab
  it("should open links in new tab with security attributes", () => {
    render(<DescriptionMarkdown text="[Example](https://example.com)" />);
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  // FR7: plain text backward compatibility
  it("should render plain text as paragraph without artifacts", () => {
    render(
      <DescriptionMarkdown text="Just plain text without any formatting" />,
    );
    expect(
      screen.getByText("Just plain text without any formatting"),
    ).toBeInTheDocument();
  });

  // FR1: empty text — renders empty div with prose classes
  it("should render empty element when text is empty", () => {
    const { container } = render(<DescriptionMarkdown text="" />);
    const rootElement = container.firstChild as HTMLElement;
    expect(rootElement.tagName).toBe("DIV");
    expect(rootElement).toBeEmptyDOMElement();
    expect(rootElement).toHaveClass("prose", "prose-sm");
  });

  // FR1: empty text — does not render markdown content
  it("should not render paragraph when text is empty", () => {
    const { container } = render(<DescriptionMarkdown text="" />);
    expect(container.querySelector("p")).not.toBeInTheDocument();
  });

  // FR1: custom className
  it("should apply custom className to root element", () => {
    const { container } = render(
      <DescriptionMarkdown text="Some text" className="custom-class" />,
    );
    const rootElement = container.firstChild as HTMLElement;
    expect(rootElement).toHaveClass("custom-class");
  });

  // UX3: prose styling
  it("should apply prose and prose-sm classes to root element", () => {
    const { container } = render(<DescriptionMarkdown text="Some text" />);
    const rootElement = container.firstChild as HTMLElement;
    expect(rootElement).toHaveClass("prose");
    expect(rootElement).toHaveClass("prose-sm");
  });

  // FR5: autolinked URLs also get new tab attributes
  it("should apply new tab attributes to autolinked URLs", () => {
    render(<DescriptionMarkdown text="Visit https://example.com for info" />);
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  // FR2: XSS sanitization — javascript protocol
  it("should sanitize javascript protocol in markdown links", () => {
    const { container } = render(
      <DescriptionMarkdown text="[click](javascript:alert(1))" />,
    );
    const link = container.querySelector("a");
    if (link) {
      expect(link.getAttribute("href")).not.toContain("javascript:");
    }
  });
});

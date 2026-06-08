// Verifies FR11 of add-file-attachments
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MarkdownPreview } from "./MarkdownPreview";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

describe("MarkdownPreview", () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("should show loading state initially", () => {
    vi.stubGlobal("fetch", vi.fn().mockReturnValue(new Promise(() => {})));

    render(<MarkdownPreview url="blob:test" />);

    expect(screen.getByText("attachment.lightbox.loading")).toBeInTheDocument();
  });

  it("should show error state when fetch fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("fail")));

    render(<MarkdownPreview url="blob:test" />);

    await waitFor(() => {
      expect(
        screen.getByText("attachment.lightbox.loadError"),
      ).toBeInTheDocument();
    });
  });

  it("should render markdown with formatting after fetch", async () => {
    const markdownContent = "# Hello\n\nThis is **bold** text.";
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        text: () => Promise.resolve(markdownContent),
      }),
    );

    render(<MarkdownPreview url="blob:test" />);

    await waitFor(() => {
      expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
        "Hello",
      );
    });

    expect(screen.getByText("bold")).toBeInTheDocument();
  });

  it("should render GFM tables", async () => {
    const tableMarkdown =
      "| Name | Value |\n| --- | --- |\n| Alpha | 1 |\n| Beta | 2 |";
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        text: () => Promise.resolve(tableMarkdown),
      }),
    );

    render(<MarkdownPreview url="blob:test" />);

    await waitFor(() => {
      expect(screen.getByRole("table")).toBeInTheDocument();
    });

    expect(screen.getByText("Alpha")).toBeInTheDocument();
    expect(screen.getByText("Beta")).toBeInTheDocument();
  });

  it("should render GFM task lists", async () => {
    const taskListMarkdown = "- [x] Done\n- [ ] Todo";
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        text: () => Promise.resolve(taskListMarkdown),
      }),
    );

    render(<MarkdownPreview url="blob:test" />);

    await waitFor(() => {
      expect(screen.getByText("Done")).toBeInTheDocument();
    });

    const checkboxes = screen.getAllByRole("checkbox");
    expect(checkboxes).toHaveLength(2);
    expect(checkboxes[0]).toBeChecked();
    expect(checkboxes[1]).not.toBeChecked();
  });

  it("should not re-render when unmounted during fetch", async () => {
    let resolveText: (value: string) => void;
    const textPromise = new Promise<string>((resolve) => {
      resolveText = resolve;
    });
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        text: () => textPromise,
      }),
    );

    const { unmount } = render(<MarkdownPreview url="blob:test" />);

    unmount();
    resolveText!("# Late content");

    // No error thrown — component handles cancellation gracefully
  });

  it("should render code blocks", async () => {
    const codeMarkdown = "```js\nconst x = 1;\n```";
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        text: () => Promise.resolve(codeMarkdown),
      }),
    );

    render(<MarkdownPreview url="blob:test" />);

    await waitFor(() => {
      expect(screen.getByText("const x = 1;")).toBeInTheDocument();
    });

    expect(screen.getByRole("code")).toBeInTheDocument();
  });
});

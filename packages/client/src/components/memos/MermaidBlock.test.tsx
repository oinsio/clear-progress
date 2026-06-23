// Verifies FR2, UX2 of fix-offline-mermaid

import { act, cleanup, render, waitFor } from "@testing-library/react";
import type React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { ColorScheme } from "@/types/common";

let mockColorScheme: ColorScheme = "light";

vi.mock("mermaid", () => ({
  default: {
    initialize: vi.fn(),
    render: vi.fn(),
  },
}));

vi.mock("@/app/providers/ThemeProvider", () => ({
  useTheme: () => ({ colorScheme: mockColorScheme }),
}));

import { MermaidBlock } from "./MermaidBlock";

let mermaid: typeof import("mermaid");

const SAMPLE_CODE = "graph TD\n  A --- B";
const SAMPLE_SVG = "<svg><text>diagram</text></svg>";
const DARK_QUERY = "(prefers-color-scheme: dark)";

function buildRenderResult(svg = SAMPLE_SVG): import("mermaid").RenderResult {
  return { svg, diagramType: "flowchart", bindFunctions: vi.fn() };
}

function mockPendingRender() {
  vi.mocked(mermaid.default.render).mockReturnValue(new Promise(() => {}));
}

async function waitForSvg(container: HTMLElement) {
  await waitFor(() =>
    expect(container.querySelector('[role="img"]')).not.toBeNull(),
  );
}

async function rerenderAndWaitForSecondSvg(
  container: HTMLElement,
  rerender: (ui: React.ReactElement) => void,
) {
  const secondSvg = "<svg>second</svg>";
  vi.mocked(mermaid.default.render).mockResolvedValueOnce(
    buildRenderResult(secondSvg),
  );
  rerender(<MermaidBlock code="graph LR\n X --- Y" />);
  await waitFor(() => {
    expect(container.querySelector('[role="img"]')?.innerHTML).toBe(secondSvg);
  });
  return secondSvg;
}

async function expectInitializedWithTheme(theme: "default" | "dark") {
  await waitFor(() => {
    expect(mermaid.default.initialize).toHaveBeenCalledWith(
      expect.objectContaining({ theme }),
    );
  });
}

function mockMatchMedia(isDark = false) {
  const mock = {
    matches: isDark,
    media: DARK_QUERY,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  };
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn().mockReturnValue(mock),
  });
  return mock;
}

describe("MermaidBlock", () => {
  beforeEach(async () => {
    mockColorScheme = "light";
    mockMatchMedia(false);
    mermaid = await import("mermaid");
    vi.mocked(mermaid.default.render).mockResolvedValue(buildRenderResult());
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("should show source code before render completes", () => {
    mockPendingRender();
    const { container } = render(<MermaidBlock code={SAMPLE_CODE} />);
    expect(container.querySelector("pre")?.textContent).toBe(SAMPLE_CODE);
  });

  it("should not show error styling before render completes", () => {
    mockPendingRender();
    const { container } = render(<MermaidBlock code={SAMPLE_CODE} />);
    expect(container.innerHTML).not.toContain("border-red-300");
  });

  it("should display SVG with role img when render succeeds", async () => {
    const { container } = render(<MermaidBlock code={SAMPLE_CODE} />);
    await waitFor(() => {
      const imgDiv = container.querySelector('[role="img"]');
      expect(imgDiv).not.toBeNull();
      expect(imgDiv?.innerHTML).toBe(SAMPLE_SVG);
    });
  });

  it("should not show pre element when render succeeds", async () => {
    const { container } = render(<MermaidBlock code={SAMPLE_CODE} />);
    await waitFor(() => {
      expect(container.querySelector("pre")).toBeNull();
    });
  });

  it("should have overflow-x-auto on rendered SVG container", async () => {
    const { container } = render(<MermaidBlock code={SAMPLE_CODE} />);
    await waitFor(() => {
      const imgDiv = container.querySelector('[role="img"]');
      expect((imgDiv as HTMLElement).className).toContain("overflow-x-auto");
    });
  });

  it("should show error styling when render fails", async () => {
    vi.mocked(mermaid.default.render).mockRejectedValue(new Error("Parse"));
    const { container } = render(<MermaidBlock code={SAMPLE_CODE} />);
    await waitFor(() => {
      expect(container.firstElementChild?.className).toContain(
        "border-red-300",
      );
      expect(container.querySelector("pre")?.textContent).toBe(SAMPLE_CODE);
    });
  });

  it("should clear SVG when render fails after previous success", async () => {
    const { container, rerender } = render(<MermaidBlock code={SAMPLE_CODE} />);
    await waitForSvg(container);
    vi.mocked(mermaid.default.render).mockRejectedValue(new Error("fail"));
    rerender(<MermaidBlock code="invalid" />);
    await waitFor(() => {
      expect(container.querySelector('[role="img"]')).toBeNull();
      expect(container.querySelector("pre")?.textContent).toBe("invalid");
    });
  });

  it("should show fallback for non-Error rejections", async () => {
    vi.mocked(mermaid.default.render).mockRejectedValue("string error");
    const { container } = render(<MermaidBlock code={SAMPLE_CODE} />);
    await waitFor(() => {
      expect(container.firstElementChild?.className).toContain(
        "border-red-300",
      );
    });
  });

  it("should use default theme for light colorScheme even when system is dark", async () => {
    mockColorScheme = "light";
    mockMatchMedia(true);
    render(<MermaidBlock code={SAMPLE_CODE} />);
    await waitFor(() => {
      expect(mermaid.default.initialize).toHaveBeenCalledWith(
        expect.objectContaining({
          theme: "default",
          startOnLoad: false,
          securityLevel: "strict",
        }),
      );
    });
  });

  it("should use dark theme for dark colorScheme", async () => {
    mockColorScheme = "dark";
    render(<MermaidBlock code={SAMPLE_CODE} />);
    await expectInitializedWithTheme("dark");
  });

  it("should use dark theme when system colorScheme and system prefers dark", async () => {
    mockColorScheme = "system";
    mockMatchMedia(true);
    render(<MermaidBlock code={SAMPLE_CODE} />);
    await expectInitializedWithTheme("dark");
  });

  it("should use default theme when system colorScheme and system prefers light", async () => {
    mockColorScheme = "system";
    mockMatchMedia(false);
    render(<MermaidBlock code={SAMPLE_CODE} />);
    await expectInitializedWithTheme("default");
  });

  it("should re-render when system dark mode changes via media query", async () => {
    mockColorScheme = "system";
    const mediaQuery = mockMatchMedia(false);
    render(<MermaidBlock code={SAMPLE_CODE} />);
    await expectInitializedWithTheme("default");
    vi.mocked(mermaid.default.initialize).mockClear();
    const changeHandler = mediaQuery.addEventListener.mock.calls.find(
      (call: unknown[]) => call[0] === "change",
    )?.[1] as (event: MediaQueryListEvent) => void;
    act(() => changeHandler({ matches: true } as MediaQueryListEvent));
    await expectInitializedWithTheme("dark");
  });

  it("should call mermaid.render with generated id and code", async () => {
    render(<MermaidBlock code={SAMPLE_CODE} />);
    await waitFor(() => {
      expect(mermaid.default.render).toHaveBeenCalledWith(
        expect.stringMatching(/^mermaid-\d+$/),
        SAMPLE_CODE,
      );
    });
  });

  it("should query matchMedia with correct query", () => {
    render(<MermaidBlock code={SAMPLE_CODE} />);
    expect(window.matchMedia).toHaveBeenCalledWith(DARK_QUERY);
  });

  it("should register and remove change listener on media query", () => {
    const mediaQuery = mockMatchMedia(false);
    const { unmount } = render(<MermaidBlock code={SAMPLE_CODE} />);
    expect(mediaQuery.addEventListener).toHaveBeenCalledWith(
      "change",
      expect.any(Function),
    );
    unmount();
    expect(mediaQuery.removeEventListener).toHaveBeenCalledWith(
      "change",
      expect.any(Function),
    );
  });

  it("should ignore stale success result after code changes", async () => {
    let resolveFirst!: (value: import("mermaid").RenderResult) => void;
    vi.mocked(mermaid.default.render).mockReturnValueOnce(
      new Promise((resolve) => {
        resolveFirst = resolve;
      }),
    );
    const { container, rerender } = render(<MermaidBlock code={SAMPLE_CODE} />);
    const secondSvg = await rerenderAndWaitForSecondSvg(container, rerender);
    await act(async () => {
      resolveFirst(buildRenderResult("<svg>stale</svg>"));
    });
    expect(container.querySelector('[role="img"]')?.innerHTML).toBe(secondSvg);
  });

  it("should ignore stale error after code changes", async () => {
    let rejectFirst!: (reason: Error) => void;
    vi.mocked(mermaid.default.render).mockReturnValueOnce(
      new Promise((_, reject) => {
        rejectFirst = reject;
      }),
    );
    const { container, rerender } = render(<MermaidBlock code={SAMPLE_CODE} />);
    const secondSvg = await rerenderAndWaitForSecondSvg(container, rerender);
    await act(async () => {
      rejectFirst(new Error("stale error"));
    });
    expect(container.querySelector('[role="img"]')?.innerHTML).toBe(secondSvg);
    expect(container.innerHTML).not.toContain("border-red-300");
  });

  it("should re-render when code prop changes", async () => {
    const { container, rerender } = render(<MermaidBlock code={SAMPLE_CODE} />);
    await waitForSvg(container);
    const newSvg = "<svg><text>new</text></svg>";
    vi.mocked(mermaid.default.render).mockResolvedValue(
      buildRenderResult(newSvg),
    );
    rerender(<MermaidBlock code="graph LR\n  C --- D" />);
    await waitFor(() => {
      expect(container.querySelector('[role="img"]')?.innerHTML).toBe(newSvg);
    });
  });
});

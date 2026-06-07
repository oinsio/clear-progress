import { cleanup, render, screen } from "@testing-library/react";
import { createRef } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CoverLightbox } from "./CoverLightbox";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, params?: Record<string, string>) => {
      if (params?.filename) return `${key}:${params.filename}`;
      return key;
    },
  }),
}));

// FR1, FR2, NFR-A1: cover lightbox (wrapper over FileLightbox)
// Lightbox behavior (close, focus trap, a11y) tested in FileLightbox.test.tsx
describe("CoverLightbox", () => {
  afterEach(() => {
    cleanup();
  });

  it("should pass imageUrl as src to the rendered image", () => {
    render(
      <CoverLightbox
        imageUrl="https://example.com/cover.jpg"
        imageAlt="Test cover"
        onClose={vi.fn()}
        triggerRef={createRef<HTMLElement>()}
      />,
    );

    const image = screen.getByRole("img");
    expect(image).toHaveAttribute("src", "https://example.com/cover.jpg");
  });

  it("should pass imageAlt as alt text to the rendered image", () => {
    render(
      <CoverLightbox
        imageUrl="https://example.com/cover.jpg"
        imageAlt="Test cover"
        onClose={vi.fn()}
        triggerRef={createRef<HTMLElement>()}
      />,
    );

    const image = screen.getByRole("img");
    expect(image).toHaveAttribute("alt", "Test cover");
  });

  it("should use cover-specific test IDs", () => {
    render(
      <CoverLightbox
        imageUrl="https://example.com/cover.jpg"
        imageAlt="Test cover"
        onClose={vi.fn()}
        triggerRef={createRef<HTMLElement>()}
      />,
    );

    expect(screen.getByTestId("cover-lightbox")).toBeInTheDocument();
    expect(screen.getByTestId("cover-lightbox-close")).toBeInTheDocument();
  });
});

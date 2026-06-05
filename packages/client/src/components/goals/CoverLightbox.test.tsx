import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import type React from "react";
import { createRef } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CoverLightbox } from "./CoverLightbox";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

function renderLightbox(
  overrides: Partial<React.ComponentProps<typeof CoverLightbox>> = {},
) {
  const triggerRef = overrides.triggerRef ?? createRef<HTMLElement>();
  const onClose = vi.fn();

  const result = render(
    <CoverLightbox
      imageUrl="https://example.com/cover.jpg"
      imageAlt="Test cover"
      onClose={onClose}
      triggerRef={triggerRef}
      {...overrides}
    />,
  );

  return { onClose, triggerRef, ...result };
}

// FR1, FR2, NFR-A1: cover lightbox
describe("CoverLightbox", () => {
  afterEach(() => {
    cleanup();
  });

  it("should render image with correct src and alt", () => {
    renderLightbox();

    const image = screen.getByRole("img");
    expect(image).toHaveAttribute("src", "https://example.com/cover.jpg");
    expect(image).toHaveAttribute("alt", "Test cover");
  });

  it("should render close button with translated aria-label", () => {
    renderLightbox();

    const closeButton = screen.getByTestId("cover-lightbox-close");
    expect(closeButton).toHaveAttribute(
      "aria-label",
      "goal.cover.closeLightbox",
    );
  });

  it("should close on X button click", () => {
    const { onClose } = renderLightbox();

    fireEvent.click(screen.getByTestId("cover-lightbox-close"));

    expect(onClose).toHaveBeenCalledOnce();
  });

  it("should close on backdrop click", () => {
    const { onClose } = renderLightbox();

    fireEvent.click(screen.getByTestId("cover-lightbox"));

    expect(onClose).toHaveBeenCalledOnce();
  });

  it("should not close when clicking the image", () => {
    const { onClose } = renderLightbox();

    fireEvent.click(screen.getByRole("img"));

    expect(onClose).not.toHaveBeenCalled();
  });

  it("should close on Escape key", () => {
    const { onClose } = renderLightbox();

    fireEvent.keyDown(screen.getByTestId("cover-lightbox"), {
      key: "Escape",
    });

    expect(onClose).toHaveBeenCalledOnce();
  });

  it("should not close on non-Escape/non-Tab key", () => {
    const { onClose } = renderLightbox();

    fireEvent.keyDown(screen.getByTestId("cover-lightbox"), {
      key: "Enter",
    });

    expect(onClose).not.toHaveBeenCalled();
  });

  it("should not call preventDefault for non-Tab keys", () => {
    renderLightbox();

    const dialog = screen.getByTestId("cover-lightbox");
    const preventDefaultSpy = vi.fn();
    fireEvent.keyDown(dialog, { key: "a", preventDefault: preventDefaultSpy });

    expect(preventDefaultSpy).not.toHaveBeenCalled();
  });

  it("should trap focus on Tab key and prevent default", () => {
    renderLightbox();

    const closeButton = screen.getByTestId("cover-lightbox-close");
    const lightbox = screen.getByTestId("cover-lightbox");

    const tabEvent = new KeyboardEvent("keydown", {
      key: "Tab",
      bubbles: true,
      cancelable: true,
    });
    const preventDefaultSpy = vi.spyOn(tabEvent, "preventDefault");

    lightbox.dispatchEvent(tabEvent);

    expect(preventDefaultSpy).toHaveBeenCalledOnce();
    expect(document.activeElement).toBe(closeButton);
  });

  it("should focus close button on mount", () => {
    renderLightbox();

    const closeButton = screen.getByTestId("cover-lightbox-close");
    expect(document.activeElement).toBe(closeButton);
  });

  it("should return focus to trigger element on unmount", () => {
    const triggerButton = document.createElement("button");
    document.body.appendChild(triggerButton);

    const triggerRef = { current: triggerButton };
    const { unmount } = renderLightbox({ triggerRef });

    unmount();

    expect(document.activeElement).toBe(triggerButton);

    document.body.removeChild(triggerButton);
  });

  it("should handle null trigger ref on unmount without error", () => {
    const triggerRef = { current: null } as React.RefObject<HTMLElement | null>;
    const { unmount } = renderLightbox({ triggerRef });

    expect(() => unmount()).not.toThrow();
  });

  it("should render dialog with correct ARIA attributes", () => {
    renderLightbox();

    const dialog = screen.getByTestId("cover-lightbox");
    expect(dialog).toHaveAttribute("role", "dialog");
    expect(dialog).toHaveAttribute("aria-modal", "true");
  });
});

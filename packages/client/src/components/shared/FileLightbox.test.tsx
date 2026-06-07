// Verifies NFR-A1 of add-file-attachments
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import type React from "react";
import { createRef } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { FileLightbox } from "./FileLightbox";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, params?: Record<string, string>) => {
      if (params?.filename) return `${key}:${params.filename}`;
      return key;
    },
  }),
}));

vi.mock("react-pdf", () => {
  const { useEffect } = require("react");
  return {
    Document: ({
      children,
      onLoadSuccess,
      file,
    }: {
      children: React.ReactNode;
      onLoadSuccess?: (args: { numPages: number }) => void;
      file: string;
    }) => {
      useEffect(() => {
        onLoadSuccess?.({ numPages: 1 });
      }, [onLoadSuccess]);
      return (
        <div data-testid="pdf-document" data-file={file}>
          {children}
        </div>
      );
    },
    Page: ({ pageNumber }: { pageNumber: number }) => (
      <canvas data-testid={`pdf-page-${pageNumber}`} />
    ),
    pdfjs: { GlobalWorkerOptions: { workerSrc: "" } },
  };
});

function renderLightbox(
  overrides: Partial<React.ComponentProps<typeof FileLightbox>> = {},
) {
  const triggerRef = overrides.triggerRef ?? createRef<HTMLElement>();
  const onClose = vi.fn();

  const result = render(
    <FileLightbox
      url="blob:test-url"
      mimeType="image/png"
      filename="photo.png"
      onClose={onClose}
      triggerRef={triggerRef}
      {...overrides}
    />,
  );

  return { onClose, triggerRef, ...result };
}

describe("FileLightbox a11y", () => {
  afterEach(() => {
    cleanup();
  });

  it("should have role dialog and aria-modal true", () => {
    renderLightbox();

    const dialog = screen.getByTestId("file-lightbox");
    expect(dialog).toHaveAttribute("role", "dialog");
    expect(dialog).toHaveAttribute("aria-modal", "true");
  });

  it("should have aria-label with filename", () => {
    renderLightbox({ filename: "report.pdf" });

    const dialog = screen.getByTestId("file-lightbox");
    expect(dialog).toHaveAttribute(
      "aria-label",
      "attachment.lightbox.dialogLabel:report.pdf",
    );
  });

  it("should render close button with aria-label", () => {
    renderLightbox();

    const closeButton = screen.getByTestId("file-lightbox-close");
    expect(closeButton).toHaveAttribute(
      "aria-label",
      "attachment.lightbox.close",
    );
  });

  it("should close on Escape key", () => {
    const { onClose } = renderLightbox();

    fireEvent.keyDown(screen.getByTestId("file-lightbox"), { key: "Escape" });

    expect(onClose).toHaveBeenCalledOnce();
  });

  it("should focus close button on mount", () => {
    renderLightbox();

    const closeButton = screen.getByTestId("file-lightbox-close");
    expect(document.activeElement).toBe(closeButton);
  });

  it("should render image with alt text for image mime type", () => {
    renderLightbox({ mimeType: "image/png", filename: "photo.png" });

    const image = screen.getByRole("img");
    expect(image).toHaveAttribute("alt", "photo.png");
  });

  it("should render pdf document with canvas pages for pdf mime type", () => {
    renderLightbox({ mimeType: "application/pdf", filename: "doc.pdf" });

    expect(screen.getByTestId("pdf-document")).toBeInTheDocument();
    expect(screen.getByTestId("pdf-page-1")).toBeInTheDocument();
  });

  it("should render text content after fetch for text mime type", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      text: () => Promise.resolve("Hello world"),
    });
    vi.stubGlobal("fetch", mockFetch);

    renderLightbox({ mimeType: "text/plain", filename: "readme.txt" });

    await waitFor(() => {
      expect(screen.getByText("Hello world")).toBeInTheDocument();
    });

    vi.unstubAllGlobals();
  });

  it("should trap focus on Tab key", () => {
    renderLightbox();

    const closeButton = screen.getByTestId("file-lightbox-close");
    const lightbox = screen.getByTestId("file-lightbox");

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

  it("should return focus to trigger element on unmount", () => {
    const triggerButton = document.createElement("button");
    document.body.appendChild(triggerButton);

    const triggerRef = { current: triggerButton };
    const { unmount } = renderLightbox({ triggerRef });

    unmount();

    expect(document.activeElement).toBe(triggerButton);

    document.body.removeChild(triggerButton);
  });
});

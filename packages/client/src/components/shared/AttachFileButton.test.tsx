// Verifies NFR-A1 of add-file-attachments
// implements FR7 of fix-file-mime-detection
import { detectMimeType } from "@clear-progress/contract";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import type React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AttachFileButton } from "./AttachFileButton";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock("@clear-progress/contract", async (importOriginal) => {
  const original =
    await importOriginal<typeof import("@clear-progress/contract")>();
  return { ...original, detectMimeType: vi.fn(() => "image/jpeg") };
});

// jsdom does not implement File.prototype.arrayBuffer — add polyfill for tests
const EMPTY_BUFFER = new ArrayBuffer(0);
if (!File.prototype.arrayBuffer) {
  Object.defineProperty(File.prototype, "arrayBuffer", {
    value() {
      return Promise.resolve(EMPTY_BUFFER);
    },
    configurable: true,
    writable: true,
  });
}

function renderButton(
  overrides: Partial<React.ComponentProps<typeof AttachFileButton>> = {},
) {
  const onFileSelected = vi.fn();

  const result = render(
    <AttachFileButton onFileSelected={onFileSelected} {...overrides} />,
  );

  return { onFileSelected, ...result };
}

describe("AttachFileButton a11y", () => {
  afterEach(() => {
    cleanup();
    vi.mocked(detectMimeType).mockReturnValue("image/jpeg");
  });

  it("should render button with accessible text content", () => {
    renderButton();

    const button = screen.getByTestId("attach-file-button");
    expect(button).toHaveTextContent("attachment.attach.button");
  });

  it("should have Paperclip icon marked as aria-hidden", () => {
    renderButton();

    const button = screen.getByTestId("attach-file-button");
    const svg = button.querySelector("svg");
    expect(svg).toHaveAttribute("aria-hidden", "true");
  });

  it("should render file input with proper accept attribute", () => {
    renderButton();

    const fileInput = screen.getByTestId("attach-file-input");
    const acceptValue = fileInput.getAttribute("accept");
    expect(acceptValue).toBeTruthy();
    expect(acceptValue!.length).toBeGreaterThan(0);
  });

  it("should show error message with role alert for invalid file type", async () => {
    vi.mocked(detectMimeType).mockReturnValueOnce("application/x-msdownload");
    renderButton();

    const fileInput = screen.getByTestId("attach-file-input");
    const invalidFile = new File(["content"], "malware.exe", {
      type: "application/x-msdownload",
    });

    fireEvent.change(fileInput, { target: { files: [invalidFile] } });

    await waitFor(() => {
      const errorElement = screen.getByTestId("attach-file-error");
      expect(errorElement).toHaveAttribute("role", "alert");
      expect(errorElement).toHaveTextContent("attachment.attach.errorType");
    });
  });

  it("should show error message with role alert for oversized file", async () => {
    vi.mocked(detectMimeType).mockReturnValueOnce("image/png");
    renderButton();

    const fileInput = screen.getByTestId("attach-file-input");
    // Create a file with allowed type but exceeding size limit
    const oversizedContent = new ArrayBuffer(11 * 1024 * 1024); // 11 MB
    const oversizedFile = new File([oversizedContent], "big.png", {
      type: "image/png",
    });

    fireEvent.change(fileInput, { target: { files: [oversizedFile] } });

    await waitFor(() => {
      const errorElement = screen.getByTestId("attach-file-error");
      expect(errorElement).toHaveAttribute("role", "alert");
      expect(errorElement).toHaveTextContent("attachment.attach.errorSize");
    });
  });

  it("should disable button when isDisabled is true", () => {
    renderButton({ isDisabled: true });

    const button = screen.getByTestId("attach-file-button");
    expect(button).toBeDisabled();
  });

  it("should accept file with mismatched extension when content detection succeeds", async () => {
    vi.mocked(detectMimeType).mockReturnValueOnce("image/webp");
    const { onFileSelected } = renderButton();

    const fileInput = screen.getByTestId("attach-file-input");
    const mismatchedFile = new File(["webp-content"], "photo.png", {
      type: "image/png",
    });

    fireEvent.change(fileInput, { target: { files: [mismatchedFile] } });

    await waitFor(() => {
      expect(onFileSelected).toHaveBeenCalledWith(mismatchedFile);
    });
  });

  it("should show errorUnrecognized for unrecognized non-text format", async () => {
    vi.mocked(detectMimeType).mockReturnValueOnce(null);
    renderButton();

    const fileInput = screen.getByTestId("attach-file-input");
    const unknownFile = new File(["binary-data"], "data.bin", {
      type: "application/octet-stream",
    });

    fireEvent.change(fileInput, { target: { files: [unknownFile] } });

    await waitFor(() => {
      const errorElement = screen.getByTestId("attach-file-error");
      expect(errorElement).toHaveTextContent(
        "attachment.attach.errorUnrecognized",
      );
    });
  });

  it("should show role alert for unrecognized non-text format", async () => {
    vi.mocked(detectMimeType).mockReturnValueOnce(null);
    renderButton();

    const fileInput = screen.getByTestId("attach-file-input");
    const unknownFile = new File(["binary-data"], "data.bin", {
      type: "application/octet-stream",
    });

    fireEvent.change(fileInput, { target: { files: [unknownFile] } });

    await waitFor(() => {
      const errorElement = screen.getByTestId("attach-file-error");
      expect(errorElement).toHaveAttribute("role", "alert");
    });
  });
});

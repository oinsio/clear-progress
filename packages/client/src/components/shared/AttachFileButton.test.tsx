// Verifies NFR-A1 of add-file-attachments
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import type React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AttachFileButton } from "./AttachFileButton";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

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

  it("should show error message with role alert for invalid file type", () => {
    renderButton();

    const fileInput = screen.getByTestId("attach-file-input");
    const invalidFile = new File(["content"], "malware.exe", {
      type: "application/x-msdownload",
    });

    fireEvent.change(fileInput, { target: { files: [invalidFile] } });

    const errorElement = screen.getByTestId("attach-file-error");
    expect(errorElement).toHaveAttribute("role", "alert");
    expect(errorElement).toHaveTextContent("attachment.attach.errorType");
  });

  it("should show error message with role alert for oversized file", () => {
    renderButton();

    const fileInput = screen.getByTestId("attach-file-input");
    // Create a file with allowed type but exceeding size limit
    const oversizedContent = new ArrayBuffer(11 * 1024 * 1024); // 11 MB
    const oversizedFile = new File([oversizedContent], "big.png", {
      type: "image/png",
    });

    fireEvent.change(fileInput, { target: { files: [oversizedFile] } });

    const errorElement = screen.getByTestId("attach-file-error");
    expect(errorElement).toHaveAttribute("role", "alert");
    expect(errorElement).toHaveTextContent("attachment.attach.errorSize");
  });

  it("should disable button when isDisabled is true", () => {
    renderButton({ isDisabled: true });

    const button = screen.getByTestId("attach-file-button");
    expect(button).toBeDisabled();
  });
});

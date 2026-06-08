// Verifies NFR-A1 of add-file-attachments
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import type React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ConfirmDialog } from "./ConfirmDialog";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

function renderDialog(
  overrides: Partial<React.ComponentProps<typeof ConfirmDialog>> = {},
) {
  const onConfirm = vi.fn();
  const onCancel = vi.fn();

  const result = render(
    <ConfirmDialog
      title="Delete file?"
      message="This action cannot be undone."
      confirmLabel="Delete"
      onConfirm={onConfirm}
      onCancel={onCancel}
      {...overrides}
    />,
  );

  return { onConfirm, onCancel, ...result };
}

describe("ConfirmDialog a11y", () => {
  afterEach(() => {
    cleanup();
  });

  it("should have role alertdialog and aria-modal true", () => {
    renderDialog();

    const dialog = screen.getByTestId("confirm-dialog");
    expect(dialog).toHaveAttribute("role", "alertdialog");
    expect(dialog).toHaveAttribute("aria-modal", "true");
  });

  it("should have aria-labelledby referencing title element", () => {
    renderDialog();

    const dialog = screen.getByTestId("confirm-dialog");
    const titleElement = screen.getByTestId("confirm-dialog-title");

    const labelledBy = dialog.getAttribute("aria-labelledby");
    expect(labelledBy).toBeTruthy();
    expect(titleElement.id).toBe(labelledBy);
  });

  it("should have aria-describedby referencing message element", () => {
    renderDialog();

    const dialog = screen.getByTestId("confirm-dialog");
    const messageElement = screen.getByTestId("confirm-dialog-message");

    const describedBy = dialog.getAttribute("aria-describedby");
    expect(describedBy).toBeTruthy();
    expect(messageElement.id).toBe(describedBy);
  });

  it("should close on Escape key", () => {
    const { onCancel } = renderDialog();

    fireEvent.keyDown(screen.getByTestId("confirm-dialog"), { key: "Escape" });

    expect(onCancel).toHaveBeenCalledOnce();
  });

  it("should focus cancel button on mount", () => {
    renderDialog();

    const cancelButton = screen.getByTestId("confirm-dialog-cancel");
    expect(document.activeElement).toBe(cancelButton);
  });

  it("should trap focus between cancel and confirm buttons on Tab", () => {
    renderDialog();

    const dialog = screen.getByTestId("confirm-dialog");
    const cancelButton = screen.getByTestId("confirm-dialog-cancel");
    const confirmButton = screen.getByTestId("confirm-dialog-confirm");

    // Initially focused on cancel button
    expect(document.activeElement).toBe(cancelButton);

    // Tab from cancel -> confirm
    const tabEvent = new KeyboardEvent("keydown", {
      key: "Tab",
      bubbles: true,
      cancelable: true,
    });
    dialog.dispatchEvent(tabEvent);
    expect(document.activeElement).toBe(confirmButton);

    // Tab from confirm -> cancel
    const tabEvent2 = new KeyboardEvent("keydown", {
      key: "Tab",
      bubbles: true,
      cancelable: true,
    });
    dialog.dispatchEvent(tabEvent2);
    expect(document.activeElement).toBe(cancelButton);
  });

  it("should call onCancel on backdrop click", () => {
    const { onCancel } = renderDialog();

    fireEvent.click(screen.getByTestId("confirm-dialog"));

    expect(onCancel).toHaveBeenCalledOnce();
  });

  it("should call onConfirm on confirm button click", () => {
    const { onConfirm } = renderDialog();

    fireEvent.click(screen.getByTestId("confirm-dialog-confirm"));

    expect(onConfirm).toHaveBeenCalledOnce();
  });
});

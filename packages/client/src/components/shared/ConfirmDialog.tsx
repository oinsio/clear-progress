import type React from "react";
import { useCallback, useEffect, useId, useRef } from "react";
import { useTranslation } from "react-i18next";

const CONFIRM_DIALOG_VARIANT_DEFAULT = "default";
const CONFIRM_DIALOG_VARIANT_DANGER = "danger";

type ConfirmDialogVariant =
  | typeof CONFIRM_DIALOG_VARIANT_DEFAULT
  | typeof CONFIRM_DIALOG_VARIANT_DANGER;

interface ConfirmDialogProps {
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel?: string;
  variant?: ConfirmDialogVariant;
  onConfirm: () => void;
  onCancel: () => void;
}

const CONFIRM_BUTTON_STYLES: Record<ConfirmDialogVariant, string> = {
  [CONFIRM_DIALOG_VARIANT_DEFAULT]:
    "rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors",
  [CONFIRM_DIALOG_VARIANT_DANGER]:
    "rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600 transition-colors",
};

const CANCEL_BUTTON_STYLE =
  "rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 transition-colors";

/**
 * Implements FR12, FR13 of add-file-attachments.
 * Reusable confirmation dialog with focus trap, Escape support,
 * and backdrop click to cancel.
 */
export function ConfirmDialog({
  title,
  message,
  confirmLabel,
  cancelLabel,
  variant = CONFIRM_DIALOG_VARIANT_DEFAULT,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const { t } = useTranslation();
  const titleId = useId();
  const messageId = useId();
  const cancelButtonRef = useRef<HTMLButtonElement>(null);
  const confirmButtonRef = useRef<HTMLButtonElement>(null);

  const resolvedCancelLabel = cancelLabel ?? t("common.cancel");

  useEffect(() => {
    cancelButtonRef.current?.focus();
  }, []);

  useEffect(() => {
    const previouslyFocusedElement = document.activeElement as HTMLElement;
    return () => {
      previouslyFocusedElement?.focus();
    };
  }, []);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === "Escape") {
        onCancel();
      } else if (event.key === "Tab") {
        event.preventDefault();
        if (document.activeElement === cancelButtonRef.current) {
          confirmButtonRef.current?.focus();
        } else {
          cancelButtonRef.current?.focus();
        }
      }
    },
    [onCancel],
  );

  const handleBackdropClick = useCallback(
    (event: React.MouseEvent) => {
      if (event.target === event.currentTarget) {
        onCancel();
      }
    },
    [onCancel],
  );

  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={messageId}
      data-testid="confirm-dialog"
      onKeyDown={handleKeyDown}
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 flex items-center justify-center"
    >
      <div className="absolute inset-0 bg-black/40" />
      <div className="relative w-full max-w-sm mx-4 rounded-2xl bg-white p-6 shadow-xl">
        <h2
          id={titleId}
          data-testid="confirm-dialog-title"
          className="text-base font-semibold text-gray-900 mb-2"
        >
          {title}
        </h2>
        <p
          id={messageId}
          data-testid="confirm-dialog-message"
          className="text-sm text-gray-500 mb-6"
        >
          {message}
        </p>
        <div className="flex justify-end gap-2">
          <button
            ref={cancelButtonRef}
            type="button"
            data-testid="confirm-dialog-cancel"
            onClick={onCancel}
            className={CANCEL_BUTTON_STYLE}
          >
            {resolvedCancelLabel}
          </button>
          <button
            ref={confirmButtonRef}
            type="button"
            data-testid="confirm-dialog-confirm"
            onClick={onConfirm}
            className={CONFIRM_BUTTON_STYLES[variant]}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

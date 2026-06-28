// implements FR7, FR8 of fix-push-poison-pill
import type React from "react";
import { useCallback, useEffect, useId, useRef } from "react";
import { useTranslation } from "react-i18next";

interface SyncAlertDialogProps {
  messageKey: string;
  params?: Record<string, string>;
  onDismiss: () => void;
}

const BUTTON_STYLE =
  "rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors";

/**
 * Informational dialog shown when sync healing causes data loss.
 * Provides focus trap, Escape handling, and backdrop click.
 *
 * Implements FR7, FR8 of fix-push-poison-pill.
 */
export function SyncAlertDialog({
  messageKey,
  params,
  onDismiss,
}: SyncAlertDialogProps) {
  const { t } = useTranslation();
  const titleId = useId();
  const messageId = useId();
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    buttonRef.current?.focus();
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
        onDismiss();
      }
    },
    [onDismiss],
  );

  const handleBackdropClick = useCallback(
    (event: React.MouseEvent) => {
      if (event.target === event.currentTarget) {
        onDismiss();
      }
    },
    [onDismiss],
  );

  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={messageId}
      data-testid="sync-alert-dialog"
      onKeyDown={handleKeyDown}
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 flex items-center justify-center"
    >
      <div className="absolute inset-0 bg-black/40" />
      <div className="relative w-full max-w-sm mx-4 rounded-2xl bg-white p-6 shadow-xl">
        <h2
          id={titleId}
          data-testid="sync-alert-dialog-title"
          className="text-base font-semibold text-gray-900 mb-2"
        >
          {t("sync.alertTitle")}
        </h2>
        <p
          id={messageId}
          data-testid="sync-alert-dialog-message"
          className="text-sm text-gray-500 mb-6"
        >
          {t(messageKey, params)}
        </p>
        <div className="flex justify-end">
          <button
            ref={buttonRef}
            type="button"
            data-testid="sync-alert-dialog-dismiss"
            onClick={onDismiss}
            className={BUTTON_STYLE}
          >
            {t("sync.alertUnderstood")}
          </button>
        </div>
      </div>
    </div>
  );
}

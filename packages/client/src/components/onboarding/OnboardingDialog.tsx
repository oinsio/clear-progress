import type React from "react";
import { useCallback, useEffect, useId, useRef } from "react";
import { useTranslation } from "react-i18next";

interface OnboardingDialogProps {
  onAccept: () => void;
  onDecline: () => void;
}

const ACCEPT_BUTTON_STYLE =
  "rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors";

const DECLINE_BUTTON_STYLE =
  "rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 transition-colors";

/**
 * Implements UX1, UX2, NFR-A1, NFR-A2, NFR-R1 of onboarding-goal.
 * Modal dialog shown to first-time users offering onboarding.
 */
export function OnboardingDialog({
  onAccept,
  onDecline,
}: OnboardingDialogProps) {
  const { t } = useTranslation();
  const titleId = useId();
  const bodyId = useId();
  const declineButtonRef = useRef<HTMLButtonElement>(null);
  const acceptButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    acceptButtonRef.current?.focus();
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
        onDecline();
      } else if (event.key === "Tab") {
        event.preventDefault();
        if (document.activeElement === acceptButtonRef.current) {
          declineButtonRef.current?.focus();
        } else {
          acceptButtonRef.current?.focus();
        }
      }
    },
    [onDecline],
  );

  const handleBackdropClick = useCallback(
    (event: React.MouseEvent) => {
      if (event.target === event.currentTarget) {
        onDecline();
      }
    },
    [onDecline],
  );

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={bodyId}
      data-testid="onboarding-dialog"
      onKeyDown={handleKeyDown}
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 flex items-center justify-center"
    >
      <div className="absolute inset-0 bg-black/40" />
      <div className="relative w-full max-w-sm mx-4 rounded-2xl bg-white p-6 shadow-xl">
        <h2
          id={titleId}
          data-testid="onboarding-dialog-title"
          className="text-base font-semibold text-gray-900 mb-2"
        >
          {t("onboarding.dialogTitle")}
        </h2>
        <p
          id={bodyId}
          data-testid="onboarding-dialog-body"
          className="text-sm text-gray-500 mb-6"
        >
          {t("onboarding.dialogBody")}
        </p>
        <div className="flex justify-end gap-2">
          <button
            ref={declineButtonRef}
            type="button"
            data-testid="onboarding-dialog-decline"
            onClick={onDecline}
            className={DECLINE_BUTTON_STYLE}
          >
            {t("onboarding.dialogDecline")}
          </button>
          <button
            ref={acceptButtonRef}
            type="button"
            data-testid="onboarding-dialog-accept"
            onClick={onAccept}
            className={ACCEPT_BUTTON_STYLE}
          >
            {t("onboarding.dialogAccept")}
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Implements FR6, FR7 of detect-invalid-repeat-rule.
 *
 * Alert overlay with paginated navigation for showing alerts one at a time.
 * Reads from useAlerts() context, renders when alerts.length > 0.
 */
import type React from "react";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useAlerts } from "@/app/providers/AlertProvider";
import type { AppAlert } from "@/types/alerts";

const BUTTON_STYLE =
  "rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors";

function SyncAlertContent({
  alert,
  titleId,
  messageId,
}: {
  alert: Extract<AppAlert, { type: "sync" }>;
  titleId: string;
  messageId: string;
}) {
  const { t } = useTranslation();
  return (
    <>
      <h2
        id={titleId}
        data-testid="alert-title"
        className="text-base font-semibold text-gray-900 mb-2"
      >
        {t("sync.alertTitle")}
      </h2>
      <p
        id={messageId}
        data-testid="alert-message"
        className="text-sm text-gray-500 mb-6"
      >
        {t(alert.messageKey, alert.params)}
      </p>
    </>
  );
}

function RepeatRuleInvalidContent({
  alert,
  titleId,
  messageId,
}: {
  alert: Extract<AppAlert, { type: "repeat_rule_invalid" }>;
  titleId: string;
  messageId: string;
}) {
  const { t } = useTranslation();
  return (
    <>
      <h2
        id={titleId}
        data-testid="alert-title"
        className="text-base font-semibold text-gray-900 mb-2"
      >
        {t("repeat.invalidRuleAlertTitle")}
      </h2>
      <p
        id={messageId}
        data-testid="alert-message"
        className="text-sm text-gray-500 mb-2"
      >
        {t("repeat.invalidRuleAlertMessage")}
      </p>
      <p className="text-sm text-gray-500 mb-3">
        {t("repeat.invalidRuleAlertFix")}
      </p>
      <ul
        data-testid="repeat-rule-invalid-task-list"
        className="text-sm text-gray-700 list-disc pl-5 mb-4 max-h-32 overflow-y-auto"
      >
        {alert.taskNames.map((taskName) => (
          <li key={taskName}>{taskName}</li>
        ))}
      </ul>
    </>
  );
}

export function AlertOverlay() {
  const { t } = useTranslation();
  const { alerts, dismissAlerts } = useAlerts();
  const [currentIndex, setCurrentIndex] = useState(0);
  const titleId = useId();
  const messageId = useId();
  const primaryButtonRef = useRef<HTMLButtonElement>(null);
  const previousAlertsCount = useRef(alerts.length);

  if (previousAlertsCount.current !== alerts.length) {
    previousAlertsCount.current = alerts.length;
    setCurrentIndex(0);
  }

  // biome-ignore lint/correctness/useExhaustiveDependencies: focus must re-run when currentIndex or alerts change
  useEffect(() => {
    primaryButtonRef.current?.focus();
  }, [currentIndex, alerts.length]);

  const dialogRef = useRef<HTMLDivElement>(null);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === "Escape") {
        dismissAlerts();
      } else if (event.key === "Tab") {
        const focusableElements = dialogRef.current?.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        );
        if (!focusableElements || focusableElements.length === 0) return;
        const firstElement = focusableElements[0] as HTMLElement;
        const lastElement = focusableElements[
          focusableElements.length - 1
        ] as HTMLElement;
        if (event.shiftKey && document.activeElement === firstElement) {
          event.preventDefault();
          lastElement.focus();
        } else if (!event.shiftKey && document.activeElement === lastElement) {
          event.preventDefault();
          firstElement.focus();
        }
      }
    },
    [dismissAlerts],
  );

  if (alerts.length === 0) {
    return null;
  }

  const currentAlert = alerts[currentIndex];
  const totalAlerts = alerts.length;
  const isFirst = currentIndex === 0;
  const isLast = currentIndex === totalAlerts - 1;
  const currentPosition = currentIndex + 1;

  const handleNext = () => setCurrentIndex((previous) => previous + 1);
  const handleBack = () => setCurrentIndex((previous) => previous - 1);

  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={messageId}
      data-testid="alert-overlay"
      onKeyDown={handleKeyDown}
      className="fixed inset-0 z-50 flex items-center justify-center"
    >
      <div className="absolute inset-0 bg-black/40" />
      <div
        ref={dialogRef}
        className="relative w-full max-w-sm mx-4 rounded-2xl bg-white p-6 shadow-xl"
      >
        <span
          data-testid="alert-counter"
          className="text-xs text-gray-400 mb-2 block"
        >
          {t("alert.counter", {
            current: currentPosition,
            total: totalAlerts,
          })}
        </span>

        {currentAlert.type === "sync" && (
          <SyncAlertContent
            alert={currentAlert}
            titleId={titleId}
            messageId={messageId}
          />
        )}

        {currentAlert.type === "repeat_rule_invalid" && (
          <RepeatRuleInvalidContent
            alert={currentAlert}
            titleId={titleId}
            messageId={messageId}
          />
        )}

        <div className="flex justify-end gap-2">
          {!isFirst && (
            <button
              type="button"
              data-testid="alert-back"
              onClick={handleBack}
              aria-label={t("alert.positionBack", {
                current: currentPosition,
                total: totalAlerts,
              })}
              className={BUTTON_STYLE}
            >
              {t("alert.back")}
            </button>
          )}
          {!isLast && (
            <button
              ref={primaryButtonRef}
              type="button"
              data-testid="alert-next"
              onClick={handleNext}
              aria-label={t("alert.positionNext", {
                current: currentPosition,
                total: totalAlerts,
              })}
              className={BUTTON_STYLE}
            >
              {t("alert.next")}
            </button>
          )}
          {isLast && (
            <button
              ref={primaryButtonRef}
              type="button"
              data-testid="alert-understood"
              onClick={dismissAlerts}
              aria-label={t("alert.positionUnderstood", {
                current: currentPosition,
                total: totalAlerts,
              })}
              className={BUTTON_STYLE}
            >
              {t("sync.alertUnderstood")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

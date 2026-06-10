import { Copy } from "lucide-react";
import React, { useCallback, useEffect, useId, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useShare } from "@/hooks/useShare";

const COPY_RESULT_COPIED = "copied";
const COPY_RESULT_ERROR = "error";

/**
 * Settings section for sharing the app with friends.
 * Copies invite message + app URL to clipboard, shows single-button alert.
 *
 * Implements FR1, FR2, FR4, FR5, FR6, UX2 of share-with-friend.
 */
export function ShareAppSection() {
  const { t } = useTranslation();
  const { copyLink, copyResult, resetCopyResult } = useShare();

  const isDialogVisible =
    copyResult === COPY_RESULT_COPIED || copyResult === COPY_RESULT_ERROR;

  const dialogMessage =
    copyResult === COPY_RESULT_COPIED
      ? t("share.linkCopied")
      : t("share.copyFailed");

  return (
    <section data-testid="settings-share-app" className="space-y-3">
      <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide">
        {t("share.title")}
      </h2>
      <p className="text-xs text-gray-400">{t("share.description")}</p>
      <button
        type="button"
        data-testid="copy-link-button"
        aria-label={t("share.copyLinkButton")}
        onClick={() => void copyLink()}
        className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:border-gray-300 hover:bg-gray-50 transition-colors"
      >
        <Copy className="w-4 h-4" />
        {t("share.copyLinkButton")}
      </button>
      {isDialogVisible && (
        <ShareAlertDialog message={dialogMessage} onDismiss={resetCopyResult} />
      )}
    </section>
  );
}

interface ShareAlertDialogProps {
  message: string;
  onDismiss: () => void;
}

/**
 * Simple single-button alert dialog for copy result feedback.
 * Implements FR5, FR6, NFR-A2, NFR-A3 of share-with-friend.
 */
function ShareAlertDialog({ message, onDismiss }: ShareAlertDialogProps) {
  const { t } = useTranslation();
  const titleId = useId();
  const messageId = useId();
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    buttonRef.current?.focus();
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
          {t("share.title")}
        </h2>
        <p
          id={messageId}
          data-testid="confirm-dialog-message"
          className="text-sm text-gray-500 mb-6"
        >
          {message}
        </p>
        <div className="flex justify-end">
          <button
            ref={buttonRef}
            type="button"
            data-testid="confirm-dialog-confirm"
            onClick={onDismiss}
            className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent/90 transition-colors"
          >
            {t("share.ok")}
          </button>
        </div>
      </div>
    </div>
  );
}

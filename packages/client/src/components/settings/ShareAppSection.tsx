import { Share2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { useShare } from "@/hooks/useShare";

const SHARE_RESULT_COPIED = "copied";
const SHARE_RESULT_ERROR = "error";

/**
 * Settings section for sharing the app with friends.
 * Triggers Web Share API or clipboard fallback via useShare hook,
 * then displays a confirmation dialog with the result.
 *
 * Implements FR1, FR2, FR3, FR4, FR5, FR6, UX2 of share-with-friend.
 */
export function ShareAppSection() {
  const { t } = useTranslation();
  const { shareApp, shareResult, resetShareResult } = useShare();

  const isDialogVisible =
    shareResult === SHARE_RESULT_COPIED || shareResult === SHARE_RESULT_ERROR;

  const dialogMessage =
    shareResult === SHARE_RESULT_COPIED
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
        data-testid="share-app-button"
        aria-label={t("share.button")}
        onClick={() => void shareApp()}
        className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:border-gray-300 hover:bg-gray-50 transition-colors"
      >
        <Share2 className="w-4 h-4" />
        {t("share.button")}
      </button>
      {isDialogVisible && (
        <ConfirmDialog
          title={t("share.title")}
          message={dialogMessage}
          confirmLabel={t("share.ok")}
          cancelLabel={t("share.ok")}
          onConfirm={resetShareResult}
          onCancel={resetShareResult}
        />
      )}
    </section>
  );
}

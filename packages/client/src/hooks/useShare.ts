import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";

/**
 * Implements FR4, FR5 of share-with-friend.
 *
 * Copies invite message with app URL to clipboard and exposes result state.
 * - FR4: Copies invite text + origin URL to clipboard
 * - FR5: Exposes copyResult state for confirmation dialog
 */

export type CopyResult = "idle" | "copied" | "error";

export interface UseShareReturn {
  copyLink: () => Promise<void>;
  copyResult: CopyResult;
  resetCopyResult: () => void;
}

export function useShare(): UseShareReturn {
  const { t } = useTranslation();
  const [copyResult, setCopyResult] = useState<CopyResult>("idle");

  const copyLink = useCallback(async () => {
    const appUrl = window.location.origin + import.meta.env.BASE_URL;
    const textToCopy = `${t("share.inviteMessage")}\n${appUrl}`;
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopyResult("copied");
    } catch {
      setCopyResult("error");
    }
  }, [t]);

  const resetCopyResult = useCallback(() => {
    setCopyResult("idle");
  }, []);

  return { copyLink, copyResult, resetCopyResult };
}

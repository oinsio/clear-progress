import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";

/**
 * Implements FR3, FR4, FR5 of share-with-friend.
 *
 * Encapsulates Web Share API detection, clipboard fallback, and state management.
 * - FR3: Triggers Web Share API with app title, invite message, and origin URL
 * - FR4: Falls back to clipboard copy when Web Share API is unavailable
 * - FR5: Exposes shareResult state for confirmation dialog
 */

const ABORT_ERROR_NAME = "AbortError";
const APP_TITLE = "Clear Progress";

export type ShareResult = "idle" | "copied" | "error";

export interface UseShareReturn {
  shareApp: () => Promise<void>;
  shareResult: ShareResult;
  resetShareResult: () => void;
}

export function useShare(): UseShareReturn {
  const { t } = useTranslation();
  const [shareResult, setShareResult] = useState<ShareResult>("idle");

  const copyToClipboard = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(window.location.origin);
      setShareResult("copied");
    } catch {
      setShareResult("error");
    }
  }, []);

  const shareApp = useCallback(async () => {
    const isWebShareAvailable = typeof navigator.share === "function";

    if (isWebShareAvailable) {
      try {
        await navigator.share({
          title: APP_TITLE,
          text: t("share.inviteMessage"),
          url: window.location.origin,
        });
      } catch (shareError: unknown) {
        const isAbortError =
          shareError instanceof DOMException &&
          shareError.name === ABORT_ERROR_NAME;

        if (isAbortError) {
          return;
        }

        await copyToClipboard();
      }
    } else {
      await copyToClipboard();
    }
  }, [t, copyToClipboard]);

  const resetShareResult = useCallback(() => {
    setShareResult("idle");
  }, []);

  return { shareApp, shareResult, resetShareResult };
}

import { X } from "lucide-react";
import React, { useCallback, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";

interface CoverLightboxProps {
  imageUrl: string;
  imageAlt: string;
  onClose: () => void;
  triggerRef: React.RefObject<HTMLElement | null>;
}

/**
 * Implements FR1, FR2, NFR-A1 of goal-detail-card-refactor.
 */
export function CoverLightbox({
  imageUrl,
  imageAlt,
  onClose,
  triggerRef,
}: CoverLightboxProps) {
  const { t } = useTranslation();
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // Focus close button on mount
  useEffect(() => {
    closeButtonRef.current?.focus();
  }, []);

  // Return focus to trigger on unmount
  useEffect(() => {
    const trigger = triggerRef.current;
    return () => {
      trigger?.focus();
    };
  }, [triggerRef]);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      } else if (event.key === "Tab") {
        // Focus trap: keep focus on close button
        event.preventDefault();
        closeButtonRef.current?.focus();
      }
    },
    [onClose],
  );

  const handleBackdropClick = useCallback(
    (event: React.MouseEvent) => {
      // Close only if clicking the backdrop itself, not the image
      if (event.target === event.currentTarget) {
        onClose();
      }
    },
    [onClose],
  );

  return (
    <div
      role="dialog"
      aria-modal="true"
      data-testid="cover-lightbox"
      onKeyDown={handleKeyDown}
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-8"
    >
      <button
        ref={closeButtonRef}
        type="button"
        data-testid="cover-lightbox-close"
        aria-label={t("goal.cover.closeLightbox")}
        onClick={onClose}
        className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors"
      >
        <X className="w-6 h-6" />
      </button>
      <img
        src={imageUrl}
        alt={imageAlt}
        className="max-w-full max-h-full object-contain rounded-lg"
      />
    </div>
  );
}

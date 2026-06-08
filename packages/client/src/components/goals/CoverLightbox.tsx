import type React from "react";
import { FileLightbox } from "@/components/shared/FileLightbox";

const COVER_MIME_TYPE = "image/jpeg";
const COVER_LIGHTBOX_TEST_ID = "cover-lightbox";
const COVER_LIGHTBOX_CLOSE_TEST_ID = "cover-lightbox-close";

interface CoverLightboxProps {
  imageUrl: string;
  imageAlt: string;
  onClose: () => void;
  triggerRef: React.RefObject<HTMLElement | null>;
}

/**
 * Implements FR1, FR2, NFR-A1 of goal-detail-card-refactor.
 * Thin wrapper around FileLightbox for backward compatibility.
 */
export function CoverLightbox({
  imageUrl,
  imageAlt,
  onClose,
  triggerRef,
}: CoverLightboxProps) {
  return (
    <FileLightbox
      url={imageUrl}
      mimeType={COVER_MIME_TYPE}
      filename={imageAlt}
      onClose={onClose}
      triggerRef={triggerRef}
      dialogTestId={COVER_LIGHTBOX_TEST_ID}
      closeButtonTestId={COVER_LIGHTBOX_CLOSE_TEST_ID}
    />
  );
}

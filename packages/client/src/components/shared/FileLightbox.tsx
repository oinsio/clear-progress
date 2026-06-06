import { Download, X } from "lucide-react";
import type React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

const DEFAULT_DIALOG_TEST_ID = "file-lightbox";
const DEFAULT_CLOSE_BUTTON_TEST_ID = "file-lightbox-close";

interface FileLightboxProps {
  url: string;
  mimeType: string;
  filename: string;
  onClose: () => void;
  triggerRef: React.RefObject<HTMLElement | null>;
  dialogTestId?: string;
  closeButtonTestId?: string;
}

/**
 * Implements FR9, FR10 of add-file-attachments.
 * Generalized lightbox supporting images, PDFs, text files, and download fallback.
 */
export function FileLightbox({
  url,
  mimeType,
  filename,
  onClose,
  triggerRef,
  dialogTestId = DEFAULT_DIALOG_TEST_ID,
  closeButtonTestId = DEFAULT_CLOSE_BUTTON_TEST_ID,
}: FileLightboxProps) {
  const { t } = useTranslation();
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeButtonRef.current?.focus();
  }, []);

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
        event.preventDefault();
        closeButtonRef.current?.focus();
      }
    },
    [onClose],
  );

  const handleBackdropClick = useCallback(
    (event: React.MouseEvent) => {
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
      aria-label={t("attachment.lightbox.dialogLabel", { filename })}
      data-testid={dialogTestId}
      onKeyDown={handleKeyDown}
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-8"
    >
      <button
        ref={closeButtonRef}
        type="button"
        data-testid={closeButtonTestId}
        aria-label={t("attachment.lightbox.close")}
        onClick={onClose}
        className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors"
      >
        <X className="w-6 h-6" />
      </button>
      <FilePreview url={url} mimeType={mimeType} filename={filename} />
    </div>
  );
}

interface FilePreviewProps {
  url: string;
  mimeType: string;
  filename: string;
}

function FilePreview({ url, mimeType, filename }: FilePreviewProps) {
  const { t } = useTranslation();

  if (mimeType.startsWith("image/")) {
    return (
      <img
        src={url}
        alt={filename}
        className="max-w-full max-h-full object-contain rounded-lg"
      />
    );
  }

  if (mimeType === "application/pdf") {
    return (
      <iframe
        src={url}
        title={filename}
        sandbox="allow-same-origin"
        className="w-full h-full max-w-4xl max-h-full rounded-lg bg-white"
      />
    );
  }

  if (mimeType.startsWith("text/")) {
    return <TextPreview url={url} />;
  }

  return (
    <div className="flex flex-col items-center gap-4 rounded-lg bg-white p-8">
      <p className="text-gray-700">
        {t("attachment.lightbox.previewNotAvailable")}
      </p>
      <a
        href={url}
        download={filename}
        className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 transition-colors"
      >
        <Download className="w-5 h-5" />
        {t("attachment.lightbox.download")}
      </a>
    </div>
  );
}

function TextPreview({ url }: { url: string }) {
  const { t } = useTranslation();
  const [textContent, setTextContent] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    let isCancelled = false;

    fetch(url)
      .then((response) => response.text())
      .then((content) => {
        if (!isCancelled) {
          setTextContent(content);
          setIsLoading(false);
        }
      })
      .catch(() => {
        if (!isCancelled) {
          setHasError(true);
          setIsLoading(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [url]);

  if (isLoading) {
    return (
      <div className="rounded-lg bg-white p-8 text-gray-500">
        {t("attachment.lightbox.loading")}
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="rounded-lg bg-white p-8 text-red-600">
        {t("attachment.lightbox.loadError")}
      </div>
    );
  }

  return (
    <pre className="max-w-4xl max-h-full overflow-auto rounded-lg bg-white p-6 text-sm text-gray-800">
      {textContent}
    </pre>
  );
}

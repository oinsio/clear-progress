import { ALLOWED_FILE_MIME_TYPES } from "@clear-progress/contract";
import { Paperclip } from "lucide-react";
import type React from "react";
import { useCallback, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { validateFile } from "@/utils/validateFile";

const ACCEPT_STRING = ALLOWED_FILE_MIME_TYPES.join(",");

const ERROR_DISPLAY_DURATION_MS = 5000;

interface AttachFileButtonProps {
  onFileSelected: (file: File) => void | Promise<void>;
  isDisabled?: boolean;
  className?: string;
}

/** Implements FR1, FR2, FR3 of add-file-attachments */
export function AttachFileButton({
  onFileSelected,
  isDisabled = false,
  className = "",
}: AttachFileButtonProps) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const errorTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showError = useCallback((message: string) => {
    if (errorTimerRef.current) {
      clearTimeout(errorTimerRef.current);
    }
    setErrorMessage(message);
    errorTimerRef.current = setTimeout(() => {
      setErrorMessage("");
      errorTimerRef.current = null;
    }, ERROR_DISPLAY_DURATION_MS);
  }, []);

  const handleButtonClick = useCallback(() => {
    inputRef.current?.click();
  }, []);

  /** Implements FR7 of fix-file-mime-detection, FR5 of attachment-drag-and-drop */
  const handleFileChange = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];

      // Reset input so re-selecting the same file triggers onChange
      event.target.value = "";

      if (!file) return;

      const validationResult = await validateFile(file);

      if (!validationResult.valid) {
        showError(t(validationResult.errorKey));
        return;
      }

      setErrorMessage("");
      onFileSelected(validationResult.file);
    },
    [onFileSelected, showError, t],
  );

  return (
    <div className={className}>
      <button
        type="button"
        data-testid="attach-file-button"
        disabled={isDisabled}
        onClick={handleButtonClick}
        className="flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        <Paperclip className="w-4 h-4" aria-hidden="true" />
        {t("attachment.attach.button")}
      </button>

      <input
        ref={inputRef}
        data-testid="attach-file-input"
        type="file"
        accept={ACCEPT_STRING}
        className="hidden"
        onChange={handleFileChange}
      />

      {errorMessage && (
        <p
          data-testid="attach-file-error"
          className="mt-1 text-xs text-red-500"
          role="alert"
        >
          {errorMessage}
        </p>
      )}
    </div>
  );
}

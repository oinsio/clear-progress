import type React from "react";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { validateFile } from "@/utils/validateFile";

const ERROR_DISPLAY_DURATION_MS = 5000;

interface FileDropZoneProps {
  onFilesAccepted: (files: File[]) => void | Promise<void>;
  children: React.ReactNode;
}

/**
 * Container component with native drag-and-drop for file uploads.
 * Shows dashed-border overlay on file drag. Hidden on touch-only devices
 * via `pointer-fine:` Tailwind variant.
 *
 * Implements FR1, FR2, FR3, FR6, FR7, FR8, NFR-A1, NFR-R1, UX1-UX5
 * of attachment-drag-and-drop.
 */
export function FileDropZone({ onFilesAccepted, children }: FileDropZoneProps) {
  const { t } = useTranslation();
  const [isDragOver, setIsDragOver] = useState(false);
  const [rejectionMessage, setRejectionMessage] = useState("");
  const rejectionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dragCounterRef = useRef(0);

  function showRejection(message: string) {
    if (rejectionTimerRef.current) {
      clearTimeout(rejectionTimerRef.current);
    }
    setRejectionMessage(message);
    rejectionTimerRef.current = setTimeout(() => {
      setRejectionMessage("");
      rejectionTimerRef.current = null;
    }, ERROR_DISPLAY_DURATION_MS);
  }

  function handleDragEnter(event: React.DragEvent) {
    event.preventDefault();
    if (!event.dataTransfer.types.includes("Files")) return;
    dragCounterRef.current += 1;
    if (dragCounterRef.current === 1) {
      setIsDragOver(true);
    }
  }

  function handleDragOver(event: React.DragEvent) {
    event.preventDefault();
  }

  function handleDragLeave(event: React.DragEvent) {
    event.preventDefault();
    dragCounterRef.current -= 1;
    if (dragCounterRef.current === 0) {
      setIsDragOver(false);
    }
  }

  async function handleDrop(event: React.DragEvent) {
    event.preventDefault();
    dragCounterRef.current = 0;
    setIsDragOver(false);

    const droppedFiles = Array.from(event.dataTransfer.files);
    if (droppedFiles.length === 0) return;

    const validFiles: File[] = [];
    const rejectedFilenames: string[] = [];

    for (const file of droppedFiles) {
      const validationResult = await validateFile(file);
      if (validationResult.valid) {
        validFiles.push(validationResult.file);
      } else {
        rejectedFilenames.push(validationResult.filename);
      }
    }

    if (validFiles.length > 0) {
      onFilesAccepted(validFiles);
    }

    if (rejectedFilenames.length > 0) {
      showRejection(
        t("attachment.dropZone.rejected", {
          filenames: rejectedFilenames.join(", "),
        }),
      );
    }
  }

  return (
    <div
      className="relative"
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {children}

      {isDragOver && (
        <div
          data-testid="file-drop-overlay"
          className="hidden pointer-fine:flex absolute inset-0 items-center justify-center border-2 border-dashed border-blue-400 bg-blue-50/80 dark:bg-blue-950/80 rounded-lg z-10"
        >
          <p className="text-sm text-blue-600 dark:text-blue-300 font-medium">
            {t("attachment.dropZone.hint")}
          </p>
        </div>
      )}

      {rejectionMessage && (
        <p
          data-testid="file-drop-error"
          className="mt-1 text-xs text-red-500"
          role="alert"
        >
          {rejectionMessage}
        </p>
      )}
    </div>
  );
}

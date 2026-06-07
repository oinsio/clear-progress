import { Download, Eye, File, FileText, ImageIcon, Trash2 } from "lucide-react";
import type React from "react";
import { useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useFileUrl } from "@/hooks/useFileUrl";
import type { Attachment } from "@/types/entities";

const BYTES_IN_KB = 1024;
const BYTES_IN_MB = 1024 * 1024;

interface AttachmentListItemProps {
  attachment: Attachment;
  onDelete: (attachmentId: string) => void;
  onPreview: (
    attachment: Attachment,
    triggerRef: React.RefObject<HTMLElement | null>,
  ) => void;
  isReadOnly?: boolean;
}

/** Implements FR11, FR12 of add-file-attachments */
export function AttachmentListItem({
  attachment,
  onDelete,
  onPreview,
  isReadOnly = false,
}: AttachmentListItemProps) {
  const { t } = useTranslation();
  const { url } = useFileUrl(attachment.data_hash);
  const previewButtonRef = useRef<HTMLButtonElement>(null);

  const handlePreview = useCallback(() => {
    onPreview(
      attachment,
      previewButtonRef as React.RefObject<HTMLElement | null>,
    );
  }, [attachment, onPreview]);

  const handleDownload = useCallback(() => {
    if (!url) return;
    const downloadLink = document.createElement("a");
    downloadLink.href = url;
    downloadLink.download = attachment.filename;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  }, [url, attachment.filename]);

  const handleDelete = useCallback(() => {
    onDelete(attachment.id);
  }, [onDelete, attachment.id]);

  return (
    <li
      className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white px-3 py-2 dark:border-gray-700 dark:bg-gray-800"
      data-testid={`attachment-item-${attachment.id}`}
    >
      <FileTypeIcon mimeType={attachment.mime_type} />

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">
          {attachment.filename}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {formatFileSize(attachment.file_size)}
        </p>
      </div>

      <div className="flex items-center gap-1">
        <button
          ref={previewButtonRef}
          type="button"
          onClick={handlePreview}
          aria-label={t("attachment.list.preview", {
            filename: attachment.filename,
          })}
          className="rounded p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-200"
          data-testid={`attachment-preview-${attachment.id}`}
        >
          <Eye className="h-4 w-4" />
        </button>

        <button
          type="button"
          onClick={handleDownload}
          disabled={!url}
          aria-label={t("attachment.list.download", {
            filename: attachment.filename,
          })}
          className="rounded p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-40 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-200"
          data-testid={`attachment-download-${attachment.id}`}
        >
          <Download className="h-4 w-4" />
        </button>

        {!isReadOnly && (
          <button
            type="button"
            onClick={handleDelete}
            aria-label={t("attachment.list.delete", {
              filename: attachment.filename,
            })}
            className="rounded p-1.5 text-gray-500 hover:bg-red-50 hover:text-red-600 dark:text-gray-400 dark:hover:bg-red-900/20 dark:hover:text-red-400"
            data-testid={`attachment-delete-${attachment.id}`}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>
    </li>
  );
}

function FileTypeIcon({ mimeType }: { mimeType: string }) {
  const iconClassName = "h-5 w-5 text-gray-400 dark:text-gray-500";

  if (mimeType.startsWith("image/")) {
    return <ImageIcon className={iconClassName} />;
  }
  if (mimeType === "application/pdf" || mimeType.startsWith("text/")) {
    return <FileText className={iconClassName} />;
  }
  return <File className={iconClassName} />;
}

function formatFileSize(bytes: number): string {
  if (bytes < BYTES_IN_KB) return `${bytes} B`;
  if (bytes < BYTES_IN_MB) return `${(bytes / BYTES_IN_KB).toFixed(1)} KB`;
  return `${(bytes / BYTES_IN_MB).toFixed(1)} MB`;
}

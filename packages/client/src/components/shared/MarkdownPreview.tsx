import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface MarkdownPreviewProps {
  url: string;
}

/**
 * Implements FR11 of add-file-attachments.
 * Renders markdown files with formatting (headings, lists, links, tables, code blocks).
 */
export function MarkdownPreview({ url }: MarkdownPreviewProps) {
  const { t } = useTranslation();
  const [markdownContent, setMarkdownContent] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    let isCancelled = false;

    fetch(url)
      .then((response) => response.text())
      .then((content) => {
        if (!isCancelled) {
          setMarkdownContent(content);
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
    <div
      className="max-w-4xl max-h-full overflow-auto rounded-lg bg-white p-6"
      onClick={(event) => event.stopPropagation()}
    >
      <article className="prose prose-sm max-w-none">
        <Markdown remarkPlugins={[remarkGfm]}>{markdownContent}</Markdown>
      </article>
    </div>
  );
}

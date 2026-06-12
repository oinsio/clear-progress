import type { AnchorHTMLAttributes } from "react";
import Markdown from "react-markdown";
import rehypeSanitize from "rehype-sanitize";
import remarkBreaks from "remark-breaks";
import remarkGfm from "remark-gfm";

import { cn } from "@/shared/lib/cn";
import { shortenUrl } from "@/utils/linkify";

import { LinkChip } from "./LinkChip";

interface DescriptionMarkdownProps {
  text: string;
  className?: string;
}

/**
 * Implements FR1, FR2, FR3, FR4, FR5, FR7, FR9 of markdown-in-descriptions.
 * Renders Markdown text as formatted HTML for description fields.
 */
export function DescriptionMarkdown({
  text,
  className,
}: DescriptionMarkdownProps) {
  return (
    <div className={cn("prose prose-sm", className)}>
      {text && (
        <Markdown
          remarkPlugins={[remarkGfm, remarkBreaks]}
          rehypePlugins={[rehypeSanitize]}
          components={{ a: MarkdownLink }}
        >
          {text}
        </Markdown>
      )}
    </div>
  );
}

function MarkdownLink({
  children,
  href = "",
}: AnchorHTMLAttributes<HTMLAnchorElement>) {
  return (
    <LinkChip href={href}>
      {children === href ? shortenUrl(href) : children}
    </LinkChip>
  );
}

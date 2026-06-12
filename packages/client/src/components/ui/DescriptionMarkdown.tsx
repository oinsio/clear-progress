import type { AnchorHTMLAttributes, MouseEvent } from "react";
import Markdown from "react-markdown";
import rehypeSanitize from "rehype-sanitize";
import remarkGfm from "remark-gfm";

import { cn } from "@/shared/lib/cn";

interface DescriptionMarkdownProps {
  text: string;
  className?: string;
}

/**
 * Implements FR1, FR2, FR3, FR4, FR5, FR7 of markdown-in-descriptions.
 * Renders Markdown text as formatted HTML for description fields.
 */
export function DescriptionMarkdown({
  text,
  className,
}: DescriptionMarkdownProps) {
  if (!text) {
    return <div className={cn("prose prose-sm", className)} />;
  }

  return (
    <div className={cn("prose prose-sm", className)}>
      <Markdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeSanitize]}
        components={{ a: MarkdownLink }}
      >
        {text}
      </Markdown>
    </div>
  );
}

function MarkdownLink({
  children,
  href,
  ...props
}: AnchorHTMLAttributes<HTMLAnchorElement>) {
  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    event.stopPropagation();
  };

  return (
    <a
      {...props}
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={handleClick}
    >
      {children}
    </a>
  );
}

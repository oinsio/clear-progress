import type { ComponentPropsWithoutRef, ReactElement } from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { MermaidBlock } from "./MermaidBlock";

const MERMAID_LANGUAGE = "mermaid";
const MERMAID_CLASS_PATTERN = /language-mermaid/;

interface MemoMarkdownProps {
  content: string;
}

type CodeBlockProps = ComponentPropsWithoutRef<"code">;
type PreBlockProps = ComponentPropsWithoutRef<"pre">;

function hasMermaidChild(children: unknown): boolean {
  const child = Array.isArray(children) ? children[0] : children;
  if (child == null || typeof child !== "object") return false;
  const element = child as ReactElement<{ className?: string }>;
  return MERMAID_CLASS_PATTERN.test(element.props?.className ?? "");
}

function PreRenderer({ children, ...restProps }: PreBlockProps) {
  if (hasMermaidChild(children)) {
    return <>{children}</>;
  }

  return <pre {...restProps}>{children}</pre>;
}

function CodeRenderer({ children, className, ...restProps }: CodeBlockProps) {
  const codeContent = String(children).replace(/\n$/, "");
  const languageMatch = className?.match(/language-(\w+)/);
  const language = languageMatch?.[1];

  if (language === MERMAID_LANGUAGE) {
    return <MermaidBlock code={codeContent} />;
  }

  return (
    <code className={className} {...restProps}>
      {children}
    </code>
  );
}

/**
 * Implements FR6 of add-memos.
 * Renders memo markdown content with GFM support and mermaid diagram rendering.
 */
export function MemoMarkdown({ content }: MemoMarkdownProps) {
  return (
    <article className="prose prose-sm max-w-none dark:prose-invert">
      <Markdown
        remarkPlugins={[remarkGfm]}
        components={{ code: CodeRenderer, pre: PreRenderer }}
      >
        {content}
      </Markdown>
    </article>
  );
}

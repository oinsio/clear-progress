import type { ReactNode } from "react";

/** Implements FR9, FR4, FR5 of markdown-in-descriptions. */

interface LinkChipProps {
  href: string;
  children: ReactNode;
}

export function LinkChip({ href, children }: LinkChipProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      title={href}
      onClick={(e) => e.stopPropagation()}
      className="bg-blue-600/5 hover:bg-blue-600/10 text-blue-600 rounded px-1 inline-flex items-baseline gap-0.5"
    >
      <span className="text-xs">🔗</span>
      <span className="truncate max-w-[16.25rem]">{children}</span>
    </a>
  );
}

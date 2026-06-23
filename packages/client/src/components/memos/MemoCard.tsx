/**
 * MemoCard — displays a memo entry as a clickable card with icon, title, and description.
 * Implements FR3, NFR-A1 of add-memos.
 */
import { icons } from "lucide-react";
import type { KeyboardEvent } from "react";
import { useCallback } from "react";

const ENTER_KEY = "Enter";
const SPACE_KEY = " ";

interface MemoCardProps {
  title: string;
  description: string;
  icon: string;
  onClick: () => void;
}

function kebabToPascalCase(kebabName: string): string {
  return kebabName
    .split("-")
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join("");
}

export function MemoCard({ title, description, icon, onClick }: MemoCardProps) {
  const pascalIconName = kebabToPascalCase(icon);
  const IconComponent = icons[pascalIconName as keyof typeof icons];

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      if (event.key === ENTER_KEY || event.key === SPACE_KEY) {
        event.preventDefault();
        onClick();
      }
    },
    [onClick],
  );

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      className="flex items-start gap-4 rounded-lg border border-gray-100 bg-white p-4 shadow-sm transition-colors hover:border-accent/30 hover:bg-gray-50 cursor-pointer focus:outline-none focus:ring-2 focus:ring-accent/50"
      data-testid="memo-card"
    >
      <div className="flex-shrink-0 mt-0.5 text-accent">
        {IconComponent ? (
          <IconComponent className="w-6 h-6" aria-hidden="true" />
        ) : (
          <span className="w-6 h-6 block" aria-hidden="true" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <h2 className="text-base font-medium text-gray-900">{title}</h2>
        <p className="mt-1 text-sm text-gray-500 line-clamp-2">{description}</p>
      </div>
    </div>
  );
}

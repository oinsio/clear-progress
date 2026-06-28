import type { LucideIcon } from "lucide-react";
import { ChevronRight } from "lucide-react";
import { cn } from "@/shared/lib/cn";

/** Implements FR1, NFR-A1 of icons-for-task-detail */
interface DrillDownRowProps {
  label: string;
  value: string;
  hasValue: boolean;
  onClick: () => void;
  icon?: LucideIcon;
  testId?: string;
}

export function DrillDownRow({
  label,
  value,
  hasValue,
  onClick,
  icon: Icon,
  testId,
}: DrillDownRowProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      data-testid={testId}
      className="flex items-center justify-between w-full py-2.5 text-sm border-b border-gray-100"
    >
      <div className="flex items-center gap-1.5">
        {Icon && <Icon className="w-4 h-4 text-gray-500" aria-hidden="true" />}
        <span className="text-gray-500 font-medium">{label}</span>
      </div>
      <div className="flex items-center gap-1">
        <span className={cn(hasValue ? "text-gray-800" : "text-gray-400")}>
          {value}
        </span>
        <ChevronRight className="w-4 h-4 text-gray-400" />
      </div>
    </button>
  );
}

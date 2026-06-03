import { ChevronDown, Inbox } from "lucide-react";
import type * as React from "react";
import { useCallback, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import {
  AllBoxesIcon,
  LaterBoxIcon,
  TodayBoxIcon,
  WeekBoxIcon,
} from "@/components/tasks/BoxIcons";
import { cn } from "@/shared/lib/cn";
import type { BoxFilter } from "@/types/common";
import type { CommandBarFilterConfig } from "./CommandBar";

/**
 * Implements FR5, FR6, FR8, FR9 of command-bar.
 */

const BOX_FILTER_ICONS: Record<BoxFilter, React.FC<{ className?: string }>> = {
  today: TodayBoxIcon,
  week: WeekBoxIcon,
  later: LaterBoxIcon,
  all: AllBoxesIcon,
  inbox: Inbox,
};

interface CommandBarFilterProps {
  config: CommandBarFilterConfig;
  isExpanded: boolean;
  onExpandedChange: (expanded: boolean) => void;
}

export function CommandBarFilter({
  config,
  isExpanded,
  onExpandedChange,
}: CommandBarFilterProps) {
  const { t } = useTranslation();
  const filterAreaRef = useRef<HTMLDivElement>(null);
  const ActiveIcon = BOX_FILTER_ICONS[config.activeBox];

  const handleToggle = useCallback(() => {
    onExpandedChange(!isExpanded);
  }, [isExpanded, onExpandedChange]);

  const handleSelect = useCallback(
    (box: BoxFilter) => {
      config.onBoxChange(box);
      onExpandedChange(false);
    },
    [config, onExpandedChange],
  );

  // Close on outside click/touch
  useEffect(() => {
    if (!isExpanded) return;

    function handlePointerDown(event: PointerEvent) {
      if (
        filterAreaRef.current &&
        !filterAreaRef.current.contains(event.target as Node)
      ) {
        onExpandedChange(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [isExpanded, onExpandedChange]);

  return (
    <div ref={filterAreaRef} className="flex items-center gap-1">
      {isExpanded ? (
        <div data-testid="command-bar-filter-area" className="flex gap-1">
          {config.boxes.map((box) => {
            const Icon = BOX_FILTER_ICONS[box];
            const isActive = box === config.activeBox;
            return (
              <button
                key={box}
                type="button"
                data-testid={`box-filter-${box}`}
                onClick={() => handleSelect(box)}
                aria-label={t(`box.${box}`)}
                className={cn(
                  "w-10 h-10 flex items-center justify-center rounded-full transition-colors",
                  isActive
                    ? "text-white bg-accent"
                    : "text-gray-400 hover:text-gray-600 hover:bg-gray-100 active:bg-gray-200",
                )}
              >
                <span data-testid={`box-icon-${box}`}>
                  <Icon className="w-7 h-7" />
                </span>
              </button>
            );
          })}
        </div>
      ) : (
        <button
          type="button"
          data-testid="command-bar-filter-toggle"
          onClick={handleToggle}
          aria-label={t("commandBar.filterByBox")}
          aria-expanded={isExpanded}
          className="flex items-center gap-0.5 px-1 py-1 text-accent rounded-lg active:bg-accent/10 transition-colors"
        >
          <span data-testid={`box-icon-${config.activeBox}`}>
            <ActiveIcon className="w-7 h-7" />
          </span>
          <ChevronDown
            className="w-3 h-3"
            aria-hidden="true"
            data-testid="filter-chevron"
          />
        </button>
      )}
    </div>
  );
}

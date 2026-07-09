import { ChevronDown } from "lucide-react";
import { useCallback, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { cn } from "@/shared/lib/cn";
import type { CommandBarFilterConfig } from "./CommandBar";

/**
 * Implements FR5, FR6, FR8, FR9 of command-bar.
 */

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
  const activeItem = config.items.find(
    (item) => item.value === config.activeValue,
  );
  const ActiveIcon = activeItem?.icon;

  const handleToggle = useCallback(() => {
    onExpandedChange(!isExpanded);
  }, [isExpanded, onExpandedChange]);

  const handleSelect = useCallback(
    (value: string) => {
      config.onChange(value);
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
          {config.items.map((item) => {
            const Icon = item.icon;
            const isActive = item.value === config.activeValue;
            return (
              <button
                key={item.value}
                type="button"
                data-testid={`box-filter-${item.value}`}
                onClick={() => handleSelect(item.value)}
                aria-label={item.label}
                className={cn(
                  "w-10 h-10 flex items-center justify-center rounded-full transition-colors",
                  isActive
                    ? "text-white bg-accent"
                    : "text-gray-400 hover:text-gray-600 hover:bg-gray-100 active:bg-gray-200",
                )}
              >
                <span data-testid={`box-icon-${item.value}`}>
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
          <span data-testid={`box-icon-${config.activeValue}`}>
            {ActiveIcon && <ActiveIcon className="w-7 h-7" />}
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

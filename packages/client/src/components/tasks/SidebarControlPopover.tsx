import { Check } from "lucide-react";
import React, { useCallback, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { SIDEBAR_MODE_I18N_KEYS, SIDEBAR_MODES } from "@/constants";
import { cn } from "@/shared/lib/cn";
import type { SidebarMode } from "@/types/common";

interface SidebarControlPopoverProps {
  currentMode: SidebarMode;
  onModeChange: (mode: SidebarMode) => void;
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Popover with three radio-style options for sidebar behavior mode.
 * Supports keyboard navigation: Arrow keys, Enter, Escape.
 *
 * Implements FR2, NFR-A1, NFR-A2 of improve-sidebar-ux.
 */
export function SidebarControlPopover({
  currentMode,
  onModeChange,
  isOpen,
  onClose,
}: SidebarControlPopoverProps) {
  const { t } = useTranslation();
  const popoverRef = useRef<HTMLDivElement>(null);
  const optionRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const focusCurrentOption = useCallback(() => {
    const currentIndex = SIDEBAR_MODES.indexOf(currentMode);
    const targetIndex = currentIndex >= 0 ? currentIndex : 0;
    optionRefs.current[targetIndex]?.focus();
  }, [currentMode]);

  useEffect(() => {
    if (isOpen) {
      focusCurrentOption();
    }
  }, [isOpen, focusCurrentOption]);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        event.preventDefault();
        const focusedElement =
          document.activeElement as HTMLButtonElement | null;
        const currentIndex = optionRefs.current.indexOf(focusedElement);
        if (currentIndex === -1) return;

        const nextIndex =
          event.key === "ArrowDown"
            ? (currentIndex + 1) % SIDEBAR_MODES.length
            : (currentIndex - 1 + SIDEBAR_MODES.length) % SIDEBAR_MODES.length;
        optionRefs.current[nextIndex]?.focus();
      }
    },
    [onClose],
  );

  const handleOptionClick = useCallback(
    (mode: SidebarMode) => {
      onModeChange(mode);
      onClose();
    },
    [onModeChange, onClose],
  );

  if (!isOpen) return null;

  return (
    <div
      ref={popoverRef}
      role="listbox"
      aria-label={t("sidebar.control")}
      data-testid="sidebar-control-popover"
      onKeyDown={handleKeyDown}
      className="absolute bottom-full left-0 mb-2 w-48 rounded-xl bg-white dark:bg-gray-800 shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50"
    >
      {SIDEBAR_MODES.map((mode, index) => {
        const isActive = mode === currentMode;
        return (
          <button
            key={mode}
            ref={(element) => {
              optionRefs.current[index] = element;
            }}
            type="button"
            role="option"
            aria-selected={isActive}
            data-testid={`sidebar-mode-option-${mode}`}
            onClick={() => handleOptionClick(mode)}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2 text-sm text-left transition-colors",
              isActive
                ? "text-accent font-medium"
                : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700",
            )}
          >
            <span
              className={cn(
                "w-4 h-4 flex items-center justify-center flex-shrink-0",
                !isActive && "invisible",
              )}
              aria-hidden="true"
            >
              {isActive && <Check className="w-4 h-4" />}
            </span>
            <span>{t(SIDEBAR_MODE_I18N_KEYS[mode])}</span>
          </button>
        );
      })}
    </div>
  );
}

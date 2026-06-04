import type { LucideIcon } from "lucide-react";
import { Eye, EyeOff, Plus } from "lucide-react";
import type React from "react";
import { useCallback, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useFilterBarPosition } from "@/hooks/useFilterBarPosition";
import { useHandedness } from "@/hooks/useHandedness";
import { useTextareaAutoGrow } from "@/hooks/useTextareaAutoGrow";
import { cn } from "@/shared/lib/cn";
import type { BoxFilter } from "@/types/common";
import { CommandBarFilter } from "./CommandBarFilter";

/**
 * Implements FR1, FR2, FR3, FR4, FR11, FR13, FR14, FR15, FR20, FR21 of command-bar.
 */

export interface CommandBarFilterConfig {
  boxes: BoxFilter[];
  activeBox: BoxFilter;
  onBoxChange: (box: BoxFilter) => void;
}

export interface CommandBarEyeToggleConfig {
  isVisible: boolean;
  onToggle: () => void;
}

export interface CommandBarProps {
  filter?: CommandBarFilterConfig;
  eyeToggle?: CommandBarEyeToggleConfig;
  entityIcon: LucideIcon | React.ComponentType<{ className?: string }>;
  placeholder: string;
  onSubmit: (value: string) => void;
}

export function CommandBar({
  filter,
  eyeToggle,
  entityIcon: EntityIcon,
  placeholder,
  onSubmit,
}: CommandBarProps) {
  const { t } = useTranslation();
  const { handedness } = useHandedness();
  const isLeftHanded = handedness === "left";
  const { filterBarPosition } = useFilterBarPosition();
  const isBottomPosition = filterBarPosition === "bottom";
  const barRef = useRef<HTMLDivElement | null>(null);
  const { textareaRef, actionsRef, handleInput } = useTextareaAutoGrow();
  const internalTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const [isFilterExpanded, setIsFilterExpanded] = useState(false);

  const setTextareaRef = useCallback(
    (node: HTMLTextAreaElement | null) => {
      internalTextareaRef.current = node;
      (
        textareaRef as React.MutableRefObject<HTMLTextAreaElement | null>
      ).current = node;
    },
    [textareaRef],
  );

  const handleSubmit = useCallback(() => {
    const textarea = internalTextareaRef.current;
    if (!textarea) return;

    const trimmedValue = textarea.value.trim();
    if (!trimmedValue) return;

    onSubmit(trimmedValue);
    textarea.value = "";
    handleInput();
  }, [onSubmit, handleInput]);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (event.key === "Enter") {
        event.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit],
  );

  const handleTextareaFocus = useCallback(() => {
    setIsFilterExpanded(false);
  }, []);

  const handleFilterExpandedChange = useCallback((expanded: boolean) => {
    setIsFilterExpanded(expanded);
  }, []);

  return (
    <div
      ref={barRef}
      className={cn(
        "bg-white shrink-0 px-3 py-2 flex items-start gap-1.5",
        isBottomPosition
          ? "order-last border-t border-gray-200 pb-[calc(0.5rem+env(safe-area-inset-bottom))]"
          : "border-b border-gray-200",
        isLeftHanded && "flex-row-reverse",
      )}
      data-testid="command-bar"
    >
      {filter && (
        <CommandBarFilter
          config={filter}
          isExpanded={isFilterExpanded}
          onExpandedChange={handleFilterExpandedChange}
        />
      )}

      <div className="flex-1 relative min-w-0">
        <span
          className="absolute left-2.5 top-2 w-5 h-5 text-accent pointer-events-none"
          aria-hidden="true"
          data-testid="command-bar-entity-icon"
        >
          <EntityIcon className="w-5 h-5" />
        </span>
        <textarea
          ref={setTextareaRef}
          rows={1}
          aria-label={placeholder}
          placeholder={placeholder}
          onInput={handleInput}
          onKeyDown={handleKeyDown}
          onFocus={handleTextareaFocus}
          className="m-0 block border border-gray-200 outline-none focus:border-accent rounded-2xl py-2 pr-3 pl-9 text-sm leading-snug min-h-9 max-h-40 resize-none overflow-hidden placeholder:text-gray-400 text-gray-900 transition-colors w-full"
          data-testid="command-bar-textarea"
        />
      </div>

      <div
        ref={actionsRef as React.RefObject<HTMLDivElement>}
        className={cn(
          "flex shrink-0 self-end gap-1",
          isLeftHanded && "flex-row-reverse",
        )}
        data-testid="command-bar-actions"
      >
        {eyeToggle && (
          <button
            type="button"
            data-testid="command-bar-eye-toggle"
            onClick={eyeToggle.onToggle}
            aria-pressed={eyeToggle.isVisible}
            aria-label={t("commandBar.toggleHiddenItems")}
            className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center transition-colors",
              eyeToggle.isVisible
                ? "bg-accent/10 text-accent"
                : "text-gray-400 hover:bg-gray-100",
            )}
          >
            {eyeToggle.isVisible ? (
              <Eye className="w-5 h-5" aria-hidden="true" />
            ) : (
              <EyeOff className="w-5 h-5" aria-hidden="true" />
            )}
          </button>
        )}

        <button
          type="button"
          data-testid="command-bar-create-button"
          onClick={handleSubmit}
          aria-label={t("commandBar.create")}
          className="w-10 h-10 rounded-full bg-accent text-white flex items-center justify-center shadow-md hover:bg-accent/80 active:bg-accent/70 transition-colors"
        >
          <Plus className="w-5 h-5" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

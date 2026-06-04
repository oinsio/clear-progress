import type React from "react";
import { useCallback, useRef } from "react";
import { COMMAND_BAR_STACKED_CLASS } from "@/constants";

interface UseTextareaAutoGrowReturn {
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  actionsRef: React.RefObject<HTMLDivElement | null>;
  handleInput: () => void;
}

/**
 * Implements FR10, FR12, NFR-P1 of command-bar.
 * Telegram-style textarea auto-grow.
 *
 * Layout (row vs stacked buttons) is controlled via a CSS class
 * applied directly to the DOM — no React state — to avoid
 * re-render feedback loops that caused eye-toggle oscillation.
 *
 * Algorithm (matches proven mockup):
 * 1. Remove stacked class → measure scrollHeight in row mode
 * 2. Toggle stacked class based on whether text wraps
 * 3. If stacked, re-measure (textarea is wider) and set final height
 */
export function useTextareaAutoGrow(): UseTextareaAutoGrowReturn {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const actionsRef = useRef<HTMLDivElement | null>(null);
  const singleLineHeightRef = useRef<number>(0);

  const handleInput = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const actions = actionsRef.current;

    // Measure singleLineHeight on first call (lazy init)
    if (singleLineHeightRef.current === 0) {
      textarea.style.height = "auto";
      singleLineHeightRef.current = textarea.scrollHeight;
      textarea.style.height = "";
    }

    const singleLineHeight = singleLineHeightRef.current;
    const maxHeight = parseFloat(getComputedStyle(textarea).maxHeight);

    // Step 1: Remove stacked class to measure in row mode
    if (actions) {
      actions.classList.remove(COMMAND_BAR_STACKED_CLASS);
    }
    textarea.style.height = "auto";
    const rowScrollHeight = textarea.scrollHeight;
    const shouldStack = rowScrollHeight > singleLineHeight;

    // Step 2: Toggle stacked class
    if (actions) {
      actions.classList.toggle(COMMAND_BAR_STACKED_CLASS, shouldStack);
    }

    // Step 3: If not wrapped, clear inline styles
    if (!shouldStack) {
      textarea.style.height = "";
      textarea.style.overflowY = "";
      return;
    }

    // Step 4: Wrapped — re-measure after stacking (textarea is wider)
    textarea.style.height = "auto";
    const finalScrollHeight = textarea.scrollHeight;
    const finalHeight = Math.min(finalScrollHeight, maxHeight);
    textarea.style.height = `${finalHeight}px`;
    textarea.style.overflowY =
      finalScrollHeight > maxHeight ? "auto" : "hidden";
  }, []);

  return {
    textareaRef,
    actionsRef,
    handleInput,
  };
}

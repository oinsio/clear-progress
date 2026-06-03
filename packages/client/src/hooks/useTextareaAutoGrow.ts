import React, { useCallback, useRef, useState } from "react";
import { COMMAND_BAR_STACKED_CLASS } from "@/constants";

interface UseTextareaAutoGrowReturn {
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  actionsRef: React.RefObject<HTMLDivElement | null>;
  isWrapped: boolean;
  handleInput: () => void;
}

/**
 * Implements FR10, FR12, NFR-P1 of command-bar.
 * Telegram-style textarea auto-grow with anti-oscillation.
 * Measures in row-mode (stacked class removed) for stable threshold,
 * then applies stacking if wrapped and re-measures for final height.
 */
export function useTextareaAutoGrow(): UseTextareaAutoGrowReturn {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const actionsRef = useRef<HTMLDivElement | null>(null);
  const singleLineHeightRef = useRef<number>(0);
  const [isWrapped, setIsWrapped] = useState(false);

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

    // Step 1: Remove stacked class to measure in row-mode
    if (actions) {
      actions.classList.remove(COMMAND_BAR_STACKED_CLASS);
    }
    textarea.style.height = "auto";
    const rowScrollHeight = textarea.scrollHeight;
    const shouldStack = rowScrollHeight > singleLineHeight;

    // Step 2: Toggle stacked class
    if (actions) {
      if (shouldStack) {
        actions.classList.add(COMMAND_BAR_STACKED_CLASS);
      }
    }

    // Step 3: If not wrapped, clear inline styles
    if (!shouldStack) {
      textarea.style.height = "";
      textarea.style.overflowY = "";
      setIsWrapped(false);
      return;
    }

    // Step 4: Wrapped — re-measure after stacking (textarea is wider)
    textarea.style.height = "auto";
    const finalScrollHeight = textarea.scrollHeight;
    const finalHeight = Math.min(finalScrollHeight, maxHeight);
    textarea.style.height = `${finalHeight}px`;
    textarea.style.overflowY =
      finalScrollHeight > maxHeight ? "auto" : "hidden";
    setIsWrapped(true);
  }, []);

  return {
    textareaRef,
    actionsRef,
    isWrapped,
    handleInput,
  };
}

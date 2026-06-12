import { useEffect, useRef } from "react";

export function useAutoResizeTextarea(value: string) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // biome-ignore lint/correctness/useExhaustiveDependencies: value triggers recalculation when content changes — textarea height must update even though value is not read inside the effect
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    // Reset height for correct recalculation
    textarea.style.height = "auto";
    // Set height based on scrollHeight
    textarea.style.height = `${textarea.scrollHeight}px`;
  }, [value]);

  return textareaRef;
}

import { useEffect, useRef } from "react";

export function useAutoResizeTextarea(_value: string) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    // Reset height for correct recalculation
    textarea.style.height = "auto";
    // Set height based on scrollHeight
    textarea.style.height = `${textarea.scrollHeight}px`;
  }, []);

  return textareaRef;
}

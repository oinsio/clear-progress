import { useEffect, useRef } from "react";

export function useAutoResizeTextarea(value: string) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    // Сбросить высоту для корректного пересчёта
    textarea.style.height = "auto";
    // Установить высоту по scrollHeight
    textarea.style.height = `${textarea.scrollHeight}px`;
  }, [value]);

  return textareaRef;
}

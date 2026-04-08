import React, { useState, useRef, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";

export interface AddTaskInputProps {
  targetBox: string;
  onAdd: (title: string) => Promise<void>;
  onCancel: () => void;
}

export function AddTaskInput({
  targetBox,
  onAdd,
  onCancel,
}: AddTaskInputProps) {
  const { t } = useTranslation();
  const [inputValue, setInputValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.style.height = "auto";
    textarea.style.height = `${textarea.scrollHeight}px`;
  }, [inputValue]);

  const handleKeyDown = useCallback(
    async (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (event.key === "Enter" && inputValue.trim()) {
        await onAdd(inputValue.trim());
        setInputValue("");
      } else if (event.key === "Escape") {
        onCancel();
      }
    },
    [inputValue, onAdd, onCancel],
  );

  const handleBlur = useCallback(async () => {
    if (inputValue.trim()) {
      await onAdd(inputValue.trim());
      setInputValue("");
    } else {
      onCancel();
    }
  }, [inputValue, onAdd, onCancel]);

  return (
    <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-3">
      <div className="w-5 h-5 rounded-full border-2 border-accent flex-shrink-0" />
      <textarea
        ref={textareaRef}
        rows={1}
        value={inputValue}
        onChange={(event) => setInputValue(event.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        placeholder={t("task.addPlaceholder", { box: targetBox })}
        className="flex-1 text-sm outline-none placeholder:text-gray-400 resize-none overflow-hidden"
        data-testid="add-task-input"
      />
    </div>
  );
}

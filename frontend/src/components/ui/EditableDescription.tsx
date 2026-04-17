import React, { useState, useEffect } from "react";
import { LinkedText } from "./LinkedText";
import { useAutoResizeTextarea } from "@/hooks/useAutoResizeTextarea";

interface EditableDescriptionProps {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  className?: string;
  "data-test-id"?: string;
}

export function EditableDescription({
  value,
  onChange,
  onBlur,
  placeholder = "",
  className = "",
  "data-test-id": dataTestId,
}: EditableDescriptionProps) {
  const [isEditing, setIsEditing] = useState(false);
  const textareaRef = useAutoResizeTextarea(value);

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isEditing, textareaRef]);

  const handleClick = () => {
    setIsEditing(true);
  };

  const handleBlur = () => {
    setIsEditing(false);
    onBlur?.();
  };

  const handleChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(event.target.value);
  };

  if (isEditing) {
    return (
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder={placeholder}
        className={`w-full text-sm text-gray-700 border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-accent overflow-hidden min-h-[80px] ${className}`}
        data-testid={dataTestId}
      />
    );
  }

  return (
    <div
      onClick={handleClick}
      className={`w-full text-sm text-gray-700 border border-transparent rounded-lg px-3 py-2 cursor-text hover:border-gray-200 hover:bg-gray-50/50 min-h-[80px] ${className}`}
      data-testid={dataTestId}
    >
      {value ? (
        <LinkedText text={value} />
      ) : (
        <span className="text-gray-400">{placeholder}</span>
      )}
    </div>
  );
}

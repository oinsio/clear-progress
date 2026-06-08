import type React from "react";
import { useCallback, useEffect, useState } from "react";

interface ClampedNumericInputProps {
  id?: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
  className?: string;
  placeholder?: string;
  "data-testid"?: string;
}

export function ClampedNumericInput({
  id,
  value,
  min,
  max,
  onChange,
  className,
  placeholder,
  "data-testid": testId,
}: ClampedNumericInputProps) {
  const [rawValue, setRawValue] = useState(String(value));

  useEffect(() => {
    setRawValue(String(value));
  }, [value]);

  const handleChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const raw = event.target.value;
      setRawValue(raw);

      const parsed = parseInt(raw, 10);
      if (!Number.isNaN(parsed)) {
        const clamped = Math.min(max, Math.max(min, parsed));
        onChange(clamped);
      }
    },
    [min, max, onChange],
  );

  const handleBlur = useCallback(() => {
    const parsed = parseInt(rawValue, 10);
    if (Number.isNaN(parsed)) {
      setRawValue(String(value));
    } else {
      const clamped = Math.min(max, Math.max(min, parsed));
      setRawValue(String(clamped));
      onChange(clamped);
    }
  }, [rawValue, value, min, max, onChange]);

  return (
    <input
      id={id}
      type="number"
      data-testid={testId}
      value={rawValue}
      min={min}
      max={max}
      onChange={handleChange}
      onBlur={handleBlur}
      placeholder={placeholder}
      className={className}
    />
  );
}

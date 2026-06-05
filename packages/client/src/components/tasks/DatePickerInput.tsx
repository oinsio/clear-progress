// implements NFR-A2, NFR-R1 of hide-tasks
import { useTranslation } from "react-i18next";

interface DatePickerInputProps {
  value: string;
  onChange: (date: string) => void;
  min?: string;
  label?: string;
}

export function DatePickerInput({
  value,
  onChange,
  min,
  label,
}: DatePickerInputProps) {
  const { t } = useTranslation();

  return (
    <input
      type="date"
      value={value}
      min={min}
      onChange={(e) => onChange(e.target.value)}
      aria-label={label ?? t("task.selectDate")}
      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
    />
  );
}

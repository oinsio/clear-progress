// implements FR1, FR2, UX3 of hide-tasks
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { type Clock, systemClock } from "@/lib/temporal";
import { DatePickerInput } from "./DatePickerInput";

const DAYS_OFFSET_TOMORROW = 1;

interface HideTaskPanelProps {
  isHidden: boolean;
  appearDate: string;
  onHide: (date: string) => void;
  onUnhide: () => void;
  clock?: Clock;
}

export function HideTaskPanel({
  isHidden,
  appearDate,
  onHide,
  onUnhide,
  clock = systemClock,
}: HideTaskPanelProps) {
  const { t } = useTranslation();
  const [selectedDate, setSelectedDate] = useState("");

  const tomorrowDate = clock
    .plainDateISO()
    .add({ days: DAYS_OFFSET_TOMORROW })
    .toString();
  const isDateValid = selectedDate >= tomorrowDate;

  if (isHidden) {
    return (
      <div
        className="flex items-center justify-between gap-2 p-2"
        data-testid="hide-task-panel"
      >
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {appearDate}
        </span>
        <button
          type="button"
          onClick={onUnhide}
          className="rounded-lg bg-accent px-3 py-1.5 text-sm font-medium text-white"
        >
          {t("task.unhide")}
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 p-2" data-testid="hide-task-panel">
      <DatePickerInput
        value={selectedDate}
        onChange={setSelectedDate}
        min={tomorrowDate}
      />
      <button
        type="button"
        onClick={() => onHide(selectedDate)}
        disabled={!isDateValid}
        className="rounded-lg bg-accent px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
      >
        {t("task.hide")}
      </button>
    </div>
  );
}

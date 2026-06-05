import type { ChangeEvent } from "react";
import { useTranslation } from "react-i18next";
import { isValidDayBoundary } from "@/utils/getLogicalDate";

const DAY_BOUNDARY_INPUT_ID = "day-boundary-input";
const DAY_BOUNDARY_DESCRIPTION_ID = "day-boundary-description";

interface DayBoundarySectionProps {
  dayBoundary: string;
  onDayBoundaryChange: (value: string) => void;
}

/**
 * Settings section for configuring the day boundary (day start time).
 * Uses native `<input type="time">` for platform-native UX.
 *
 * Implements FR10, FR11, NFR-A1, NFR-R1 of day-boundary.
 */
export function DayBoundarySection({
  dayBoundary,
  onDayBoundaryChange,
}: DayBoundarySectionProps) {
  const { t } = useTranslation();

  const handleChange = (event: ChangeEvent<HTMLInputElement>): void => {
    const newValue = event.target.value;
    if (isValidDayBoundary(newValue)) {
      onDayBoundaryChange(newValue);
    }
  };

  return (
    <section data-testid="settings-day-boundary" className="space-y-3">
      <label
        htmlFor={DAY_BOUNDARY_INPUT_ID}
        className="text-sm font-medium text-gray-500 uppercase tracking-wide"
      >
        {t("settings.dayBoundary")}
      </label>
      <input
        type="time"
        id={DAY_BOUNDARY_INPUT_ID}
        data-testid="settings-day-boundary-input"
        value={dayBoundary}
        onChange={handleChange}
        aria-describedby={DAY_BOUNDARY_DESCRIPTION_ID}
        className="block w-full max-w-xs px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 outline-none focus:border-accent transition-colors"
      />
      <p id={DAY_BOUNDARY_DESCRIPTION_ID} className="text-xs text-gray-400">
        {t("settings.dayBoundaryDescription")}
      </p>
    </section>
  );
}

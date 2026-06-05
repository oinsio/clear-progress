import {
  type ChangeEvent,
  type KeyboardEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import { useTranslation } from "react-i18next";
import { isValidDayBoundary } from "@/utils/getLogicalDate";

const HOURS_INPUT_ID = "day-boundary-hours";
const MINUTES_INPUT_ID = "day-boundary-minutes";
const DAY_BOUNDARY_DESCRIPTION_ID = "day-boundary-description";
const MAX_HOURS = 23;
const MAX_MINUTES = 59;
const TWO_DIGIT_LENGTH = 2;

interface DayBoundarySectionProps {
  dayBoundary: string;
  onDayBoundaryChange: (value: string) => void;
}

function padToTwoDigits(value: string): string {
  return value.padStart(TWO_DIGIT_LENGTH, "0");
}

function parseTimeSegments(time: string): { hours: string; minutes: string } {
  const [hours = "00", minutes = "00"] = time.split(":");
  return { hours, minutes };
}

/**
 * Settings section for configuring the day boundary (day start time).
 * Uses two separate numeric inputs for hours and minutes for comfortable typing.
 *
 * Refs track the latest input values to avoid stale state reads during
 * synchronous focus/blur transitions (e.g. auto-focus from hours to minutes).
 *
 * Implements FR10, FR11, NFR-A1, NFR-R1 of day-boundary.
 */
export function DayBoundarySection({
  dayBoundary,
  onDayBoundaryChange,
}: DayBoundarySectionProps) {
  const { t } = useTranslation();
  const { hours: initialHours, minutes: initialMinutes } =
    parseTimeSegments(dayBoundary);

  const [hoursInput, setHoursInput] = useState(initialHours);
  const [minutesInput, setMinutesInput] = useState(initialMinutes);
  const minutesInputRef = useRef<HTMLInputElement>(null);

  const latestHoursRef = useRef(initialHours);
  const latestMinutesRef = useRef(initialMinutes);

  useEffect(() => {
    const { hours, minutes } = parseTimeSegments(dayBoundary);
    setHoursInput(hours);
    setMinutesInput(minutes);
    latestHoursRef.current = hours;
    latestMinutesRef.current = minutes;
  }, [dayBoundary]);

  const commitValue = (hours: string, minutes: string): void => {
    const paddedHours = padToTwoDigits(hours);
    const paddedMinutes = padToTwoDigits(minutes);
    const combined = `${paddedHours}:${paddedMinutes}`;
    if (isValidDayBoundary(combined)) {
      setHoursInput(paddedHours);
      setMinutesInput(paddedMinutes);
      latestHoursRef.current = paddedHours;
      latestMinutesRef.current = paddedMinutes;
      if (combined !== dayBoundary) {
        onDayBoundaryChange(combined);
      }
    } else {
      const current = parseTimeSegments(dayBoundary);
      setHoursInput(current.hours);
      setMinutesInput(current.minutes);
      latestHoursRef.current = current.hours;
      latestMinutesRef.current = current.minutes;
    }
  };

  const handleHoursChange = (event: ChangeEvent<HTMLInputElement>): void => {
    const raw = event.target.value
      .replace(/\D/g, "")
      .slice(0, TWO_DIGIT_LENGTH);
    setHoursInput(raw);
    latestHoursRef.current = raw;
    if (raw.length === TWO_DIGIT_LENGTH) {
      const numericValue = Number(raw);
      if (numericValue <= MAX_HOURS) {
        minutesInputRef.current?.focus();
        minutesInputRef.current?.select();
      }
    }
  };

  const handleMinutesChange = (event: ChangeEvent<HTMLInputElement>): void => {
    const raw = event.target.value
      .replace(/\D/g, "")
      .slice(0, TWO_DIGIT_LENGTH);
    setMinutesInput(raw);
    latestMinutesRef.current = raw;
    if (raw.length === TWO_DIGIT_LENGTH) {
      const numericValue = Number(raw);
      if (numericValue <= MAX_MINUTES) {
        commitValue(latestHoursRef.current, raw);
      }
    }
  };

  const handleBlur = (): void => {
    commitValue(latestHoursRef.current, latestMinutesRef.current);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>): void => {
    if (event.key === "Enter") {
      commitValue(latestHoursRef.current, latestMinutesRef.current);
      (event.target as HTMLInputElement).blur();
    }
  };

  const inputClassName =
    "w-12 text-center px-1 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 outline-none focus:border-accent transition-colors";

  return (
    <section data-testid="settings-day-boundary" className="space-y-3">
      <label
        htmlFor={HOURS_INPUT_ID}
        className="text-sm font-medium text-gray-500 uppercase tracking-wide"
      >
        {t("settings.dayBoundary")}
      </label>
      <div className="flex items-center gap-1 max-w-xs">
        <input
          type="text"
          inputMode="numeric"
          id={HOURS_INPUT_ID}
          data-testid="day-boundary-hours-input"
          value={hoursInput}
          maxLength={TWO_DIGIT_LENGTH}
          onChange={handleHoursChange}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          onFocus={(event) => event.target.select()}
          aria-label={t("settings.dayBoundaryHours")}
          aria-describedby={DAY_BOUNDARY_DESCRIPTION_ID}
          className={inputClassName}
        />
        <span className="text-sm text-gray-400 font-medium">:</span>
        <input
          type="text"
          inputMode="numeric"
          ref={minutesInputRef}
          id={MINUTES_INPUT_ID}
          data-testid="day-boundary-minutes-input"
          value={minutesInput}
          maxLength={TWO_DIGIT_LENGTH}
          onChange={handleMinutesChange}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          onFocus={(event) => event.target.select()}
          aria-label={t("settings.dayBoundaryMinutes")}
          aria-describedby={DAY_BOUNDARY_DESCRIPTION_ID}
          className={inputClassName}
        />
      </div>
      <p id={DAY_BOUNDARY_DESCRIPTION_ID} className="text-xs text-gray-400">
        {t("settings.dayBoundaryDescription")}
      </p>
    </section>
  );
}

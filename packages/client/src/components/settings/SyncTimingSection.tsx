import {
  type ChangeEvent,
  type KeyboardEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import { useTranslation } from "react-i18next";
import {
  MAX_AUTO_SYNC_DELAY_SEC,
  MAX_SYNC_INTERVAL_MIN,
  MIN_AUTO_SYNC_DELAY_SEC,
  MIN_SYNC_INTERVAL_MIN,
} from "@/constants";
import { SyncIndicator } from "./SyncIndicator";

const SYNC_INTERVAL_INPUT_ID = "sync-interval";
const AUTO_SYNC_DELAY_INPUT_ID = "auto-sync-delay";
const SYNC_INTERVAL_DESCRIPTION_ID = "sync-interval-description";
const AUTO_SYNC_DELAY_DESCRIPTION_ID = "auto-sync-delay-description";

interface SyncTimingSectionProps {
  syncInterval: number | null;
  autoSyncDelay: number;
  onSyncIntervalChange: (value: number | null) => Promise<void>;
  onAutoSyncDelayChange: (value: number) => Promise<void>;
}

interface TimingFieldProps {
  inputId: string;
  testId: string;
  descriptionId: string;
  labelKey: string;
  unitKey: string;
  descriptionKey: string;
  hintKey: string;
  settingKey: string;
  value: number | null;
  emptyValue: number | null;
  min: number;
  max: number;
  onChange: (value: number | null) => Promise<void>;
}

function toDisplayValue(
  value: number | null,
  emptyValue: number | null,
): string {
  return value === emptyValue ? "" : String(value);
}

/**
 * A single labeled numeric timing input (sync interval or auto-sync delay).
 * Commits on blur/Enter, reverts on invalid input or write failure, and
 * shows a description or an "empty means X" hint depending on state.
 */
function TimingField({
  inputId,
  testId,
  descriptionId,
  labelKey,
  unitKey,
  descriptionKey,
  hintKey,
  settingKey,
  value,
  emptyValue,
  min,
  max,
  onChange,
}: TimingFieldProps) {
  const { t } = useTranslation();
  const [inputValue, setInputValue] = useState(() =>
    toDisplayValue(value, emptyValue),
  );
  const [hasWriteError, setHasWriteError] = useState(false);
  const lastCommittedValueRef = useRef(value);
  const isInitialMountRef = useRef(true);

  // Skip the first invocation: the initial state above already reflects the
  // mount-time `value`, so re-applying it here would be a redundant no-op
  // that only risks a visible flicker if it ever diverges.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  // biome-ignore lint/correctness/useExhaustiveDependencies: emptyValue is stable per field and re-running on its change would be a redundant no-op
  useEffect(() => {
    if (isInitialMountRef.current) {
      isInitialMountRef.current = false;
      return;
    }
    setInputValue(toDisplayValue(value, emptyValue));
    lastCommittedValueRef.current = value;
  }, [value]);

  const commitValue = async (rawInput: string): Promise<void> => {
    const trimmedInput = rawInput.trim();
    let parsedValue: number | null;

    if (trimmedInput === "") {
      parsedValue = emptyValue;
    } else {
      const numericValue = Number(trimmedInput);
      const isValid =
        Number.isInteger(numericValue) &&
        numericValue >= min &&
        numericValue <= max;
      if (!isValid) {
        setInputValue(toDisplayValue(value, emptyValue));
        return;
      }
      parsedValue = numericValue;
    }

    setInputValue(toDisplayValue(parsedValue, emptyValue));

    // Skip a redundant write when the value already matches the last commit
    // (e.g. Enter followed immediately by blur on the same edit).
    if (parsedValue === lastCommittedValueRef.current) {
      setHasWriteError(false);
      return;
    }

    const previousCommittedValue = lastCommittedValueRef.current;
    lastCommittedValueRef.current = parsedValue;

    try {
      await onChange(parsedValue);
      setHasWriteError(false);
    } catch {
      lastCommittedValueRef.current = previousCommittedValue;
      setInputValue(toDisplayValue(value, emptyValue));
      setHasWriteError(true);
    }
  };

  const handleChange = (event: ChangeEvent<HTMLInputElement>): void => {
    setInputValue(event.target.value);
  };

  const handleBlur = (): void => {
    void commitValue(inputValue);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>): void => {
    if (event.key === "Enter") {
      void commitValue(inputValue);
    }
  };

  const isEmptyState = value === emptyValue;

  return (
    <div className="space-y-1">
      <label
        htmlFor={inputId}
        className="text-sm font-medium text-gray-500 uppercase tracking-wide flex items-center gap-2"
      >
        {t(labelKey)}
        <SyncIndicator settingKey={settingKey} />
      </label>
      <div className="flex items-center gap-2 max-w-xs">
        <input
          type="text"
          inputMode="numeric"
          id={inputId}
          data-testid={testId}
          value={inputValue}
          onChange={handleChange}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          onFocus={(event) => event.target.select()}
          aria-label={t(labelKey)}
          aria-describedby={descriptionId}
          className="w-20 text-center px-2 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 outline-none focus:border-accent transition-colors"
        />
        <span className="text-sm text-gray-500 font-medium">{t(unitKey)}</span>
      </div>
      <p id={descriptionId} className="text-xs text-gray-500">
        {isEmptyState ? t(hintKey) : t(descriptionKey)}
      </p>
      {hasWriteError && (
        <p role="alert" className="text-xs text-red-500">
          {t("settings.syncTimingWriteError")}
        </p>
      )}
    </div>
  );
}

/**
 * Settings section for configuring sync timing: how often background sync
 * runs, and how long to wait after an edit before pushing it.
 *
 * Implements FR8, D6 of configurable-sync-timing.
 */
export function SyncTimingSection({
  syncInterval,
  autoSyncDelay,
  onSyncIntervalChange,
  onAutoSyncDelayChange,
}: SyncTimingSectionProps) {
  return (
    <section data-testid="settings-sync-timing" className="space-y-4">
      <TimingField
        inputId={SYNC_INTERVAL_INPUT_ID}
        testId="sync-interval-input"
        descriptionId={SYNC_INTERVAL_DESCRIPTION_ID}
        labelKey="settings.syncInterval"
        unitKey="settings.syncIntervalUnit"
        descriptionKey="settings.syncIntervalDescription"
        hintKey="settings.syncIntervalDisabledHint"
        settingKey="sync_interval"
        value={syncInterval}
        emptyValue={null}
        min={MIN_SYNC_INTERVAL_MIN}
        max={MAX_SYNC_INTERVAL_MIN}
        onChange={onSyncIntervalChange}
      />
      <TimingField
        inputId={AUTO_SYNC_DELAY_INPUT_ID}
        testId="auto-sync-delay-input"
        descriptionId={AUTO_SYNC_DELAY_DESCRIPTION_ID}
        labelKey="settings.autoSyncDelay"
        unitKey="settings.autoSyncDelayUnit"
        descriptionKey="settings.autoSyncDelayDescription"
        hintKey="settings.autoSyncDelayImmediateHint"
        settingKey="auto_sync_delay"
        value={autoSyncDelay}
        emptyValue={0}
        min={MIN_AUTO_SYNC_DELAY_SEC}
        max={MAX_AUTO_SYNC_DELAY_SEC}
        onChange={(value) => onAutoSyncDelayChange(value ?? 0)}
      />
    </section>
  );
}

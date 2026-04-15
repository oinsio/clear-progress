import React, { useState, useCallback } from "react";
import { ArrowLeft, ChevronDown, Inbox } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { RepeatRule, Box } from "@/types/common";
import { cn } from "@/shared/lib/cn";
import { getDaysInMonth } from "@/utils/dateHelpers";
import { TodayBoxIcon, WeekBoxIcon, LaterBoxIcon } from "./BoxIcons";

const TARGET_BOX_ICONS: Record<Box, React.FC<{ className?: string }>> = {
  inbox: ({ className }: { className?: string }) => <Inbox className={className} />,
  today: TodayBoxIcon,
  week: WeekBoxIcon,
  later: LaterBoxIcon,
};

const TARGET_BOX_ORDER: Box[] = ["inbox", "today", "week", "later"];

interface RepeatRuleSelectorProps {
  value: RepeatRule | null;
  onChange: (rule: RepeatRule | null) => void;
  onBack: () => void;
}

type Step = "type" | "fixed_params" | "after_completion_params" | "placement";

interface State {
  step: Step;
  type: "fixed" | "after_completion" | null;
  // Для fixed
  frequency: "daily" | "weekly" | "monthly" | "yearly" | null;
  interval: number;
  weekdays: number[];
  dayOfMonth: number;
  monthAndDay: { month: number; day: number };
  // Для after_completion
  delayDays: number;
  // Общее
  targetBox: Box;
  advanceDays: number;
}

const MIN_INTERVAL = 1;
const MAX_INTERVAL = 365;
const MIN_DELAY_DAYS = 1;
const MAX_DELAY_DAYS = 365;
const MIN_ADVANCE_DAYS = 0;
const MAX_ADVANCE_DAYS = 90;
const MIN_DAY_OF_MONTH = 1;
const MAX_DAY_OF_MONTH = 31;

const ALL_WEEKDAYS = [1, 2, 3, 4, 5, 6, 7] as const;
const ALL_MONTHS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const;

export function RepeatRuleSelector({
  value,
  onChange,
  onBack,
}: RepeatRuleSelectorProps) {
  const { t } = useTranslation();
  const [isMonthPanelOpen, setMonthPanelOpen] = useState(false);

  const [state, setState] = useState<State>(() => {
    if (!value) {
      return {
        step: "type",
        type: null,
        frequency: null,
        interval: 1,
        weekdays: [],
        dayOfMonth: 1,
        monthAndDay: { month: 1, day: 1 },
        delayDays: 1,
        targetBox: "today",
        advanceDays: 0,
      };
    }

    if (value.type === "after_completion") {
      return {
        step: "type",
        type: "after_completion",
        frequency: null,
        interval: 1,
        weekdays: [],
        dayOfMonth: 1,
        monthAndDay: { month: 1, day: 1 },
        delayDays: value.delay_days ?? 1,
        targetBox: value.target_box,
        advanceDays: value.advance_days,
      };
    }

    // type === "fixed"
    return {
      step: "type",
      type: "fixed",
      frequency: value.frequency ?? "daily",
      interval: value.interval ?? 1,
      weekdays: value.weekdays ?? [],
      dayOfMonth: value.day_of_month ?? 1,
      monthAndDay: value.month_and_day ?? { month: 1, day: 1 },
      delayDays: 1,
      targetBox: value.target_box,
      advanceDays: value.advance_days,
    };
  });

  const handleTypeSelect = useCallback((type: "fixed" | "after_completion") => {
    setState((prev) => ({
      ...prev,
      type,
      step: type === "fixed" ? "fixed_params" : "after_completion_params",
    }));
  }, []);

  const handleFrequencySelect = useCallback(
    (frequency: "daily" | "weekly" | "monthly" | "yearly") => {
      setState((prev) => ({ ...prev, frequency }));
    },
    [],
  );

  const handleIntervalChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const parsed = parseInt(event.target.value, 10);
      if (!isNaN(parsed)) {
        setState((prev) => ({
          ...prev,
          interval: Math.min(MAX_INTERVAL, Math.max(MIN_INTERVAL, parsed)),
        }));
      }
    },
    [],
  );

  const handleWeekdayToggle = useCallback((day: number) => {
    setState((prev) => ({
      ...prev,
      weekdays: prev.weekdays.includes(day)
        ? prev.weekdays.filter((d) => d !== day)
        : [...prev.weekdays, day],
    }));
  }, []);

  const handleDayOfMonthChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const parsed = parseInt(event.target.value, 10);
      if (!isNaN(parsed)) {
        setState((prev) => ({
          ...prev,
          dayOfMonth: Math.min(
            MAX_DAY_OF_MONTH,
            Math.max(MIN_DAY_OF_MONTH, parsed),
          ),
        }));
      }
    },
    [],
  );

  const handleMonthSelect = useCallback((month: number) => {
    setState((prev) => {
      const maxDaysInNewMonth = getDaysInMonth(month);
      let newDay = prev.monthAndDay.day;

      // Если текущий день 30 или 31, а новый месяц — февраль, устанавливаем 28
      if ((prev.monthAndDay.day === 30 || prev.monthAndDay.day === 31) && month === 2) {
        newDay = 28;
      }
      // Если текущий день 31, а новый месяц имеет только 30 дней, устанавливаем 30
      else if (prev.monthAndDay.day === 31 && maxDaysInNewMonth === 30) {
        newDay = 30;
      }

      return {
        ...prev,
        monthAndDay: {
          month,
          day: newDay,
        },
      };
    });
    setMonthPanelOpen(false);
  }, []);

  const handleDayChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const parsed = parseInt(event.target.value, 10);
      if (!isNaN(parsed)) {
        setState((prev) => {
          const maxDaysInMonth = getDaysInMonth(prev.monthAndDay.month);
          return {
            ...prev,
            monthAndDay: {
              ...prev.monthAndDay,
              day: Math.min(maxDaysInMonth, Math.max(MIN_DAY_OF_MONTH, parsed)),
            },
          };
        });
      }
    },
    [],
  );

  const handleDelayDaysChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const parsed = parseInt(event.target.value, 10);
      if (!isNaN(parsed)) {
        setState((prev) => ({
          ...prev,
          delayDays: Math.min(MAX_DELAY_DAYS, Math.max(MIN_DELAY_DAYS, parsed)),
        }));
      }
    },
    [],
  );

  const handleTargetBoxSelect = useCallback(
    (targetBox: Box) => {
      setState((prev) => ({ ...prev, targetBox }));
    },
    [],
  );

  const handleAdvanceDaysChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const parsed = parseInt(event.target.value, 10);
      if (!isNaN(parsed)) {
        setState((prev) => ({
          ...prev,
          advanceDays: Math.min(
            MAX_ADVANCE_DAYS,
            Math.max(MIN_ADVANCE_DAYS, parsed),
          ),
        }));
      }
    },
    [],
  );

  const handleFixedParamsNext = useCallback(() => {
    // Валидация
    if (state.frequency === "weekly" && state.weekdays.length === 0) {
      return; // Не переходим, если не выбраны дни недели
    }
    setState((prev) => ({ ...prev, step: "placement" }));
  }, [state.frequency, state.weekdays.length]);

  const handleAfterCompletionParamsNext = useCallback(() => {
    setState((prev) => ({ ...prev, step: "placement" }));
  }, []);

  const handleApply = useCallback(() => {
    if (state.type === "after_completion") {
      const rule: RepeatRule = {
        type: "after_completion",
        delay_days: state.delayDays,
        target_box: state.targetBox,
        advance_days: state.advanceDays,
      };
      onChange(rule);
    } else if (state.type === "fixed" && state.frequency) {
      const rule: RepeatRule = {
        type: "fixed",
        frequency: state.frequency,
        interval: state.interval,
        target_box: state.targetBox,
        advance_days: state.advanceDays,
      };

      if (state.frequency === "weekly") {
        rule.weekdays = state.weekdays;
      } else if (state.frequency === "monthly") {
        rule.day_of_month = state.dayOfMonth;
      } else if (state.frequency === "yearly") {
        rule.month_and_day = state.monthAndDay;
      }

      onChange(rule);
    }
    onBack();
  }, [state, onChange, onBack]);

  const handleBack = useCallback(() => {
    if (state.step === "type") {
      onBack();
    } else if (
      state.step === "fixed_params" ||
      state.step === "after_completion_params"
    ) {
      setState((prev) => ({ ...prev, step: "type" }));
    } else if (state.step === "placement") {
      setState((prev) => ({
        ...prev,
        step:
          prev.type === "fixed" ? "fixed_params" : "after_completion_params",
      }));
    }
  }, [state.step, onBack]);

  const handleRemove = useCallback(() => {
    onChange(null);
    onBack();
  }, [onChange, onBack]);

  // Шаг 1: Выбор типа
  if (state.step === "type") {
    return (
      <div data-testid="repeat-type-step">
        <div className="flex items-center gap-2 px-4 pt-4 pb-2 border-b border-gray-100">
          <button
            type="button"
            data-testid="repeat-back"
            onClick={handleBack}
            aria-label={t("taskEdit.back")}
            className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft size={18} />
          </button>
          <h2 className="text-base font-semibold text-gray-800">
            {t("taskEdit.selectRepeatType")}
          </h2>
        </div>
        <div className="px-4 py-3 flex flex-col gap-2">
          <button
            type="button"
            data-testid="repeat-type-fixed"
            onClick={() => handleTypeSelect("fixed")}
            className="text-left text-sm px-3 py-2.5 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
          >
            {t("repeat.fixed")}
          </button>
          <button
            type="button"
            data-testid="repeat-type-after-completion"
            onClick={() => handleTypeSelect("after_completion")}
            className="text-left text-sm px-3 py-2.5 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
          >
            {t("repeat.afterCompletion", { count: state.delayDays })}
          </button>
          {value && (
            <button
              type="button"
              data-testid="repeat-remove"
              onClick={handleRemove}
              className="text-left text-sm px-3 py-2.5 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
            >
              {t("repeat.none")}
            </button>
          )}
        </div>
      </div>
    );
  }

  // Шаг 2a: Параметры для fixed
  if (state.step === "fixed_params") {
    return (
      <div data-testid="repeat-fixed-params-step">
        <div className="flex items-center gap-2 px-4 pt-4 pb-2 border-b border-gray-100">
          <button
            type="button"
            data-testid="repeat-back"
            onClick={handleBack}
            aria-label={t("taskEdit.back")}
            className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft size={18} />
          </button>
          <h2 className="text-base font-semibold text-gray-800">
            {t("repeat.fixed")}
          </h2>
        </div>
        <div className="px-4 py-4 flex flex-col gap-4">
          {/* Сегментированный control: Daily / Weekly / Monthly / Yearly */}
          <div className="flex gap-2">
            {(["daily", "weekly", "monthly", "yearly"] as const).map((freq) => (
              <button
                key={freq}
                type="button"
                data-testid={`repeat-frequency-${freq}`}
                onClick={() => handleFrequencySelect(freq)}
                className={cn(
                  "flex-1 py-2 text-xs font-medium rounded-lg transition-colors",
                  state.frequency === freq
                    ? "bg-accent text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200",
                )}
              >
                {t(`repeat.${freq}`)}
              </button>
            ))}
          </div>

          {/* Интервал */}
          {state.frequency && (
            <div className="flex flex-col gap-2">
              <label
                htmlFor="repeat-interval"
                className="text-sm text-gray-600"
              >
                {state.frequency === "daily" && t("repeat.intervalDays", { count: state.interval })}
                {state.frequency === "weekly" && t("repeat.intervalWeeks", { count: state.interval })}
                {state.frequency === "monthly" && t("repeat.intervalMonths", { count: state.interval })}
                {state.frequency === "yearly" && t("repeat.intervalYears", { count: state.interval })}
              </label>
              <input
                id="repeat-interval"
                type="number"
                data-testid="repeat-interval-input"
                value={state.interval}
                min={MIN_INTERVAL}
                max={MAX_INTERVAL}
                onChange={handleIntervalChange}
                className="w-full text-sm text-gray-800 border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-accent"
              />
            </div>
          )}

          {/* Для Weekly: multi choose дней недели */}
          {state.frequency === "weekly" && (
            <div className="flex flex-col gap-2">
              <label className="text-sm text-gray-600">
                {t("repeat.weekdays")}
              </label>
              <div className="flex gap-2 justify-center flex-wrap">
                {ALL_WEEKDAYS.map((day) => {
                  const isSelected = state.weekdays.includes(day);
                  return (
                    <button
                      key={day}
                      type="button"
                      data-testid={`repeat-weekday-${day}`}
                      aria-pressed={isSelected}
                      onClick={() => handleWeekdayToggle(day)}
                      className={cn(
                        "w-10 h-10 rounded-full text-sm font-medium transition-colors",
                        isSelected
                          ? "bg-accent text-white"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200",
                      )}
                    >
                      {t(`repeat.weekday${day}`)}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Для Monthly: числовой ввод 1—31 */}
          {state.frequency === "monthly" && (
            <div className="flex flex-col gap-2">
              <label
                htmlFor="repeat-day-of-month"
                className="text-sm text-gray-600"
              >
                {t("repeat.dayOfMonthLabel", { count: state.dayOfMonth, ordinal: true })}
              </label>
              <input
                id="repeat-day-of-month"
                type="number"
                data-testid="repeat-day-of-month-input"
                value={state.dayOfMonth}
                min={MIN_DAY_OF_MONTH}
                max={MAX_DAY_OF_MONTH}
                onChange={handleDayOfMonthChange}
                className="w-full text-sm text-gray-800 border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-accent"
              />
            </div>
          )}

          {/* Для Yearly: выбор месяца (выпадающий список) + числовой ввод дня */}
          {state.frequency === "yearly" && (
            <div className="flex flex-col gap-2">
              <label className="text-sm text-gray-600">
                {t("repeat.monthAndDayWithValue", {
                  count: state.monthAndDay.day,
                  month: t(`repeat.monthGenitive${state.monthAndDay.month}`),
                  ordinal: true
                })}
              </label>

              {/* Адаптивный контейнер: вертикально на узких экранах, горизонтально на широких */}
              <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
                {/* Поле выбора месяца */}
                <div className="flex flex-col gap-2 sm:flex-1">
                  <label htmlFor="repeat-month-trigger" className="text-sm text-gray-600">
                    {t("repeat.month")}
                  </label>
                  {/* Триггер выбора месяца */}
                  <button
                    id="repeat-month-trigger"
                    type="button"
                    data-testid="repeat-month-trigger"
                    onClick={() => setMonthPanelOpen(!isMonthPanelOpen)}
                    className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors w-full"
                  >
                    <span className="text-sm font-medium text-gray-800">
                      {t(`repeat.month${state.monthAndDay.month}`)}
                    </span>
                    <ChevronDown
                      size={16}
                      className={cn(
                        "ml-auto transition-transform text-gray-400",
                        isMonthPanelOpen && "rotate-180"
                      )}
                    />
                  </button>

                  {/* Inline-панель со списком месяцев */}
                  {isMonthPanelOpen && (
                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                      <div className="flex flex-col gap-0.5 p-2 max-h-60 overflow-y-auto">
                        {ALL_MONTHS.map((month) => (
                          <button
                            key={month}
                            type="button"
                            data-testid={`repeat-month-option-${month}`}
                            onClick={() => handleMonthSelect(month)}
                            className={cn(
                              "text-left text-sm px-3 py-2 rounded-lg transition-colors",
                              state.monthAndDay.month === month
                                ? "bg-accent/10 text-accent font-medium"
                                : "text-gray-700 hover:bg-gray-100"
                            )}
                          >
                            {t(`repeat.month${month}`)}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Поле ввода дня */}
                <div className="flex flex-col gap-2 sm:flex-1">
                  <label htmlFor="repeat-day-input" className="text-sm text-gray-600">
                    {t("repeat.dayOfMonth")}
                  </label>
                  <input
                    id="repeat-day-input"
                    type="number"
                    data-testid="repeat-day-input"
                    value={state.monthAndDay.day}
                    min={MIN_DAY_OF_MONTH}
                    max={MAX_DAY_OF_MONTH}
                    onChange={handleDayChange}
                    placeholder={t("repeat.dayOfMonth")}
                    className="w-full text-sm text-gray-800 border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-accent"
                  />
                </div>
              </div>
            </div>
          )}

          <button
            type="button"
            data-testid="repeat-fixed-next"
            onClick={handleFixedParamsNext}
            disabled={
              !state.frequency ||
              (state.frequency === "weekly" && state.weekdays.length === 0)
            }
            className="w-full py-2.5 text-sm text-white bg-accent rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {t("repeat.next")}
          </button>
        </div>
      </div>
    );
  }

  // Шаг 2b: Параметры для after_completion
  if (state.step === "after_completion_params") {
    return (
      <div data-testid="repeat-after-completion-params-step">
        <div className="flex items-center gap-2 px-4 pt-4 pb-2 border-b border-gray-100">
          <button
            type="button"
            data-testid="repeat-back"
            onClick={handleBack}
            aria-label={t("taskEdit.back")}
            className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft size={18} />
          </button>
          <h2 className="text-base font-semibold text-gray-800">
            {t("repeat.afterCompletion", { count: state.delayDays })}
          </h2>
        </div>
        <div className="px-4 py-4 flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label
              htmlFor="repeat-delay-days"
              className="text-sm text-gray-600"
            >
              {t("repeat.delayDays")}
            </label>
            <input
              id="repeat-delay-days"
              type="number"
              data-testid="repeat-delay-days-input"
              value={state.delayDays}
              min={MIN_DELAY_DAYS}
              max={MAX_DELAY_DAYS}
              onChange={handleDelayDaysChange}
              className="w-full text-sm text-gray-800 border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-accent"
            />
          </div>
          <button
            type="button"
            data-testid="repeat-after-completion-next"
            onClick={handleAfterCompletionParamsNext}
            className="w-full py-2.5 text-sm text-white bg-accent rounded-xl hover:opacity-90 transition-opacity"
          >
            {t("repeat.next")}
          </button>
        </div>
      </div>
    );
  }

  // Шаг 3: Куда поместить
  if (state.step === "placement") {
    return (
      <div data-testid="repeat-placement-step">
        <div className="flex items-center gap-2 px-4 pt-4 pb-2 border-b border-gray-100">
          <button
            type="button"
            data-testid="repeat-back"
            onClick={handleBack}
            aria-label={t("taskEdit.back")}
            className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft size={18} />
          </button>
          <h2 className="text-base font-semibold text-gray-800">
            {t("repeat.targetBox")}
          </h2>
        </div>
        <div className="px-4 py-4 flex flex-col gap-4">
          {/* Сегментированный control: Inbox / Today / Week / Later */}
          <div className="flex gap-1">
            {TARGET_BOX_ORDER.map((box) => {
              const Icon = TARGET_BOX_ICONS[box];
              const isActive = state.targetBox === box;
              return (
                <button
                  key={box}
                  type="button"
                  data-testid={`repeat-target-box-${box}`}
                  aria-label={t(`box.${box}`)}
                  aria-pressed={isActive}
                  onClick={() => handleTargetBoxSelect(box)}
                  className={cn(
                    "flex items-center justify-center w-10 h-10 rounded-full transition-colors",
                    isActive
                      ? "text-accent"
                      : "text-gray-400 hover:text-gray-600 hover:bg-gray-100",
                  )}
                >
                  <Icon className="w-7 h-7" />
                </button>
              );
            })}
          </div>

          {/* Числовой ввод: "Показать за ___ дней до даты" */}
          <div className="flex flex-col gap-2">
            <label
              htmlFor="repeat-advance-days"
              className="text-sm text-gray-600"
            >
              {t("repeat.advanceDays", { count: state.advanceDays })}
            </label>
            <input
              id="repeat-advance-days"
              type="number"
              data-testid="repeat-advance-days-input"
              value={state.advanceDays}
              min={MIN_ADVANCE_DAYS}
              max={MAX_ADVANCE_DAYS}
              onChange={handleAdvanceDaysChange}
              className="w-full text-sm text-gray-800 border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-accent"
            />
          </div>

          <button
            type="button"
            data-testid="repeat-apply"
            onClick={handleApply}
            className="w-full py-2.5 text-sm text-white bg-accent rounded-xl hover:opacity-90 transition-opacity"
          >
            {t("repeat.apply")}
          </button>
        </div>
      </div>
    );
  }

  return null;
}

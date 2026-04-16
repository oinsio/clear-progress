import { Temporal, type Clock, systemClock } from "@/lib/temporal";
import type { ISOTimestamp, ISODate } from "@/types/entities";

/**
 * Преобразует Clock или Temporal.Instant в ISOTimestamp (branded type).
 * Без аргументов возвращает текущее время через systemClock.
 *
 * @param clockOrInstant - Clock для получения текущего времени, или Temporal.Instant для обёртки
 * @returns ISO 8601 timestamp string с branded type
 */
export function toISOTimestamp(
  clockOrInstant?: Clock | Temporal.Instant,
): ISOTimestamp {
  if (!clockOrInstant) {
    return systemClock.instant().toString() as ISOTimestamp;
  }
  if (clockOrInstant instanceof Temporal.Instant) {
    return clockOrInstant.toString() as ISOTimestamp;
  }
  return clockOrInstant.instant().toString() as ISOTimestamp;
}

/**
 * Преобразует строку формата YYYY-MM-DD в ISODate (branded type).
 * Если dateString не передан, используется текущая дата.
 * Valid формат через Temporal.PlainDate.from().
 *
 * @param dateString - Строка даты в формате YYYY-MM-DD
 * @param clock - Clock для получения текущей даты (по умолчанию systemClock)
 * @returns ISO 8601 date string с branded type
 * @throws {RangeError} Если dateString не соответствует формату YYYY-MM-DD
 */
export function toISODate(
  dateString?: string,
  clock: Clock = systemClock,
): ISODate {
  const value = dateString ?? clock.plainDateISO().toString();
  Temporal.PlainDate.from(value); // throws if invalid
  return value as ISODate;
}

/**
 * Возвращает максимальное количество дней в указанном месяце.
 * Для февраля возвращает 29 (разрешаем ввод 29, хотя в невисокосный год будет скорректировано при расчете).
 *
 * @param month - Номер месяца (1-12)
 * @returns Количество дней в месяце
 */
export function getDaysInMonth(month: number): number {
  const DAYS_IN_MONTH: Record<number, number> = {
    1: 31, // Январь
    2: 29, // Февраль (разрешаем 29)
    3: 31, // Март
    4: 30, // Апрель
    5: 31, // Май
    6: 30, // Июнь
    7: 31, // Июль
    8: 31, // Август
    9: 30, // Сентябрь
    10: 31, // Октябрь
    11: 30, // Ноябрь
    12: 31, // Декабрь
  };

  return DAYS_IN_MONTH[month] ?? 31;
}

/**
 * Возвращает текущую дату для использования в качестве значений по умолчанию
 * при настройке повторяющихся задач.
 *
 * @param clock - Clock для получения текущей даты (по умолчанию systemClock)
 * @returns Объект с текущим днём месяца и месяцем
 */
export function getCurrentDateDefaults(
  clock: Clock = systemClock,
): {
  dayOfMonth: number;
  month: number;
  day: number;
} {
  const today = clock.plainDateISO();

  return {
    dayOfMonth: today.day,
    month: today.month,
    day: today.day,
  };
}

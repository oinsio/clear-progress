import { Temporal, type Clock, systemClock } from "@/lib/temporal";
import type { ISOTimestamp, ISODate } from "@/types/entities";

/**
 * Преобразует Temporal.Instant в ISOTimestamp (branded type).
 * Если instant не передан, используется текущее время.
 *
 * @param instant - Temporal.Instant для преобразования
 * @returns ISO 8601 timestamp string с branded type
 */
export function toISOTimestamp(instant?: Temporal.Instant): ISOTimestamp {
  const value = instant ?? Temporal.Now.instant();
  return value.toString() as ISOTimestamp;
}

/**
 * Преобразует строку формата YYYY-MM-DD в ISODate (branded type).
 * Если dateString не передан, используется текущая дата.
 *
 * @param dateString - Строка даты в формате YYYY-MM-DD
 * @returns ISO 8601 date string с branded type
 */
export function toISODate(dateString?: string): ISODate {
  const value = dateString ?? Temporal.Now.plainDateISO().toString();
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

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
  let instant: Temporal.Instant;
  if (!clockOrInstant) {
    instant = systemClock.instant();
  } else if (clockOrInstant instanceof Temporal.Instant) {
    instant = clockOrInstant;
  } else {
    instant = clockOrInstant.instant();
  }
  // Нормализация: всегда 3 десятичных знака для безопасного строкового сравнения
  // Temporal.Instant.toString() может опустить дробную часть на границе секунды
  // (например "2026-04-16T10:30:00Z"), что ломает лексикографическое сравнение
  // с Date.toISOString() (всегда "2026-04-16T10:30:00.000Z").
  return instant.toString({ fractionalSecondDigits: 3 }) as ISOTimestamp;
}

const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Sanityze строку даты из произвольного формата в ISO date (YYYY-MM-DD).
 * Обрабатывает:
 * - ISO date: "2026-04-19" → as-is
 * - ISO timestamp: "2026-04-19T19:00:00.000Z" → "2026-04-19"
 * - Date.toString(): "Sun Apr 19 2026 19:00:00 GMT+0000 (...)" → "2026-04-19"
 * - Пустая строка: "" → ""
 *
 * @returns Строка в формате YYYY-MM-DD или пустая строка
 */
export function sanitizeDateOnly(value: string): string {
  if (!value) return "";
  if (ISO_DATE_REGEX.test(value)) return value;

  // ISO timestamp — извлекаем дату до "T"
  const timestampIndex = value.indexOf("T");
  if (timestampIndex > 0) {
    const datePart = value.substring(0, timestampIndex);
    if (ISO_DATE_REGEX.test(datePart)) return datePart;
  }

  // Fallback: Date.toString() и другие форматы — parse через Date
  const parsed = new Date(value);
  if (!isNaN(parsed.getTime())) {
    return parsed.toISOString().substring(0, 10);
  }

  return "";
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

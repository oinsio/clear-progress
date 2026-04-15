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
 * @returns Объект с текущим днём месяца и месяцем
 */
export function getCurrentDateDefaults(): {
  dayOfMonth: number;
  month: number;
  day: number;
} {
  const now = new Date();
  const day = now.getDate(); // 1-31
  const month = now.getMonth() + 1; // 1-12 (getMonth() возвращает 0-11)

  return {
    dayOfMonth: day,
    month,
    day,
  };
}
